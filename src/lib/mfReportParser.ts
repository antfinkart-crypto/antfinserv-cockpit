import * as XLSX from 'xlsx';
import { MfHolding, ActiveSip, ImportBatch } from '../types';

export interface ParseResult<T> {
  records: T[];
  totalRows: number;
  newCount: number;
  matchedCount: number;
  potentialDuplicates: number;
  warnings: string[];
  fileHash: string;
  isDuplicateBatch: boolean;
}

// Simple checksum generator for duplicate file protection
export function computeFileHash(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hash = 0;
  for (let i = 0; i < Math.min(bytes.length, 100000); i++) {
    hash = ((hash << 5) - hash) + bytes[i];
    hash |= 0;
  }
  return 'h_' + Math.abs(hash) + '_' + bytes.length;
}

// Clean number parser
function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/[,₹\s]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Format Excel serial dates (e.g. 45533) into DD-MM-YYYY
export function parseExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number' && val > 20000 && val < 90000) {
    const utcDays = Math.floor(val - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return dd + '-' + mm + '-' + yyyy;
  }
  return String(val).trim();
}

// Normalise scheme name for matching
export function normalizeSchemeName(name: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/[-–—/]/g, ' ')
    .replace(/\s+(DIRECT|REGULAR)\s+/g, ' ')
    .replace(/\s+(GROWTH|DIVIDEND|IDCW)\s+/g, ' ')
    .replace(/\s+(PLAN|OPTION)\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent sheet row extractor:
 * Automatically skips title headers (e.g. 'ANTFINSERV', 'Report Date')
 * and finds the true column header row with at least 4 non-empty cells.
 */
function extractSheetRows(sheet: XLSX.WorkSheet): { headers: string[]; rows: any[]; rawRowCount: number } {
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rawData || rawData.length === 0) return { headers: [], rows: [], rawRowCount: 0 };

  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(25, rawData.length); r++) {
    const row = rawData[r];
    if (!Array.isArray(row)) continue;
    const nonEmpty = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
    if (nonEmpty.length < 4) continue;

    const rowStr = row.map(c => String(c).trim().toLowerCase()).join(' | ');
    if (
      (rowStr.includes('folio') || rowStr.includes('scheme')) &&
      (rowStr.includes('pan') || rowStr.includes('investor') || rowStr.includes('client') || rowStr.includes('units') || rowStr.includes('nav') || rowStr.includes('sip') || rowStr.includes('amount'))
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(10, rawData.length); r++) {
      const nonEmpty = rawData[r].filter((c: any) => c !== null && c !== undefined && String(c).trim() !== '');
      if (nonEmpty.length >= 4) {
        headerRowIndex = r;
        break;
      }
    }
    if (headerRowIndex === -1) headerRowIndex = 0;
  }

  const rawHeaders = rawData[headerRowIndex] || [];
  const headers = rawHeaders.map((h: any, colIdx: number) => {
    const clean = String(h || '').trim();
    return clean || ('col_' + colIdx);
  });

  const rows: any[] = [];
  let lastPan = '';
  let lastInvestor = '';

  for (let r = headerRowIndex + 1; r < rawData.length; r++) {
    const rawRow = rawData[r];
    if (!rawRow || !Array.isArray(rawRow) || rawRow.every(c => c === '' || c === null || c === undefined)) continue;

    const rowObj: any = {};
    headers.forEach((hdr, colIdx) => {
      let val = rawRow[colIdx];
      if (typeof val === 'string') val = val.trim();
      rowObj[hdr] = val !== undefined ? val : '';
    });

    const currentPan = rowObj['PAN'] || rowObj['PAN Number'] || rowObj['Investor PAN'] || '';
    const currentInvestor = rowObj['Investor Name'] || rowObj['Client Name'] || rowObj['Investor'] || '';

    if (currentPan) lastPan = currentPan;
    if (currentInvestor) lastInvestor = currentInvestor;

    const hasFolioOrScheme = Object.keys(rowObj).some(k => {
      const lk = k.toLowerCase();
      const v = String(rowObj[k]).trim();
      return (lk.includes('folio') || lk.includes('scheme')) && v !== '';
    });

    if (hasFolioOrScheme) {
      if (!currentPan && lastPan) {
        rowObj['PAN'] = lastPan;
      }
      if (!currentInvestor && lastInvestor) {
        rowObj['Investor Name'] = lastInvestor;
      }
      rows.push(rowObj);
    }
  }

  return { headers, rows, rawRowCount: rawData.length };
}

