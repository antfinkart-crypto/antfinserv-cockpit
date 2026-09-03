-- ==============================================================================
-- ANTFINSERV COCKPIT PWA — SUPABASE POSTGRESQL PRODUCTION DDL
-- Entity: AntFinserv.com | AMFI Regd. Mutual Fund Distributor (ARN-94204)
-- Target: 100% Free-Tier Cloud PostgreSQL on Supabase
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ANTOS Client Master (Authoritative Central Identity)
CREATE TABLE IF NOT EXISTS client_master (
    client_id VARCHAR(100) PRIMARY KEY,
    source_system VARCHAR(50) DEFAULT 'MFBOX',
    source_user_id VARCHAR(100),
    family_id VARCHAR(100),
    mapping_role VARCHAR(50) DEFAULT 'Individual', -- 'Head', 'Member', 'Individual'
    pan VARCHAR(10), -- Nullable for minors! Zero dummy PAN rule.
    investor_name VARCHAR(255) NOT NULL,
    dob DATE,
    source_age INT,
    gender VARCHAR(20) DEFAULT 'Not Specified',
    mobile VARCHAR(20),
    email VARCHAR(255),
    address_line_1 TEXT,
    address_line_2 TEXT,
    address_line_3 TEXT,
    city VARCHAR(100),
    pincode VARCHAR(20),
    state VARCHAR(100),
    branch VARCHAR(100),
    rm_name VARCHAR(150),
    associate_name VARCHAR(150),
    bse_nse_code VARCHAR(100),
    broker_code VARCHAR(100),
    aum NUMERIC(14, 2) DEFAULT 0.00,
    first_investment_date DATE,
    created_date DATE,
    is_manually_edited BOOLEAN DEFAULT FALSE,
    data_quality_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial Unique Index on PAN (enforces uniqueness ONLY when non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_master_pan ON client_master(pan) WHERE pan IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_master_family_id ON client_master(family_id);
CREATE INDEX IF NOT EXISTS idx_client_master_source_user ON client_master(source_user_id);
CREATE INDEX IF NOT EXISTS idx_client_master_mobile ON client_master(mobile);

-- 1B. Client Audit History
CREATE TABLE IF NOT EXISTS client_audit_history (
    id VARCHAR(100) PRIMARY KEY,
    client_id VARCHAR(100) REFERENCES client_master(client_id) ON DELETE CASCADE,
    field VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by VARCHAR(100),
    source VARCHAR(50),
    import_id VARCHAR(100)
);

-- 1C. Client Import History
CREATE TABLE IF NOT EXISTS client_import_history (
    import_id VARCHAR(100) PRIMARY KEY,
    source_system VARCHAR(50) DEFAULT 'MFBOX',
    source_filename VARCHAR(255) NOT NULL,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    imported_by VARCHAR(100),
    rows_processed INT DEFAULT 0,
    new_count INT DEFAULT 0,
    updated_count INT DEFAULT 0,
    unchanged_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    missing_pan_count INT DEFAULT 0,
    missing_dob_count INT DEFAULT 0,
    missing_mobile_count INT DEFAULT 0,
    missing_email_count INT DEFAULT 0,
    warnings JSONB DEFAULT '[]'::jsonb
);

-- 1D. Legacy Clients Table (preserved for backward compatibility)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pan_number VARCHAR(10) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    firm_name VARCHAR(255),
    client_type VARCHAR(50) DEFAULT 'Retail',
    dob DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mutual Fund SIP Portfolios (RTA Feeds)
CREATE TABLE IF NOT EXISTS sip_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_pan VARCHAR(10) REFERENCES clients(pan_number) ON DELETE CASCADE,
    folio_number VARCHAR(100),
    amc_name VARCHAR(150),
    scheme_code VARCHAR(100),
    scheme_name VARCHAR(255) NOT NULL,
    sip_due_day INT CHECK (sip_due_day BETWEEN 1 AND 31),
    monthly_amt NUMERIC(12, 2) NOT NULL,
    current_aum NUMERIC(14, 2) DEFAULT 0.00,
    xirr NUMERIC(6, 2),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Lead Acquisition Pipeline (B2B MSME Focus)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    pan_number VARCHAR(10),
    email VARCHAR(255),
    industry_sector VARCHAR(100), -- 'Plywood', 'Hardware', 'Cement', 'Sanitary', 'Iron/Steel', etc.
    next_followup_date DATE,
    status VARCHAR(50) DEFAULT 'Warm Lead', -- 'Warm Lead', 'Cold Contact', 'Negotiation Phase', 'Converted'
    notes TEXT,
    is_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Protection & Insurance Vault
CREATE TABLE IF NOT EXISTS protection_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    insurer VARCHAR(150) NOT NULL,
    policy_type VARCHAR(100) NOT NULL, -- 'Health (Family Floater)', 'Motor', 'Term'
    net_premium NUMERIC(12, 2) NOT NULL,
    sum_insured NUMERIC(14, 2) NOT NULL,
    expiry_date DATE NOT NULL,
    primary_member_name VARCHAR(255),
    primary_member_dob DATE,
    dep1_name VARCHAR(255),
    dep1_relation VARCHAR(50),
    dep1_dob DATE,
    dep2_name VARCHAR(255),
    dep2_relation VARCHAR(50),
    dep2_dob DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sync Conflict & Audit Log
CREATE TABLE IF NOT EXISTS sync_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(20) NOT NULL, -- 'EXCEL' or 'PWA'
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    payload JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning queries
CREATE INDEX IF NOT EXISTS idx_clients_mobile ON clients(mobile);
CREATE INDEX IF NOT EXISTS idx_sip_due_day ON sip_portfolios(sip_due_day);
CREATE INDEX IF NOT EXISTS idx_sip_client_pan ON sip_portfolios(client_pan);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON leads(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_protection_expiry ON protection_assets(expiry_date);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_clients_modtime
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER update_sips_modtime
    BEFORE UPDATE ON sip_portfolios
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER update_leads_modtime
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER update_protection_modtime
    BEFORE UPDATE ON protection_assets
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Row Level Security (RLS) Configuration
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sip_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE protection_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow public access with anon key for PWA & local bridge
CREATE POLICY "Allow anon read all" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow anon write all" ON clients FOR ALL USING (true);

CREATE POLICY "Allow anon read sip" ON sip_portfolios FOR SELECT USING (true);
CREATE POLICY "Allow anon write sip" ON sip_portfolios FOR ALL USING (true);

CREATE POLICY "Allow anon read leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow anon write leads" ON leads FOR ALL USING (true);

CREATE POLICY "Allow anon read protection" ON protection_assets FOR SELECT USING (true);
CREATE POLICY "Allow anon write protection" ON protection_assets FOR ALL USING (true);

CREATE POLICY "Allow anon read audit" ON sync_audit_log FOR SELECT USING (true);
CREATE POLICY "Allow anon write audit" ON sync_audit_log FOR ALL USING (true);
