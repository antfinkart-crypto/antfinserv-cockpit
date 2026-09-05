export type SourceSystem = 'MFBOX' | 'MANUAL' | 'INSURANCE' | 'LOANS' | 'IMPORT' | 'OTHER';
export type MappingRole = 'Head' | 'Member' | 'Individual';
export type Gender = 'Male' | 'Female' | 'Other' | 'Not Specified';

export type DataQualityFlag =
  | 'MISSING_PAN'
  | 'INVALID_PAN'
  | 'MISSING_DOB'
  | 'MISSING_MOBILE'
  | 'INVALID_MOBILE'
  | 'MISSING_EMAIL'
  | 'INVALID_EMAIL'
  | 'INCOMPLETE_ADDRESS'
  | 'POTENTIAL_DUPLICATE'
  | 'AMBIGUOUS_MATCH';

export interface ClientMasterRecord {
  // Identity & Source
  client_id: string; // Immutable internal ANTOS identifier
  source_system: SourceSystem; // e.g. 'MFBOX'
  source_user_id?: string; // e.g. MFbox USERID
  family_id?: string; // e.g. MFbox FAMILY ID (Household link, USERID ≠ FAMILY ID)
  mapping_role: MappingRole; // Head, Member, Individual
  relationship_to_head?: string; // e.g. 'Spouse', 'Son', 'Daughter', 'Father', 'Mother'
  family_head_id?: string; // client_id of the household family head
  linked_health_policy_number?: string;

  // Core Identity
  pan: string | null; // Uppercase 10 chars, or null if missing (e.g. minors). NEVER dummy!
  investor_name: string; // Trimmed & normalized
  dob: string | null; // Canonical YYYY-MM-DD
  source_age?: number; // Preserved from export for audit only
  gender: Gender;

  // Contact Details
  mobile: string; // Normalized 10-digit Indian mobile or international
  email: string; // Lowercased, trimmed

  // Address
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  city?: string;
  pincode?: string;
  state?: string;

  // Business / Organization
  branch?: string;
  rm_name?: string;
  associate_name?: string;
  bse_nse_code?: string;
  broker_code?: string;

  // Wealth & Financial Metadata
  aum?: number; // Authoritative or imported MF AUM
  first_investment_date?: string;
  created_date?: string;

  // Internal Timestamps & Audit
  created_at: string;
  updated_at: string;
  last_source_import_id?: string;
  last_source_imported_at?: string;
  is_manually_edited?: boolean;
  data_quality_flags: DataQualityFlag[];

  // Compatibility helpers (to seamlessly work where legacy Client was used)
  pan_number?: string;
  full_name?: string;
  client_type?: string;
}

export interface ClientChangeLog {
  id: string;
  client_id: string;
  field: string;
  old_value: any;
  new_value: any;
  changed_at: string;
  changed_by: string; // 'SYSTEM_IMPORT' | 'ADVISOR' | 'MANUAL_EDIT'
  source: SourceSystem;
  import_id?: string;
}

export interface ClientImportBatch {
  import_id: string;
  source_system: SourceSystem;
  source_filename: string;
  imported_at: string;
  imported_by: string;
  rows_processed: number;
  new_count: number;
  updated_count: number;
  unchanged_count: number;
  review_count: number;
  error_count: number;
  missing_pan_count: number;
  missing_dob_count: number;
  missing_mobile_count: number;
  missing_email_count: number;
  warnings: string[];
}

export interface AmbiguousClientMatch {
  id: string;
  import_id: string;
  incoming_record: Partial<ClientMasterRecord>;
  existing_matches: ClientMasterRecord[];
  reason: string;
  created_at: string;
  status: 'PENDING' | 'MERGED' | 'CREATED_AS_NEW' | 'DISMISSED';
  resolved_at?: string;
  resolved_by?: string;
}