// Case-insensitive flexible key access with exact-first precedence
function getRowValue(row: any, aliases: string[]): string {
  for (const a of aliases) {
    const target = a.toLowerCase().trim();
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().trim() === target) {
        return String(row[k] || '').trim();
      }
    }
  }
  for (const a of aliases) {
    const target = a.toLowerCase().trim();
    for (const k of Object.keys(row)) {
      const cleanK = k.toLowerCase().trim();
      if (cleanK.includes(target) && !cleanK.includes('code') && !cleanK.includes('goal')) {
        return String(row[k] || '').trim();
      }
    }
  }
  return '';
}

/**
 * Parses Client-wise / Folio-wise Holding Report (.xlsx, .xls, .csv)
 */
export async function parseHoldingReport(
  file: File,
  existingBatches: ImportBatch[],
  existingHoldings: MfHolding[]
): Promise<ParseResult<MfHolding>> {
  const buffer = await file.arrayBuffer();
  const fileHash = computeFileHash(buffer);

  const isDuplicateBatch = existingBatches.some(
    b => b.file_hash === fileHash && b.report_type === 'holding' && b.row_count > 0
  );

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const { rows } = extractSheetRows(sheet);

  const warnings: string[] = [];
  const holdings: MfHolding[] = [];
  const batchId = 'batch-hold-' + Date.now();

  let newCount = 0;
  let matchedCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];

    const pan = getRowValue(row, ['PAN', 'PAN Number', 'Investor PAN']).toUpperCase();
    const investorName = getRowValue(row, ['Investor Name', 'Client Name', 'Investor']).toUpperCase();
    const schemeName = getRowValue(row, ['Scheme Name', 'Scheme']);
    const folioNumber = getRowValue(row, ['Folio Number', 'Folio No', 'Folio']);

    if (!schemeName && !folioNumber) continue;

    const currentValue = parseNum(getRowValue(row, ['Current Value', 'Market Value', 'Valuation']));
    const investedCost = parseNum(getRowValue(row, ['Invested Cost', 'Inv. Cost', 'Purchase Cost']));
    const units = parseNum(getRowValue(row, ['Holding Units', 'Units', 'Balance Units']));
    const avgNav = parseNum(getRowValue(row, ['Avg NAV', 'Average NAV', 'Cost NAV']));
    const latestNav = parseNum(getRowValue(row, ['Latest NAV', 'Current NAV', 'NAV']));
    const xirr = parseNum(getRowValue(row, ['XIRR(%)', 'XIRR', 'Return(%)']));

    const existing = existingHoldings.find(
      h => h.pan === pan && h.folio_number === folioNumber && normalizeSchemeName(h.scheme_name) === normalizeSchemeName(schemeName)
    );

    if (existing) {
      matchedCount++;
    } else {
      newCount++;
    }

    const holdingId = existing ? existing.id : ('h-' + (pan || 'NOPAN') + '-' + (folioNumber || idx) + '-' + Date.now() + '-' + idx);

    holdings.push({
      id: holdingId,
      client_unique_id: getRowValue(row, ['Unique ID', 'Client ID', 'Client Code']),
      pan: pan || 'PAN_NOT_PROVIDED',
      investor_name: investorName || 'Unknown Investor',
      amc_name: getRowValue(row, ['AMC Name', 'AMC', 'Fund House']) || 'Mutual Fund',
      category_name: getRowValue(row, ['Category Name', 'Category', 'Asset Class']),
      rta_scheme_code: getRowValue(row, ['RTA Scheme Code', 'RTA Code', 'Scheme Code']),
      scheme_name: schemeName,
      tagged_goal: getRowValue(row, ['Tagged/Goal Schemes', 'Goal', 'Goal Name']),
      rm_name: getRowValue(row, ['RM Name', 'RM', 'Relationship Manager']),
      folio_number: folioNumber,
      holding_units: units,
      avg_nav: avgNav,
      invested_cost: investedCost,
      latest_nav: latestNav,
      current_value: currentValue,
      xirr: xirr || undefined,
      start_date: parseExcelDate(getRowValue(row, ['Start Date', 'Inception Date', 'Purchase Date'])),
      arn_no: getRowValue(row, ['ARN No', 'ARN', 'Sub ARN']),
      isin_no: getRowValue(row, ['ISIN No', 'ISIN']),
      batch_id: batchId,
      source_file: file.name,
      updated_at: new Date().toISOString()
    });
  }

  return {
    records: holdings,
    totalRows: holdings.length,
    newCount,
    matchedCount,
    potentialDuplicates: 0,
    warnings,
    fileHash,
    isDuplicateBatch: isDuplicateBatch && holdings.length > 0
  };
}

/**
 * Parses Active SIP Report (.xlsx, .xls, .csv)
 */
