import * as XLSX from 'xlsx';
import { ClientMasterRecord, DataQualityFlag, MappingRole, Gender, SourceSystem } from '../types';

export interface ClientParseResult {
  records: Partial<ClientMasterRecord>[];
  totalRows: number;
  missingPanCount: number;
  missingDobCount: number;
  missingMobileCount: number;
  missingEmailCount: number;
  warnings: string[];
  fileHash: string;
}

// Compute simple file hash for deduplication
export function computeFileHash(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hash = 0;
  for (let i = 0; i < Math.min(bytes.length, 100000); i++) {
    hash = ((hash << 5) - hash) + bytes[i];
    hash |= 0;
  }
  return 'cm_' + Math.abs(hash) + '_' + bytes.length;
}

// Clean number parser
export function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/[,₹\s]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Format dates (Excel serial dates, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into canonical YYYY-MM-DD
export function parseCanonicalDate(val: any): string | null {
  if (!val) return null;

  // 1. Excel numeric serial date (e.g. 45533)
  if (typeof val === 'number' && val > 1000 && val < 90000) {
    const utcDays = Math.floor(val - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const str = String(val).trim();
  if (!str) return null;

  // 2. YYYY-MM-DD (already canonical)
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2].padStart(2, '0');
    const dd = isoMatch[3].padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (ddmmyyyy) {
    const dd = ddmmyyyy[1].padStart(2, '0');
    const mm = ddmmyyyy[2].padStart(2, '0');
    let year = parseInt(ddmmyyyy[3], 10);
    if (year < 100) {
      year = year > 30 ? 1900 + year : 2000 + year;
    }
    return `${year}-${mm}-${dd}`;
  }

  return null;
}

// Calculate age dynamically from DOB
export function calculateCurrentAge(dobStr: string | null | undefined): number | undefined {
  if (!dobStr) return undefined;
  const match = dobStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return undefined;

  const yyyy = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10) - 1;
  const dd = parseInt(match[3], 10);

  const today = new Date();
  let age = today.getFullYear() - yyyy;
  const m = today.getMonth() - mm;
  if (m < 0 || (m === 0 && today.getDate() < dd)) {
    age--;
  }
  return age >= 0 ? age : undefined;
}

// Normalize Mobile Number
export function normalizeMobileNumber(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  // Remove spaces, dashes, parentheses
  const clean = str.replace(/[\s\-()+]/g, '');

  // If starts with 91 and has 12 digits, strip 91 for Indian mobile
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean.slice(2);
  }
  // If starts with 0 and has 11 digits, strip leading 0
  if (clean.length === 11 && clean.startsWith('0')) {
    return clean.slice(1);
  }
  return clean;
}

// Normalize PAN Number (CRITICAL RULE: NEVER FABRICATE OR DUMMY)
export function normalizePan(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim().toUpperCase();
  if (
    str === '' ||
    str === 'NULL' ||
    str === 'UNDEFINED' ||
    str === 'N/A' ||
    str === 'NA' ||
    str === 'PAN_NOT_PROVIDED' ||
    str === 'NOT PROVIDED' ||
    str === '-'
  ) {
    return null;
  }
  return str;
}

// Normalize Mapping Role
export function normalizeMappingRole(val: any): MappingRole {
  if (!val) return 'Individual';
  const str = String(val).trim().toLowerCase();
  if (str.includes('head') || str === 'h' || str === 'primary') return 'Head';
  if (str.includes('member') || str === 'm' || str.includes('spouse') || str.includes('child') || str.includes('dependent')) return 'Member';
  return 'Individual';
}

// Normalize Gender
export function normalizeGender(val: any): Gender {
  if (!val) return 'Not Specified';
  const str = String(val).trim().toUpperCase();
  if (str.startsWith('M') || str === 'MALE') return 'Male';
  if (str.startsWith('F') || str === 'FEMALE') return 'Female';
  if (str.startsWith('O') || str === 'OTHER') return 'Other';
  return 'Not Specified';
}

/**
 * Intelligent sheet row extractor:
 * Automatically skips title headers (e.g. "ANTFINSERV", "Report Date", etc.)
 * and finds the true column header row with at least 4 non-empty cells matching client keywords.
 */
