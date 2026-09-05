/**
 * ANTOS Insurance CRM Domain Model & Dynamic Vertical Schemas
 * Standardized across Indian Health, Motor, Life, PA, Travel, Home, and General Insurance.
 */

export type InsuranceVertical =
  | 'HEALTH'
  | 'MOTOR'
  | 'LIFE'
  | 'PERSONAL_ACCIDENT'
  | 'TRAVEL'
  | 'HOME_PROPERTY'
  | 'COMMERCIAL_GENERAL'
  | 'OTHER';

export type PolicyStatus =
  | 'DRAFT'
  | 'NEEDS_REVIEW'
  | 'ACTIVE'
  | 'GRACE_PERIOD'
  | 'RENEWAL_DUE'
  | 'EXPIRED'
  | 'LAPSED'
  | 'CLAIMED'
  | 'CANCELLED'
  | 'PORTED'
  | 'SUPERSEDED';

export type PaymentFrequency =
  | 'ANNUAL'
  | 'HALF_YEARLY'
  | 'QUARTERLY'
  | 'MONTHLY'
  | 'SINGLE';

export type VerificationStatus =
  | 'PROVISIONAL'
  | 'VERIFIED'
  | 'REJECTED'
  | 'MANUALLY_OVERRIDDEN';

export type MemberRelationship =
  | 'Self'
  | 'Spouse'
  | 'Son'
  | 'Daughter'
  | 'Child'
  | 'Father'
  | 'Mother'
  | 'Father-in-law'
  | 'Mother-in-law'
  | 'Dependent'
  | 'Nominee'
  | 'Appointee'
  | 'Employee'
  | 'Other';

export interface PolicyMember {
  id: string;
  policy_id: string;
  client_id?: string; // Linked ClientMasterRecord ID if synchronized
  member_name: string;
  relationship_to_head: MemberRelationship;
  dob: string; // Canonical YYYY-MM-DD for Celebrations & Birthday wishes
  celebrated_dob_custom?: string; // Hindu / Indian calendar or custom celebrated date
  gender?: 'Male' | 'Female' | 'Other';
  sum_insured_individual?: number; // For floaters with individual caps
  ped_declared?: string[]; // Pre-existing conditions declared
  is_primary_insured: boolean;
  synced_to_client_master: boolean;
  synced_at?: string;
}

export type DocumentClassificationType =
  | 'POLICY_SCHEDULE'
  | 'POLICY_WORDING'
  | 'RENEWAL_NOTICE'
  | 'PREMIUM_RECEIPT'
  | 'ENDORSEMENT'
  | 'CLAIM_DOCUMENT'
  | 'PROPOSAL_FORM'
  | 'KYC_DOCUMENT'
  | 'INSPECTION_REPORT'
  | 'OTHER';

export interface DocumentFieldExtraction {
  field_name: string;
  extracted_value: any;
  confidence: number; // 0.0 to 1.0
  source_page?: number;
  bounding_snippet?: string;
  is_verified: boolean;
  verified_value?: any;
  verified_by?: string;
  verified_at?: string;
}

export interface PolicyDocument {
  id: string;
  policy_id: string;
  file_name: string;
  file_type: string; // 'application/pdf' | 'image/jpeg' | ...
  file_size: number;
  sha256_hash: string;
  doc_type: DocumentClassificationType;
  classification_confidence: number;
  uploaded_at: string;
  uploaded_by: string;
  storage_ref?: string; // Blob key in IndexedDB or Supabase storage path
  processing_state: 'QUEUED' | 'EXTRACTING' | 'COMPLETED' | 'NEEDS_REVIEW' | 'FAILED';
  extraction_version: string;
  extracted_fields: Record<string, DocumentFieldExtraction>;
  raw_text?: string;
  error_message?: string;
}

/* -------------------------------------------------------------------------- */
/*                         VERTICAL SPECIFIC SCHEMAS                          */
/* -------------------------------------------------------------------------- */

export interface HealthInsuranceData {
  plan_type: 'Family Floater' | 'Individual' | 'Multi-Individual' | 'Top-up' | 'Super Top-up';
  room_rent_limit: string; // e.g., '1% of SI', 'Single Private Room', 'No Capping'
  icu_limit: string; // e.g., '2% of SI', 'No Capping'
  copay_percentage: number; // 0, 10, 20%
  deductible_amount: number; // For top-up plans
  initial_waiting_period_days: number; // usually 30 days
  specific_disease_waiting_months: number; // usually 24 months
  ped_waiting_period_months: number; // e.g. 12, 24, 36, 48 months
  restoration_benefit: boolean;
  ncb_current_year_amount?: number; // NCB / Cumulative bonus amount for current year in INR (₹)
  cumulative_bonus_percentage?: number; // optional legacy %
  maternity_coverage: boolean;
  opd_coverage: boolean;
  daycare_procedures_covered: boolean;
  ayush_treatment_covered: boolean;
  cashless_network_hospitals_count?: number;
  portability_eligible: boolean;
  tpa_name?: string;
}

