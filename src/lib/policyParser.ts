/**
 * Intelligent Health & General Insurance Document Parser
 * Parses text from PDFs and Images to automatically extract policy parameters
 */

export interface ExtractedPolicyData {
  client_name: string;
  insurer: string;
  policy_number: string;
  policy_type: string;
  sum_insured: number;
  net_premium: number;
  expiry_date: string;
  primary_member_name: string;
  primary_member_dob: string;
  dep1_name: string;
  dep1_relation: string;
  dep1_dob: string;
  dep2_name: string;
  dep2_relation: string;
  dep2_dob: string;
  raw_text?: string;
}

export const KNOWN_INSURERS = [
  'HDFC ERGO',
  'Star Health',
  'Care Health',
  'Niva Bupa',
  'ICICI Lombard',
  'Tata AIG',
  'Bajaj Allianz',
  'Aditya Birla Health',
  'New India Assurance',
  'Oriental Insurance',
  'United India Insurance',
  'National Insurance',
  'SBI General',
  'ManipalCigna'
];

export function parsePolicyText(text: string): Partial<ExtractedPolicyData> {
  const result: Partial<ExtractedPolicyData> = {
    policy_type: 'Health (Family Floater)'
  };

  const cleanText = text.replace(/\r/g, ' ');

  // 1. Detect Insurer
  for (const ins of KNOWN_INSURERS) {
    const regex = new RegExp(ins, 'i');
    if (regex.test(cleanText)) {
      result.insurer = ins;
      break;
    }
  }

  // 2. Policy Number
  const polNumMatch = cleanText.match(/(?:policy\s*(?:no|number)|certificate\s*no)[:.\s]*([A-Z0-9/-]{6,30})/i) ||
                      cleanText.match(/([A-Z]{3,5}-[A-Z]{3,5}-[A-Z0-9-]+)/i);
  if (polNumMatch) {
    result.policy_number = polNumMatch[1].trim();
  }

  // 3. Proposer / Client Name
  const nameMatch = cleanText.match(/(?:proposer|insured|client|customer)\s*(?:name)[:.\s]*([A-Za-z\s.]{3,35})(?:\n|\r|\s{2,}|$)/i) ||
                    cleanText.match(/(?:name\s*of\s*the\s*insured)[:.\s]*([A-Za-z\s.]{3,35})/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim().replace(/^(mr|mrs|ms|dr|shri)\.?\s*/i, '');
    result.client_name = rawName.toUpperCase();
    result.primary_member_name = rawName.toUpperCase();
  }

  // 4. Sum Insured
  const sumMatch = cleanText.match(/(?:sum\s*insured|basic\s*sum\s*insured|s\.?i\.?)[:.\s]*(?:INR|Rs\.?|₹)?\s*([0-9,]{4,15})/i) ||
                   cleanText.match(/(?:₹|Rs\.?)\s*([0-9,]{5,15})\s*(?:sum\s*insured)/i);
  if (sumMatch) {
    const num = parseInt(sumMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 10000) {
      result.sum_insured = num;
    }
  }

  // 5. Net / Gross Premium
  const premMatch = cleanText.match(/(?:net\s*premium|gross\s*premium|total\s*premium|premium\s*payable)[:.\s]*(?:INR|Rs\.?|₹)?\s*([0-9,]{3,12})/i);
  if (premMatch) {
    const num = parseInt(premMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(num)) {
      result.net_premium = num;
    }
  }

  // 6. Expiry / Renewal Date
  const expMatch = cleanText.match(/(?:to|till|expiry|valid\s*upto|renewal\s*due)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i) ||
                   cleanText.match(/period\s*of\s*insurance.*?to\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (expMatch) {
    const rawDate = expMatch[1];
    const parts = rawDate.split(/[-/]/);
    if (parts.length === 3) {
      let day = parts[0].padStart(2, '0');
      let month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      result.expiry_date = `${year}-${month}-${day}`;
    }
  }

  // 7. Policy Type Detection
  if (/floater|family/i.test(cleanText)) {
    result.policy_type = 'Health (Family Floater)';
  } else if (/motor|car|vehicle|two\s*wheeler/i.test(cleanText)) {
    result.policy_type = 'Motor';
  } else if (/term|life|death\s*benefit/i.test(cleanText)) {
    result.policy_type = 'Term';
  }

  // 8. Covered Members Matrix (Detect Spouse / Child)
  const spouseMatch = cleanText.match(/([A-Za-z\s]+)\s*[-/|(]\s*(?:spouse|wife|husband)/i);
  if (spouseMatch) {
    result.dep1_name = spouseMatch[1].trim().toUpperCase();
    result.dep1_relation = 'Spouse';
  }

  const childMatch = cleanText.match(/([A-Za-z\s]+)\s*[-/|(]\s*(?:child|son|daughter)/i);
  if (childMatch) {
    result.dep2_name = childMatch[1].trim().toUpperCase();
    result.dep2_relation = 'Child';
  }

  return result;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    // Set worker src
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    // Read up to first 3 pages
    const numPages = Math.min(pdf.numPages, 3);
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + ' ';
    }

    return fullText;
  } catch (err) {
    console.warn('PDF.js text extraction fallback', err);
    // Fallback heuristic: read binary as text looking for text streams
    const text = await file.text();
    return text.slice(0, 5000);
  }
}