export interface Client {
  id?: string;
  client_id?: string;
  pan_number: string;
  full_name: string;
  mobile: string;
  email?: string;
  firm_name?: string;
  client_type?: 'Retail' | 'B2B Merchant' | 'Corporate' | 'HNI';
  dob?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Holding Report Authority
export interface MfHolding {
  id: string;
  client_unique_id?: string;
  pan: string;
  investor_name: string;
  amc_name: string;
  category_name?: string;
  rta_scheme_code?: string;
  scheme_name: string;
  tagged_goal?: string;
  rm_name?: string;
  folio_number: string;
  holding_units: number;
  avg_nav: number;
  invested_cost: number;
  latest_nav: number;
  current_value: number; // Authoritative for Portfolio AUM!
  xirr?: number;
  start_date?: string;
  arn_no?: string;
  isin_no?: string;
  batch_id?: string;
  source_file?: string;
  created_at?: string;
  updated_at?: string;
}

// Active SIP Report Authority
export interface ActiveSip {
  id: string;
  investor_name: string;
  pan_number: string;
  mobile?: string;
  branch?: string;
  rm_name?: string;
  associate_name?: string;
  folio_number: string;
  scheme_name: string;
  reg_date?: string;
  start_date?: string;
  end_date?: string;
  sip_date: number; // Due Day (1-31)
  frequency: string; // Monthly, Quarterly, etc.
  sip_amount: number;
  monthly_amount: number; // Authoritative for Monthly SIP Commitment!
  invested_cost?: number;
  current_value?: number;
  xirr?: number;
  client_id?: string;
  isin_no?: string;
  rta_code?: string;
  linked_holding_id?: string;
  holding_match_status: 'Matched' | 'Pending / Not Found';
  batch_id?: string;
  source_file?: string;
  created_at?: string;
  updated_at?: string;

  // Compatibility fields
  amc_name?: string;
  client_pan?: string;
  sip_due_day?: number;
  monthly_amt?: number;
  current_aum?: number;
  scheme_code?: string;
  status?: string;
}

export interface SipPortfolio extends ActiveSip {
  client_pan?: string;
  sip_due_day: number;
  monthly_amt: number;
  current_aum: number;
  scheme_code?: string;
  status: string;
}

export interface ImportBatch {
  id: string;
  report_type: 'holding' | 'sip';
  file_name: string;
  file_hash: string;
  row_count: number;
  new_count: number;
  matched_count: number;
  imported_at: string;
}

export interface Lead {
  id: string;
  entry_date?: string;
  firm_name: string; // Business / Company Name
  owner_name: string; // Contact Person
  designation?: string;
  mobile: string;
  pan_number?: string;
  email?: string;
  location?: string;
  industry_sector?: string; // from Industry master
  industry_remarks?: string; // when "Other" is selected
  lead_source?: string;
  prospect_type?: string;
  priority?: 'High' | 'Medium' | 'Low';
  next_followup_date?: string;
  status: 'Warm Lead' | 'Cold Contact' | 'Negotiation Phase' | 'Converted' | 'Dropped';
  notes?: string;
  is_synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProtectionAsset {
  id: string;
  policy_number: string;
  client_name: string;
  insurer: string;
  policy_type: 'Health (Family Floater)' | 'Motor' | 'Term' | string;
  net_premium: number;
  sum_insured: number;
  expiry_date: string;
  days_to_expiry?: string | number;
  primary_member_name?: string;
  primary_member_dob?: string | null;
  dep1_name?: string;
  dep1_relation?: string;
  dep1_dob?: string | null;
  dep2_name?: string;
  dep2_relation?: string;
  dep2_dob?: string | null;
  document_url?: string;
  document_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncAuditLog {
  id?: string;
  source: 'EXCEL' | 'PWA';
  table_name: string;
  record_id?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload?: any;
  synced_at?: string;
}

export interface GroupedSipAlert {
  investor_name: string;
  client_pan?: string;
  mobile: string;
  due_date_str: string;
  total_debit: number;
  schemes: {
    scheme_name: string;
    amount: number;
    folio_number?: string;
  }[];
  dispatched: boolean;
  offset_reason?: string;
}

export interface CelebrationAlert {
  id: string;
  client_name: string;
  celebrant_name: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Son' | 'Daughter' | 'Father' | 'Mother' | 'Parent' | 'Dependent' | string;
  dob: string;
  mobile: string;
  age?: number;
  is_today: boolean;
  days_until: number;
}

export * from './insurance';