export interface MotorInsuranceData {
  vehicle_type: 'Private Car' | 'Two Wheeler' | 'Commercial Vehicle';
  registration_number: string;
  make: string;
  model: string;
  variant: string;
  manufacturing_year: number;
  fuel_type: 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Hybrid';
  idv: number; // Insured Declared Value (₹)
  ncb_percentage: number; // 0, 20, 25, 35, 45, 50%
  ncb_discount_amount?: number; // NCB discount amount in INR (₹)
  policy_subtype: 'Comprehensive' | 'Own Damage (OD)' | 'Third Party Only (TP)' | 'Bundled (1+3 / 1+5)';
  policy_structure?: '1+3 Bundled (New 4W: 1yr OD + 3yr TP)' | '1+5 Bundled (New 2W: 1yr OD + 5yr TP)' | 'Standalone Own Damage (SAOD Renewal)' | 'Comprehensive (1yr OD + 1yr TP)' | 'Third Party Liability Only';
  od_policy_start_date?: string; // e.g. 2025-09-27
  od_policy_expiry_date?: string; // e.g. 2026-09-26
  tp_policy_start_date?: string; // e.g. 2024-09-27
  tp_policy_expiry_date?: string; // e.g. 2027-09-26
  tp_insurer_name?: string; // e.g. 'Bajaj Allianz General Insurance Co. Ltd.'
  tp_policy_number?: string; // e.g. 'OG-25-1021-1825-0030547'
  od_net_premium?: number;
  tp_liability_premium?: number;
  zero_depreciation: boolean;
  engine_protection: boolean;
  return_to_invoice: boolean;
  consumables_cover: boolean;
  roadside_assistance: boolean;
  tyre_secure: boolean;
  key_replacement: boolean;
  personal_accident_owner_driver: boolean;
  financier_hypothecation?: string;
  engine_number_masked?: string;
  chassis_number_masked?: string;
  seating_capacity?: number;
  cubic_capacity?: number | string;
  rto_location?: string;
}

export interface LifeInsuranceData {
  plan_category: 'Pure Term' | 'Term with Return of Premium (TROP)' | 'ULIP' | 'Endowment' | 'Money Back' | 'Annuity/Pension';
  life_assured_name: string;
  proposer_name: string;
  nominee_name: string;
  nominee_relationship: MemberRelationship;
  nominee_dob?: string;
  appointee_name?: string; // if nominee is minor
  policy_term_years: number;
  premium_paying_term_years: number;
  sum_assured_death: number;
  maturity_benefit_sum?: number;
  maturity_date?: string;
  critical_illness_rider_sum?: number;
  accidental_death_rider_sum?: number;
  waiver_of_premium_rider: boolean;
  current_fund_value?: number; // For ULIPs only when sourced
}

export interface PersonalAccidentData {
  accidental_death_sum_insured: number;
  permanent_total_disability_sum: number;
  permanent_partial_disability_sum: number;
  temporary_total_disability_weekly: number;
  occupation_risk_class: 'Class 1 (Admin/Office)' | 'Class 2 (Supervisory/Light Trade)' | 'Class 3 (Hazardous/Industrial)';
  accidental_medical_expenses_sum?: number;
}

export interface TravelInsuranceData {
  trip_type: 'Single Trip' | 'Annual Multi-Trip' | 'Student Overseas';
  geographical_coverage: 'Domestic' | 'Worldwide Excl US/Canada' | 'Worldwide Incl US/Canada' | 'Asia/Schengen';
  start_date: string;
  end_date: string;
  destination_countries: string[];
  medical_expenses_usd: number;
  baggage_delay_usd?: number;
  trip_cancellation_usd?: number;
  pre_existing_covered: boolean;
}

export interface PropertyHomeData {
  property_identifier?: string; // e.g. 'Flat 1302 Tower E Oberoi Splendor (Mumbai)'
  property_address: string;
  risk_location_address?: string; // Premises location
  pincode: string;
  occupancy_type: 'Owner' | 'Tenant' | 'Landlord';
  structure_sum_insured: number;
  contents_sum_insured: number;
  carpet_area_sq_m?: number;
  rate_per_sq_m?: number;
  policy_tenure_years?: number; // e.g. 2 for 2-year Griha Raksha
  terrorism_premium?: number;
  burglary_theft_cover: boolean;
  earthquake_stfi_peril: boolean;
  public_liability_limit?: number;
}

export interface CommercialGeneralData {
  business_legal_name: string;
  gstin?: string;
  line_of_business: string;
  risk_location: string;
  policy_name: string; // e.g. 'Standard Fire & Special Perils', 'Cyber Liability', 'Directors & Officers'
  business_assets_sum_insured: number;
  turnover_reported?: number;
  public_liability_sum?: number;
  deductible_excess: number;
}