function extractSheetRows(sheet: XLSX.WorkSheet): { headers: string[]; rows: any[] } {
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rawData || rawData.length === 0) return { headers: [], rows: [] };

  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(25, rawData.length); r++) {
    const row = rawData[r];
    if (!Array.isArray(row)) continue;
    const nonEmpty = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
    if (nonEmpty.length < 3) continue;

    const rowStr = row.map(c => String(c).trim().toLowerCase()).join(' | ');
    if (
      rowStr.includes('investor') ||
      rowStr.includes('client') ||
      rowStr.includes('pan') ||
      rowStr.includes('user') ||
      rowStr.includes('family') ||
      rowStr.includes('mobile') ||
      rowStr.includes('dob') ||
      rowStr.includes('birth')
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) headerRowIndex = 0;

  const rawHeaders = rawData[headerRowIndex] || [];
  const headers = rawHeaders.map((h: any, colIdx: number) => {
    const clean = String(h || '').trim();
    return clean || `col_${colIdx}`;
  });

  const rows: any[] = [];
  for (let r = headerRowIndex + 1; r < rawData.length; r++) {
    const rawRow = rawData[r];
    if (!rawRow || !Array.isArray(rawRow) || rawRow.every(c => c === '' || c === null || c === undefined)) continue;

    const rowObj: any = {};
    headers.forEach((hdr, colIdx) => {
      let val = rawRow[colIdx];
      if (typeof val === 'string') val = val.trim();
      rowObj[hdr] = val !== undefined ? val : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Case-insensitive key lookup with alias priorities
function getRowValue(row: any, aliases: string[]): string {
  // Pass 1: exact match
  for (const a of aliases) {
    const target = a.toLowerCase().trim();
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().trim() === target) {
        return String(row[k] || '').trim();
      }
    }
  }
  // Pass 2: substring match
  for (const a of aliases) {
    const target = a.toLowerCase().trim();
    for (const k of Object.keys(row)) {
      const cleanK = k.toLowerCase().trim();
      if (cleanK.includes(target) && !cleanK.includes('family') && target !== 'user') {
        return String(row[k] || '').trim();
      }
    }
  }
  return '';
}

/**
 * Parses MFbox / RTA Client Master Export (.xlsx, .xls, .csv, .txt)
 */
export async function parseClientMasterReport(file: File): Promise<ClientParseResult> {
  const buffer = await file.arrayBuffer();
  const fileHash = computeFileHash(buffer);

  let sheet: XLSX.WorkSheet;

  // Handle pipe-separated or tab-separated text files gracefully
  if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(buffer);

    // If pipe separated (like BSE StAR or MFbox pipe export)
    if (text.includes('|') && !text.includes('\t')) {
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      const rows = lines.map(line => line.split('|'));
      sheet = XLSX.utils.aoa_to_sheet(rows);
    } else {
      const workbook = XLSX.read(buffer, { type: 'array' });
      sheet = workbook.Sheets[workbook.SheetNames[0]];
    }
  } else {
    const workbook = XLSX.read(buffer, { type: 'array' });
    sheet = workbook.Sheets[workbook.SheetNames[0]];
  }

  const { rows } = extractSheetRows(sheet);
  const records: Partial<ClientMasterRecord>[] = [];
  const warnings: string[] = [];

  let missingPanCount = 0;
  let missingDobCount = 0;
  let missingMobileCount = 0;
  let missingEmailCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];

    // 1. Investor Name
    const investorName = getRowValue(row, [
      'Investor Name',
      'Client Name',
      'Primary Holder First Name',
      'Name',
      'Full Name'
    ]).replace(/\s+/g, ' ').trim();

    if (!investorName) continue; // Skip completely empty investor rows

    // 2. PAN Number (Strict null handling - NEVER fabricate)
    const rawPan = getRowValue(row, [
      'PAN Number',
      'Primary Holder PAN',
      'PAN',
      'Investor PAN'
    ]);
    const pan = normalizePan(rawPan);
    if (!pan) missingPanCount++;

    // 3. Contact Details
    const rawMobile = getRowValue(row, [
      'Mobile Number',
      'Indian Mobile No.',
      'Mobile',
      'Phone',
      'Contact'
    ]);
    const mobile = normalizeMobileNumber(rawMobile);
    if (!mobile) missingMobileCount++;

    const email = getRowValue(row, ['Email ID', 'Email', 'Email Address']).toLowerCase().trim();
    if (!email) missingEmailCount++;

    // 4. DOB & Age
    const rawDob = getRowValue(row, [
      'Date Of Birth',
      'Primary Holder DOB/Incorporation',
      'DOB',
      'Birth Date',
      'Date_of_Birth'
    ]);
    const dob = parseCanonicalDate(rawDob);
    if (!dob) missingDobCount++;

    const sourceAge = parseNum(getRowValue(row, ['Age', 'Current Age']));

    // 5. Gender
    const rawGender = getRowValue(row, ['Gender', 'Sex']);
    const gender = normalizeGender(rawGender);

    // 6. Address
    const addressLine1 = getRowValue(row, ['Street1', 'Address 1', 'Address 1', 'Add1', 'Address']);
    const addressLine2 = getRowValue(row, ['Street2', 'Address 2', 'Add2']);
    const addressLine3 = getRowValue(row, ['Street3', 'Address 3', 'Add3']);
    const city = getRowValue(row, ['City']);
    const pincode = getRowValue(row, ['Pincode', 'PIN', 'Pin Code']);
    const state = getRowValue(row, ['State']);

    // 7. Source Identifiers (CRITICAL: USERID ≠ FAMILY ID)
    const sourceUserId = getRowValue(row, ['USERID', 'User ID', 'Client Code', 'Member Code']);
    const familyId = getRowValue(row, ['FAMILY ID', 'Family ID', 'Family Head ID', 'FamilyId']);
    const rawMapping = getRowValue(row, ['Mapping', 'Family Role', 'Holding Nature']);
    const mappingRole = normalizeMappingRole(rawMapping);

    // 8. Business & Distribution Metadata
    const branch = getRowValue(row, ['Branch', 'Branch Name', 'Location']);
    const rmName = getRowValue(row, ['RM Name', 'RM', 'Relationship Manager', 'Dealer']);
    const associateName = getRowValue(row, ['Associate Name', 'Associate']);
    const bseNseCode = getRowValue(row, ['BSE/NSE Code', 'Client Code', 'BSE Code', 'NSE Code']);
    const brokerCode = getRowValue(row, ['Broker Code', 'ARN', 'Sub Broker']);

    // 9. Financial Metadata
    const aum = parseNum(getRowValue(row, ['AUM', 'Current AUM', 'Market Value', 'Total AUM']));
    const firstInvestmentDate = parseCanonicalDate(getRowValue(row, ['First Investment Date', 'First Inv Date']));
    const createdDate = parseCanonicalDate(getRowValue(row, ['Created Date', 'Reg Date', 'Registration Date']));

    // 10. Compute Data Quality Flags
    const flags: DataQualityFlag[] = [];
    if (!pan) {
      flags.push('MISSING_PAN');
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      flags.push('INVALID_PAN');
    }

    if (!dob) flags.push('MISSING_DOB');
    if (!mobile) {
      flags.push('MISSING_MOBILE');
    } else if (mobile.length < 10) {
      flags.push('INVALID_MOBILE');
    }

    if (!email) {
      flags.push('MISSING_EMAIL');
    } else if (!email.includes('@')) {
      flags.push('INVALID_EMAIL');
    }

    if (!addressLine1 && !city) flags.push('INCOMPLETE_ADDRESS');

    records.push({
      source_system: 'MFBOX',
      source_user_id: sourceUserId || undefined,
      family_id: familyId || undefined,
      mapping_role: mappingRole,
      pan: pan,
      investor_name: investorName,
      dob: dob,
      source_age: sourceAge || undefined,
      gender: gender,
      mobile: mobile,
      email: email,
      address_line_1: addressLine1 || undefined,
      address_line_2: addressLine2 || undefined,
      address_line_3: addressLine3 || undefined,
      city: city || undefined,
      pincode: pincode || undefined,
      state: state || undefined,
      branch: branch || undefined,
      rm_name: rmName || undefined,
      associate_name: associateName || undefined,
      bse_nse_code: bseNseCode || undefined,
      broker_code: brokerCode || undefined,
      aum: aum || undefined,
      first_investment_date: firstInvestmentDate || undefined,
      created_date: createdDate || undefined,
      data_quality_flags: flags
    });
  }

  return {
    records,
    totalRows: records.length,
    missingPanCount,
    missingDobCount,
    missingMobileCount,
    missingEmailCount,
    warnings,
    fileHash
  };
}
