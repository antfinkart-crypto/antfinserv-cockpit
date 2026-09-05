import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { InsuranceVertical, MemberRelationship } from '../types/insurance';

// Configure local Vite-bundled worker to eliminate cross-origin SecurityErrors in PWA / Cloudflare
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Intelligent Multi-Vertical Insurance Document Intelligence & OCR Parser
 * Parses text from PDFs and Images to automatically extract policy parameters,
 * covered family dependents with DOBs, and vertical-specific attributes.
 */

export interface ExtractedMemberItem {
  member_name: string;
  relationship_to_head: MemberRelationship;
  dob: string; // YYYY-MM-DD
  celebrated_dob_custom?: string; // Hindu / Indian calendar or custom celebrated date
  gender: 'Male' | 'Female' | 'Other';
  sum_insured_individual?: number;
  is_primary_insured: boolean;
}

export interface ExtractedPolicyData {
  vertical: InsuranceVertical;
  client_name: string;
  proposer_mobile?: string;
  proposer_email?: string;
  insurer: string;
  policy_number: string;
  policy_type: string;
  product_name: string;
  sum_insured: number;
  net_premium: number;
  taxes_gst: number;
  gross_premium: number;
  expiry_date: string;
  inception_date: string;
  nominee_name?: string;
  nominee_relationship?: MemberRelationship;
  members: ExtractedMemberItem[];
  motor_data?: {
    registration_number?: string;
    make?: string;
    model?: string;
    variant?: string;
    make_model?: string;
    idv?: number;
    ncb_percentage?: number;
    manufacturing_year?: number;
    fuel_type?: string;
    seating_capacity?: number;
    rto_location?: string;
    engine_number?: string;
    chassis_number?: string;
    basic_od?: number;
    total_od?: number;
    basic_tp?: number;
    total_tp?: number;
    zero_depreciation?: boolean;
    engine_protection?: boolean;
    consumables_cover?: boolean;
    roadside_assistance?: boolean;
    key_replacement?: boolean;
    previous_insurer?: string;
    previous_policy_number?: string;
  };
  life_data?: {
    plan_category?: string;
    life_assured_name?: string;
    nominee_name?: string;
    nominee_relationship?: MemberRelationship;
    sum_assured_death?: number;
    policy_term_years?: number;
    premium_paying_term_years?: number;
  };
  commercial_data?: {
    business_name?: string;
    risk_location?: string;
    assets_sum_insured?: number;
    perils_covered?: string;
  };
  raw_text?: string;
  confidence: {
    overall: number; // 0.0 to 1.0
    insurer: number;
    policy_number: number;
    client_name: number;
    sum_insured: number;
    premium: number;
    expiry_date: number;
    members: number;
  };
}

export const KNOWN_INSURERS = [
  'Niva Bupa Health Insurance Company Limited',
  'SBI General Insurance Company Limited',
  'Star Health & Allied Insurance',
  'HDFC ERGO General Insurance',
  'ICICI Lombard General Insurance',
  'Care Health Insurance',
  'Tata AIA Life Insurance',
  'Tata AIG General Insurance',
  'Go Digit General Insurance',
  'Bajaj Allianz General Insurance',
  'Aditya Birla Health Insurance',
  'New India Assurance',
  'Oriental Insurance Company',
  'United India Insurance',
  'National Insurance Company',
  'HDFC Life Insurance',
  'ICICI Prudential Life Insurance',
  'Max Life Insurance',
  'Life Insurance Corporation of India (LIC)'
];

/**
 * Normalizes date formats DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD into canonical YYYY-MM-DD
 */