export type InsuranceVerticalDataMap = {
  HEALTH: HealthInsuranceData;
  MOTOR: MotorInsuranceData;
  LIFE: LifeInsuranceData;
  PERSONAL_ACCIDENT: PersonalAccidentData;
  TRAVEL: TravelInsuranceData;
  HOME_PROPERTY: PropertyHomeData;
  COMMERCIAL_GENERAL: CommercialGeneralData;
  OTHER: Record<string, any>;
};

/* -------------------------------------------------------------------------- */
/*                           CORE INSURANCE POLICY                            */
/* -------------------------------------------------------------------------- */

export interface InsurancePolicy {
  id: string; // antos_pol_...
  policy_number: string;
  previous_policy_number?: string;
  insurer_name: string;
  vertical: InsuranceVertical;
  product_name: string;
  product_code?: string;
  status: PolicyStatus;

  // Primary Client Linkage (Golden Client Master)
  primary_client_id?: string;
  client_name: string;
  proposer_name: string;
  proposer_pan?: string;
  proposer_mobile?: string;
  proposer_email?: string;
  family_id?: string; // Household link

  // Convenience aliases for display
  policy_type?: string;
  plan_name?: string;
  property_address?: string;

  // Financials (INR)
  sum_insured: number;
  gross_premium: number;
  net_premium: number;
  taxes_gst: number;
  payment_frequency: PaymentFrequency;

  // Lifecycle Dates
  inception_date: string; // YYYY-MM-DD
  expiry_date: string;    // YYYY-MM-DD
  issue_date?: string;
  renewal_due_date: string;
  grace_period_end_date?: string;

  // Intermediary Details
  agent_broker_name?: string;
  broker_code?: string;
  rm_name?: string;

  // Document & Verification Provenance
  verification_status: VerificationStatus;
  extraction_confidence?: number;
  source_document_id?: string;
  source_document_name?: string;
  last_verified_at?: string;
  last_verified_by?: string;

  // Dynamic Vertical Data
  vertical_data?: Partial<HealthInsuranceData & MotorInsuranceData & LifeInsuranceData & PersonalAccidentData & TravelInsuranceData & PropertyHomeData & CommercialGeneralData>;

  // Embedded Covered Members (for Health / Life / Travel)
  members: PolicyMember[];

  // Metadata & Timestamps
  notes?: string;
  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/*                         CLAIMS & LIFECYCLE ENTITIES                        */
/* -------------------------------------------------------------------------- */

export type ClaimStatus =
  | 'INTIMATED'
  | 'DOCS_SUBMITTED'
  | 'UNDER_ASSESSMENT'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'SETTLED'
  | 'REJECTED'
  | 'REOPENED'
  | 'CLOSED';

export interface PolicyClaim {
  id: string;
  policy_id: string;
  policy_number: string;
  client_id?: string;
  claim_number: string;
  date_of_incident: string;
  date_intimated: string;
  claim_type: 'CASHLESS' | 'REIMBURSEMENT';
  claim_amount_requested: number;
  claim_amount_approved?: number;
  claim_amount_settled?: number;
  deductions?: number;
  claimant_name: string;
  claimant_relationship: MemberRelationship;
  status: ClaimStatus;
  hospital_garage_name?: string;
  tpa_reference_number?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyRenewalWorkflow {
  id: string;
  policy_id: string;
  renewal_due_date: string;
  stage: 'T_MINUS_30' | 'T_MINUS_21' | 'T_MINUS_14' | 'T_MINUS_7' | 'T_MINUS_3' | 'T_MINUS_1' | 'GRACE_PERIOD' | 'RENEWED' | 'LOST';
  last_contacted_at?: string;
  communication_channel?: 'WHATSAPP' | 'EMAIL' | 'CALL' | 'IN_PERSON';
  client_intent?: 'RENEWING_SAME' | 'EXPLORING_PORTABILITY' | 'SEEKING_UPGRADE' | 'NOT_INTERESTED' | 'UNDECIDED';
  assigned_advisor?: string;
  notes?: string;
  updated_at: string;
}

export interface MarketQuoteComparison {
  id: string;
  policy_id?: string;
  vertical: InsuranceVertical;
  current_insurer: string;
  current_sum_insured: number;
  current_premium: number;
  alternative_insurer: string;
  alternative_plan_name: string;
  quoted_sum_insured: number;
  quoted_premium: number;
  features_difference: string[];
  quote_source: string; // Sourced dated reference e.g., 'Insurer Portal Portal Ref #4829'
  quote_date: string;
  valid_until?: string;
  status: 'PROPOSED' | 'PRESENTED' | 'ACCEPTED' | 'DECLINED' | 'UNAVAILABLE';
}

export interface InsuranceAuditLog {
  id: string;
  policy_id: string;
  action: 'CREATED' | 'EXTRACTED' | 'VERIFIED' | 'UPDATED' | 'MEMBER_SYNCED' | 'CLAIM_LOGGED' | 'RENEWAL_STAGED' | 'DELETED';
  performed_by: string;
  performed_at: string;
  field_name?: string;
  old_value?: any;
  new_value?: any;
  notes?: string;
}