export async function parseActiveSipReport(
  file: File,
  existingBatches: ImportBatch[],
  holdings: MfHolding[]
): Promise<ParseResult<ActiveSip>> {
  const buffer = await file.arrayBuffer();
  const fileHash = computeFileHash(buffer);

  const isDuplicateBatch = existingBatches.some(
    b => b.file_hash === fileHash && b.report_type === 'sip' && b.row_count > 0
  );

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const { rows } = extractSheetRows(sheet);

  const warnings: string[] = [];
  const sips: ActiveSip[] = [];
  const batchId = 'batch-sip-' + Date.now();

  let matchedCount = 0;
  let newCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];

    const investorName = getRowValue(row, ['Investor Name', 'Client Name', 'Investor']).toUpperCase();
    const pan = getRowValue(row, ['PAN Number', 'PAN', 'Investor PAN']).toUpperCase();
    const schemeName = getRowValue(row, ['Scheme Name', 'Scheme']);
    const folioNumber = getRowValue(row, ['Folio', 'Folio Number', 'Folio No']);

    if (!schemeName && !folioNumber) continue;

    const sipDateRaw = parseNum(getRowValue(row, ['SIP Date', 'Due Day', 'Debit Date', 'SIP Day']));
    const sipDueDay = (sipDateRaw >= 1 && sipDateRaw <= 31) ? sipDateRaw : 10;
    const sipAmount = parseNum(getRowValue(row, ['SIP Amount', 'Amount', 'Installment Amount']));
    const monthlyAmt = parseNum(getRowValue(row, ['Monthly Amount', 'Monthly Amt'])) || sipAmount;

    const normScheme = normalizeSchemeName(schemeName);
    let linkedHolding = holdings.find(
      h => h.pan === pan && h.folio_number === folioNumber && normalizeSchemeName(h.scheme_name) === normScheme
    );

    if (!linkedHolding && pan) {
      linkedHolding = holdings.find(h => h.pan === pan && h.folio_number === folioNumber);
    }

    if (!linkedHolding) {
      linkedHolding = holdings.find(h => h.investor_name === investorName && h.folio_number === folioNumber);
    }

    const matchStatus: 'Matched' | 'Pending / Not Found' = linkedHolding ? 'Matched' : 'Pending / Not Found';
    if (linkedHolding) matchedCount++;
    else newCount++;

    const sipId = 'sip-' + (pan || 'NOPAN') + '-' + (folioNumber || 'NOFOL') + '-' + sipDueDay + '-' + monthlyAmt + '-' + idx;

    sips.push({
      id: sipId,
      investor_name: investorName || 'Unknown Investor',
      pan_number: pan || (linkedHolding ? linkedHolding.pan : 'PAN_NOT_PROVIDED'),
      mobile: getRowValue(row, ['Mobile', 'Phone', 'Contact']),
      branch: getRowValue(row, ['Branch', 'Location']),
      rm_name: getRowValue(row, ['RM Name', 'RM', 'Advisor']),
      associate_name: getRowValue(row, ['Associate Name', 'Associate']),
      folio_number: folioNumber,
      scheme_name: schemeName,
      reg_date: parseExcelDate(getRowValue(row, ['Reg Date', 'Registration Date'])),
      start_date: parseExcelDate(getRowValue(row, ['Start Date', 'SIP Start Date'])),
      end_date: parseExcelDate(getRowValue(row, ['End Date', 'SIP End Date'])),
      sip_date: sipDueDay,
      frequency: getRowValue(row, ['Frequency', 'SIP Frequency']) || 'Monthly',
      sip_amount: sipAmount,
      monthly_amount: monthlyAmt,
      invested_cost: parseNum(getRowValue(row, ['Inv. Cost', 'Invested Cost'])),
      current_value: parseNum(getRowValue(row, ['Current Value', 'Valuation'])),
      xirr: parseNum(getRowValue(row, ['XIRR(%)', 'XIRR'])),
      client_id: getRowValue(row, ['Client ID', 'Unique ID']),
      isin_no: getRowValue(row, ['ISIN No', 'ISIN']),
      rta_code: getRowValue(row, ['RTA Code', 'RTA Scheme Code']),
      linked_holding_id: linkedHolding?.id,
      holding_match_status: matchStatus,
      batch_id: batchId,
      source_file: file.name,
      updated_at: new Date().toISOString()
    });
  }

  return {
    records: sips,
    totalRows: sips.length,
    newCount,
    matchedCount,
    potentialDuplicates: 0,
    warnings,
    fileHash,
    isDuplicateBatch: isDuplicateBatch && sips.length > 0
  };
}