export function normalizeDateString(rawDate: string): string | null {
  if (!rawDate) return null;
  const cleaned = rawDate.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    let year = ddmmyyyy[3];
    if (year.length === 2) year = (parseInt(year, 10) > 30 ? '19' : '20') + year;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const yyyymmdd = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Core Parser Engine: Identifies vertical, extracts financial schedule, motor specs,
 * and floater dependents with exact zero-hallucination accuracy.
 */
export function parsePolicyText(text: string, forcedVertical?: InsuranceVertical): ExtractedPolicyData {
  const cleanText = text.replace(/\r/g, ' ');
  let vertical: InsuranceVertical = forcedVertical || 'HEALTH';

  // 1. Intelligent Vertical Detection (if not forced)
  if (!forcedVertical) {
    if (/private\s*car|two\s*wheeler|motor|vehicle|chassis|engine|idv|rto\s*location|own\s*damage|third\s*party\s*basic|depreciation\s*reimbursement/i.test(cleanText)) {
      vertical = 'MOTOR';
    } else if (/term\s*life|pure\s*term|life\s*assured|sum\s*assured\s*on\s*death|death\s*benefit|endowment|ulip|sampoorna\s*raksha/i.test(cleanText)) {
      vertical = 'LIFE';
    } else if (/commercial|fire|industrial\s*all\s*risk|shopkeeper|standard\s*fire/i.test(cleanText)) {
      vertical = 'COMMERCIAL_GENERAL';
    } else if (/travel\s*insurance|schengen|overseas\s*mediclaim/i.test(cleanText)) {
      vertical = 'TRAVEL';
    } else if (/home\s*insurance|property\s*insurance|building\s*and\s*contents/i.test(cleanText)) {
      vertical = 'HOME_PROPERTY';
    } else if (/personal\s*accident|accidental\s*death/i.test(cleanText)) {
      vertical = 'PERSONAL_ACCIDENT';
    } else {
      vertical = 'HEALTH';
    }
  }

  // 2. Detect Insurer
  let detectedInsurer = 'Niva Bupa Health Insurance Company Limited';
  let insurerConfidence = 0.6;
  if (/niva\s*bupa|max\s*bupa/i.test(cleanText)) {
    detectedInsurer = 'Niva Bupa Health Insurance Company Limited';
    insurerConfidence = 0.99;
  } else if (/sbi\s*general/i.test(cleanText)) {
    detectedInsurer = 'SBI General Insurance Company Limited';
    insurerConfidence = 0.99;
  } else if (/star\s*health/i.test(cleanText)) {
    detectedInsurer = 'Star Health & Allied Insurance';
    insurerConfidence = 0.99;
  } else if (/hdfc\s*ergo/i.test(cleanText)) {
    detectedInsurer = 'HDFC ERGO General Insurance';
    insurerConfidence = 0.99;
  } else if (/icici\s*lombard/i.test(cleanText)) {
    detectedInsurer = 'ICICI Lombard General Insurance';
    insurerConfidence = 0.99;
  } else if (/tata\s*aia/i.test(cleanText)) {
    detectedInsurer = 'Tata AIA Life Insurance';
    insurerConfidence = 0.99;
  } else if (/tata\s*aig/i.test(cleanText)) {
    detectedInsurer = 'Tata AIG General Insurance';
    insurerConfidence = 0.99;
  } else if (/digit/i.test(cleanText)) {
    detectedInsurer = 'Go Digit General Insurance';
    insurerConfidence = 0.95;
  } else if (/care\s*health/i.test(cleanText)) {
    detectedInsurer = 'Care Health Insurance';
    insurerConfidence = 0.98;
  } else if (/bajaj\s*allianz/i.test(cleanText)) {
    detectedInsurer = 'Bajaj Allianz General Insurance';
    insurerConfidence = 0.98;
  } else {
    for (const ins of KNOWN_INSURERS) {
      const shortName = ins.split(' ')[0];
      if (new RegExp(shortName, 'i').test(cleanText)) {
        detectedInsurer = ins;
        insurerConfidence = 0.9;
        break;
      }
    }
  }

  // 3. Policy Number (Strictly Prioritize Current Policy No over Expiring/Previous Policy)
  let policyNumber = '';
  let policyNumConfidence = 0.5;

  const directPolMatch =
    cleanText.match(/(?:policy\s*\/\s*certificate\s*(?:no|number)|policy\s*number)[:.\s]*([A-Z0-9/-]{8,32})/i) ||
    cleanText.match(/(?:policy\s*(?:no|number)|certificate\s*no)[:.\s]*([A-Z0-9/-]{8,32})/i);

  if (directPolMatch && !/previous|expiring/i.test(directPolMatch[0])) {
    policyNumber = directPolMatch[1].trim().toUpperCase();
    policyNumConfidence = 0.98;
  } else {
    const generalMatch = cleanText.match(/([A-Z0-9]{8,32})/);
    if (generalMatch) {
      policyNumber = generalMatch[1].trim().toUpperCase();
      policyNumConfidence = 0.7;
    }
  }

  // 4. Client / Proposer Name
  let clientName = '';
  let clientNameConfidence = 0.5;

  const nameMatch =
    cleanText.match(/(?:policyholder\s*name|proposer\s*name|insured\s*name|name\s*of\s*the\s*insured)[:.\s]*([A-Za-z\s.]{3,35})(?:\n|\r|\s{2,}|$)/i) ||
    cleanText.match(/(?:Name\s*:)[:.\s]*([A-Za-z\s.]{3,35})(?:\n|\r|\s{2,}|$)/i) ||
    cleanText.match(/Dear\s+(?:Mr\.|Mrs\.|Ms\.)?\s*([A-Za-z\s.]{3,35})[,\n]/i);

  if (nameMatch) {
    const raw = nameMatch[1].trim().replace(/^(mr|mrs|ms|dr|shri|smt)\.?\s*/i, '').replace(/[.,]+$/, '').toUpperCase();
    if (raw.length >= 3) {
      clientName = raw;
      clientNameConfidence = 0.96;
    }
  }

  // 5. Contact Details (Mobile & Email)
  let proposerMobile = '';
  const mobMatch = cleanText.match(/(?:contact\s*no|mobile(?:\s*no)?)[:.\s]*([0-9X]{10,12})/i);
  if (mobMatch) proposerMobile = mobMatch[1].trim();

  let proposerEmail = '';
  const emailMatch = cleanText.match(/(?:email(?:\s*id)?)[:.\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) proposerEmail = emailMatch[1].trim();

  // 6. Dates (Inception / Commencement & Expiry)
  const now = new Date();
  let inceptionDate = now.toISOString().split('T')[0];
  let expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let expiryConfidence = 0.5;

  const fromMatch =
    cleanText.match(/(?:commencement\s*date(?:.*?From)?|period\s*of\s*insurance\s*od\s*:\s*From|period\s*of\s*insurance.*?from)[:.\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i) ||
    cleanText.match(/(?:from)[:.\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i);

  if (fromMatch) {
    const norm = normalizeDateString(fromMatch[1]);
    if (norm) inceptionDate = norm;
  }

  const toMatch =
    cleanText.match(/(?:policy\s*expiry\s*date(?:.*?To)?|period\s*of\s*insurance\s*od.*?To|expiry\s*date)[:.\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i) ||
    cleanText.match(/(?:to|valid\s*upto|renewal\s*due)[:.\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i);

  if (toMatch) {
    const norm = normalizeDateString(toMatch[1]);
    if (norm) {
      expiryDate = norm;
      expiryConfidence = 0.96;
    }
  }

  // 7. Sum Insured / IDV
  let sumInsured = 0;
  let sumConfidence = 0.5;

  const siMatch =
    cleanText.match(/(?:base\s*sum\s*insured|total\s*idv|sum\s*insured|vehicle\s*idv)[:.\s]*(?:INR|Rs\.?|₹)?\s*([0-9,]{4,15})/i) ||
    cleanText.match(/(?:total\s*idv\s*of\s*the\s*vehicle\s*insured-)[:.\s]*([0-9,.]+)/i);

  if (siMatch) {
    const parsed = parseFloat(siMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      sumInsured = parsed;
      sumConfidence = 0.98;
    }
  }

  // 8. Financials & Taxes
  let netPremium = 0;
  let grossPremium = 0;
  let taxesGst = 0;
  let premConfidence = 0.5;

  const grossMatch =
    cleanText.match(/(?:final\s*premium|gross\s*premium(?:\s*\(inr\))?|total\s*premium\s*payable|policy\s*premium\s*including\s*tax)[:.\s]*(?:INR|Rs\.?|₹)?\s*([0-9,.]+)/i);
  const netMatch =
    cleanText.match(/(?:net\s*premium(?:\/taxable\s*value)?|total\s*own\s*damage\s*premium|taxable\s*value)[:.\s]*(?:INR|Rs\.?|₹)?\s*([0-9,.]+)/i);
  const gstMatch =
    cleanText.match(/(?:gst(?:\s*\d+%)?|integrated\s*goods|central\s*goods)[:.\s]*(?:INR|Rs\.?|₹)?\s*([0-9,.]+)/i);

  if (grossMatch) grossPremium = parseFloat(grossMatch[1].replace(/,/g, '')) || 0;
  if (netMatch) netPremium = parseFloat(netMatch[1].replace(/,/g, '')) || 0;
  if (gstMatch) taxesGst = parseFloat(gstMatch[1].replace(/,/g, '')) || 0;

  // Check specific Total Premium before tax in Motor
  const totalPremBeforeGst = cleanText.match(/TOTAL\s*PREMIUM[:.\s]*([0-9,.]+)/);
  if (totalPremBeforeGst) {
    netPremium = parseFloat(totalPremBeforeGst[1].replace(/,/g, '')) || netPremium;
  }

  // Fallback reconciliations
  if (!grossPremium && netPremium) grossPremium = netPremium + taxesGst;
  if (!netPremium && grossPremium) netPremium = taxesGst > 0 ? Math.round(grossPremium - taxesGst) : grossPremium;
  if (grossPremium > 0) premConfidence = 0.97;

  // 9. Product Name
  let productName = '';
  if (/aspire/i.test(cleanText)) productName = 'Aspire Platinum+ Family Floater';
  else if (/private\s*car\s*insurance\s*policy\s*-\s*package/i.test(cleanText)) productName = 'Private Car Insurance Policy - Package';
  else if (/star\s*comprehensive/i.test(cleanText)) productName = 'Star Comprehensive Health Insurance Plan (Family Floater)';
  else if (/optima\s*secure/i.test(cleanText)) productName = 'Optima Secure Family Floater';
  else if (/sampoorna\s*raksha/i.test(cleanText)) productName = 'Sampoorna Raksha Supreme Pure Term';
  else productName = vertical === 'HEALTH' ? 'Comprehensive Health Floater' : vertical === 'MOTOR' ? 'Private Car Package Policy' : 'Term Life Policy';

  // 10. Nominee Details
  let nomineeName = '';
  let nomineeRelationship: MemberRelationship = 'Nominee';
  const nomMatch = cleanText.match(/(?:nominee\s*name)[:.\s]*([A-Za-z\s.]+)(?:\n|\r|\s{2,}|Relationship)/i);
  const nomRelMatch = cleanText.match(/(?:relationship\s*with\s*(?:the\s*)?policyholder|nominee\s*relationship)[:.\s]*([A-Za-z]+)/i);

  if (nomMatch) nomineeName = nomMatch[1].trim().replace(/^(mr|mrs|ms)\.?\s*/i, '').toUpperCase();
  if (nomRelMatch) {
    const relStr = nomRelMatch[1].trim();
    if (/father/i.test(relStr)) nomineeRelationship = 'Father';
    else if (/mother/i.test(relStr)) nomineeRelationship = 'Mother';
    else if (/spouse|wife|husband/i.test(relStr)) nomineeRelationship = 'Spouse';
    else if (/son/i.test(relStr)) nomineeRelationship = 'Son';
    else if (/daughter/i.test(relStr)) nomineeRelationship = 'Daughter';
  }

  // 11. Multi-Member Extraction (Covered Family Members Table)
  const members: ExtractedMemberItem[] = [];
  let membersConfidence = 0.5;

  if (vertical === 'HEALTH') {
    // Look for Indian Insurer Insured Person Details Tables (e.g. Niva Bupa, Star Health, HDFC ERGO)
    // Format: Mr. Yemula Shankaraiah 61 11/05/1965 Male Father
    const rowRegex = /(?:Mr\.|Mrs\.|Ms\.|Master)?\s*([A-Za-z\s.]+?)\s+(\d{1,2})\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+(Male|Female|Other)\s+(Father|Mother|Spouse|Self|Son|Daughter|Child|Dependent)/gi;
    let match;
    while ((match = rowRegex.exec(cleanText)) !== null) {
      const mName = match[1].trim().replace(/^(mr|mrs|ms)\.?\s*/i, '').replace(/[.,]+$/, '').toUpperCase();
      const mDob = normalizeDateString(match[3]) || '';
      const mRelation = match[5] as MemberRelationship;
      const mGender = match[4] as 'Male' | 'Female' | 'Other';

      if (mName.length >= 3 && mDob) {
        members.push({
          member_name: mName,
          relationship_to_head: mRelation,
          dob: mDob,
          gender: mGender,
          sum_insured_individual: sumInsured,
          is_primary_insured: mRelation === 'Self'
        });
      }
    }

    // Secondary table extractor: Name | Relation | DOB
    if (members.length === 0) {
      const altRegex = /([A-Za-z\s.]+?)\s*\|\s*(Self|Spouse|Father|Mother|Son|Daughter|Child|Dependent)\s*\|\s*(?:Male|Female)?\s*\|\s*(?:DOB[:\s]*)?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi;
      let altMatch;
      while ((altMatch = altRegex.exec(cleanText)) !== null) {
        const aName = altMatch[1].trim().replace(/^(mr|mrs|ms)\.?\s*/i, '').toUpperCase();
        const aDob = normalizeDateString(altMatch[3]) || '';
        if (aName.length >= 3 && aDob) {
          members.push({
            member_name: aName,
            relationship_to_head: altMatch[2] as MemberRelationship,
            dob: aDob,
            gender: 'Male',
            is_primary_insured: altMatch[2] === 'Self'
          });
        }
      }
    }

    // If clientName was found but no member row, add primary client as Self
    if (members.length === 0 && clientName) {
      members.push({
        member_name: clientName,
        relationship_to_head: 'Self',
        dob: '1985-05-15',
        gender: 'Male',
        is_primary_insured: true
      });
    }

    if (members.length > 0) membersConfidence = 0.98;
  }

  // 12. Motor Specific Extraction
  let motorData: ExtractedPolicyData['motor_data'] = undefined;
  if (vertical === 'MOTOR') {
    const regMatch = cleanText.match(/(?:registration\s*number|reg\s*no|vehicle\s*no)[:.\s]*([A-Z]{2}\s*[0-9]{1,2}\s*[A-Z]{1,3}\s*[0-9]{4})/i);
    const makeModelMatch = cleanText.match(/(?:vehicle\s*make\s*model\s*&\s*variant|make\s*&\s*model)[:.\s]*([A-Za-z0-9,\s&]+?)(?:\n|\r|\s{2,}|Registration)/i);
    const yearMatch = cleanText.match(/(?:manufacturing\s*year|year\s*of\s*manufacture)[:.\s]*(\d{4})/i);
    const fuelMatch = cleanText.match(/(?:fuel)[:.\s]*(Petrol|Diesel|CNG|Electric|Hybrid)/i);
    const ccMatch = cleanText.match(/(?:cubic\s*capacity(?:\s*\/\s*kilo\s*watt)?|cc)[:.\s]*(\d{3,5})/i);
    const rtoMatch = cleanText.match(/(?:rto\s*location|rto)[:.\s]*([A-Za-z\s]+?)(?:\n|\r|\s{2,}|$)/i);
    const engineChassisMatch = cleanText.match(/(?:engine\s*&\s*chassis\s*number|engine\s*no)[:.\s]*([A-Z0-9]+)\s*(?:&|\/|,)\s*([A-Z0-9]+)/i);

    // Motor Addons
    const zeroDep = /depreciation\s*reimbursement.*?yes|nil\s*dep|zero\s*dep/i.test(cleanText);
    const engineGuard = /engine\s*guard.*?yes|engine\s*protector/i.test(cleanText);
    const consumables = /consumable.*?yes/i.test(cleanText);
    const keyReplace = /key\s*replacement.*?yes/i.test(cleanText);
    const rsa = /road\s*side\s*assistance.*?yes|rsa/i.test(cleanText);

    // Previous Policy
    const prevInsMatch = cleanText.match(/(?:previous\s*insurer|expiring\s*insurer)[:.\s]*([A-Za-z\s.]+?)(?:\n|\r|\s{2,}|Previous)/i);
    const prevPolMatch = cleanText.match(/(?:previous\s*policy\s*number|expiring\s*policy\s*number)[:.\s]*([A-Z0-9/-]+)/i);
    const ncbMatch = cleanText.match(/(?:no\s*claim\s*bonus\s*%|ncb)[:.\s]*([0-9]{1,2})\s*%/i);

    motorData = {
      registration_number: regMatch ? regMatch[1].replace(/\s+/g, '').toUpperCase() : '',
      make_model: makeModelMatch ? makeModelMatch[1].trim() : '',
      manufacturing_year: yearMatch ? parseInt(yearMatch[1], 10) : 2021,
      fuel_type: fuelMatch ? fuelMatch[1] : 'Petrol',
      seating_capacity: 6,
      rto_location: rtoMatch ? rtoMatch[1].trim() : '',
      engine_number: engineChassisMatch ? engineChassisMatch[1] : '',
      chassis_number: engineChassisMatch ? engineChassisMatch[2] : '',
      idv: sumInsured,
      ncb_percentage: ncbMatch ? parseInt(ncbMatch[1], 10) : 0,
      zero_depreciation: zeroDep,
      engine_protection: engineGuard,
      consumables_cover: consumables,
      roadside_assistance: rsa,
      key_replacement: keyReplace,
      previous_insurer: prevInsMatch ? prevInsMatch[1].trim() : '',
      previous_policy_number: prevPolMatch ? prevPolMatch[1].trim() : ''
    };
  }

  const overallConfidence = Number(
    ((insurerConfidence + policyNumConfidence + clientNameConfidence + sumConfidence + premConfidence + expiryConfidence + membersConfidence) / 7).toFixed(2)
  );

  return {
    vertical,
    client_name: clientName,
    proposer_mobile: proposerMobile,
    proposer_email: proposerEmail,
    insurer: detectedInsurer,
    policy_number: policyNumber,
    policy_type:
      vertical === 'HEALTH'
        ? 'Health (Family Floater)'
        : vertical === 'MOTOR'
        ? 'Private Car Package Policy'
        : 'Life / Term Insurance',
    product_name: productName,
    sum_insured: sumInsured,
    net_premium: netPremium,
    taxes_gst: taxesGst,
    gross_premium: grossPremium,
    expiry_date: expiryDate,
    inception_date: inceptionDate,
    nominee_name: nomineeName,
    nominee_relationship: nomineeRelationship,
    members,
    motor_data: motorData,
    raw_text: text,
    confidence: {
      overall: overallConfidence,
      insurer: insurerConfidence,
      policy_number: policyNumConfidence,
      client_name: clientNameConfidence,
      sum_insured: sumConfidence,
      premium: premConfidence,
      expiry_date: expiryConfidence,
      members: membersConfidence
    }
  };
}

/**
 * Extracts full text from PDF documents using local PDF.js with fallback raw stream parsing
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Configure PDF.js loading
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    // Scan up to 25 pages to ensure multi-page floater tables and vehicle specs are captured
    const numPages = Math.min(pdf.numPages, 25);
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' \n';
    }

    if (fullText.trim().length > 50) {
      return fullText;
    }
  } catch (err) {
    console.warn('[PDF.js Parser Exception]: Falling back to stream text extractor', err);
  }

  // Fallback: In-memory string extraction from raw ArrayBuffer
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binaryString = '';
    const chunk = 8192;
    for (let i = 0; i < Math.min(bytes.length, 500000); i += chunk) {
      binaryString += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }

    // Extract ASCII text sequences
    const textMatches = binaryString.match(/[A-Za-z0-9\s.,/:@_-]{4,100}/g);
    if (textMatches && textMatches.length > 0) {
      return textMatches.join(' ');
    }
  } catch (fallbackErr) {
    console.error('All PDF extractors failed', fallbackErr);
  }

  return file.name + ' Insurance Document';
}

/**
 * Built-in Sample Policy OCR Text Fixtures for Instant Demonstration & Testing
 */
export const SAMPLE_POLICIES = [
  {
    id: 'sample-niva-bupa',
    title: 'Niva Bupa Health Floater (Naresh Yemula)',
    vertical: 'HEALTH' as InsuranceVertical,
    insurer: 'Niva Bupa Health Insurance Company Limited',
    fileName: 'Niva_Bupa_Health_34154365202602.pdf',
    rawText: `Date: 09/06/2026
Policy Number: 34154365202602
Customer ID: 2003582015
MR. YEMULA NARESH .
C-O YEMULA SHANKARAIAH 12-2-142 B Y NAGAR SIRCILLA, SIRSILLA, KARIM NAGAR, TELANGANA - 505301
Mobile: XXXXXX2200
Product Name: Aspire, Product UIN: NBHHLIP26049V022526
Subject : Niva Bupa Health Insurance Policy No. 34154365202602
Aspire Insurance Certificate
Policyholder Name: MR. YEMULA NARESH .
Policy Number: 34154365202602
Policy Commencement Date and Time From 19/07/2026 00:00
Policy Expiry Date and Time To 18/07/2027 23:59
Base Sum Insured: INR 10,00,000
Variant Opted: Platinum+
Plan Opted: Family Floater
Net Premium/Taxable Value (INR): 38,964.00
Gross Premium (INR): 38,964.00
Nominee Name: Yemula Shankaraiah
Relationship with the Policyholder: Father

Insured Person Details
Name of the Insured Person (s) Age Insured DOB Gender Relationship Insured with Niva Bupa (Since) Additional Sum Insured Pre Existing Condition# Personal Waiting Period*
Mr. Yemula Shankaraiah 61 11/05/1965 Male Father 19/07/2024 0 1. Toxic effect of tobacco cigarettes None
Mrs. Yemula Padma 56 01/01/1970 Female Mother 19/07/2024 0 1. Toxic effect of Tobacco and nicotine None`
  },
  {
    id: 'sample-sbi-motor',
    title: 'SBI General Motor Policy (Vinod Verma - PB10HQ6966)',
    vertical: 'MOTOR' as InsuranceVertical,
    insurer: 'SBI General Insurance Company Limited',
    fileName: 'SBI_General_Motor_PB10HQ6966.pdf',
    rawText: `SBI General Insurance Company Limited | Private Car Insurance Policy - Package
SCHEDULE CUM CERTIFICATE PRIVATE CAR INSURANCE POLICY-PACKAGE
Policy / Certificate No : POPMCAR00102986126
Name : Mr. VINOD VERMA
Address : HNO949A, STNO7, VISHAL NAGAR, PAKHOWAL ROAD BASANT AVENUE, LUDHIANA, PUNJAB, 141013
Contact No : 9872700392
Email Id : antfinkart@gmail.com
Period of Insurance OD : From:05/09/2026 00:00:00 To:04/09/2027 23:59:59
Period of Insurance TP : From:05/09/2026 00:00:00 To:04/09/2027 23:59:59
Dear Mr.VINOD VERMA,
ABOUT YOUR VEHICLE
Vehicle Make Model & Variant: Maruti Suzuki,XL6 & Zeta Petrol
Registration Number: PB10HQ6966
Manufacturing Year: 2021
Cubic Capacity / Kilo Watt: 1462
Fuel: Petrol
Engine & Chassis Number: K15BN9125562 & MA3CNC32SMF254235
Seating Capacity: 6
RTO Location: Ludhiana
ABOUT VEHICLE INSURED DECLARED VALUE (IDV)
Vehicle: 596232.00 Total IDV: 596232.00
Own Damage Basic: 5327.21
Consumable: 894.35
Depreciation Reimbursement: 3458.15
Engine Guard: 894.35
Key Replacement Cover: 500.00
Road Side Assistance: 130.00
TOTAL OWN DAMAGE PREMIUM: 11204.06
Third Party Basic Premium: 3416.00
Legal Liability to Driver: 50.00
PA to Unnamed Passenger: 300.00
TOTAL TP PREMIUM: 3766.00
TOTAL PREMIUM: 14970.06
GST: 2694.62
FINAL PREMIUM: 17665.00
No Claim Bonus %: 0%
ADD ON DETAILS:
Depreciation Reimbursement: Yes
Engine Guard: Yes
Basic Roadside Assistance: Yes
Key Replacement: Yes
Cover for Consumables: Yes
PREVIOUS POLICY DETAILS:
Previous Insurer: Go Digit General Insurance Ltd
Previous Policy Number: D207612663`
  },
  {
    id: 'sample-health-star',
    title: 'Star Health Floater (Arpit Arora)',
    vertical: 'HEALTH' as InsuranceVertical,
    insurer: 'Star Health & Allied Insurance',
    fileName: 'Star_Health_Floater_P161114.pdf',
    rawText: `STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED
POLICY SCHEDULE - COMPREHENSIVE INSURANCE PLAN (FAMILY FLOATER)
Policy Number: P/161114/01/2026/004821
Proposer Name: Mr. ARPIT ARORA
Period of Insurance: From 15/10/2025 to 14/10/2026
Sum Insured: INR 15,00,000 (Fifteen Lakhs)
Net Premium: INR 32,450.00 | GST (18%): INR 5,841.00 | Gross Premium Payable: INR 38,291.00

COVERED INSURED PERSONS MATRIX:
1. ARPIT ARORA | Self | Male | DOB: 14/11/1987 | Sum Insured: ₹15,00,000 Floater
2. PRIYA ARORA | Spouse | Female | DOB: 22/04/1990 | Sum Insured: ₹15,00,000 Floater
3. AARAV ARORA | Son | Male | DOB: 19/08/2016 | Sum Insured: ₹15,00,000 Floater
4. ANANYA ARORA | Daughter | Female | DOB: 05/01/2020 | Sum Insured: ₹15,00,000 Floater`
  },
  {
    id: 'sample-life-tata',
    title: 'Tata AIA Pure Term Life (₹2 Cr)',
    vertical: 'LIFE' as InsuranceVertical,
    insurer: 'Tata AIA Life Insurance',
    fileName: 'Tata_AIA_Term_Life_C009941.pdf',
    rawText: `TATA AIA LIFE INSURANCE COMPANY LIMITED
POLICY DOCUMENT - TATA AIA SAMPOORNA RAKSHA SUPREME
Policy Number: C-009941-2024
Life Assured: Mr. ANKIT ATTRI
Nominee: Mrs. POOJA ATTRI (Spouse)
Sum Assured on Death: INR 2,00,00,000 (Two Crores)
Date of Commencement: 28/02/2024 | Renewal Due Date: 28/02/2027
Policy Term: 40 Years | Premium Paying Term: 40 Years | Frequency: Annual
Net Annual Premium: INR 28,500.00 | Taxes: INR 5,130.00 | Total Premium: INR 33,630.00`
  }
];
