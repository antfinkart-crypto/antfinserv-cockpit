# ANTFINSERV WEALTH OS (ANTOS) — UNIFIED DATA MODEL
**Schema Evolution:** Transitional Excel -> Relational PostgreSQL & Local IndexedDB

---

## 1. Core Entity Relationship Diagram (Conceptual)
```
  [Family / Household]
          | 1:N
      [Client] <--------------------+
          | 1:N                     |
     +----+----+---------+          |
     |         |         |          |
     v         v         v          |
  [Folio]   [Policy]  [Loan]        |
     |                              |
     v                              |
  [SIP / Holding]                   |
                                    |
  [Lead] --- (Convert Lead) --------+
     |
     v
  [Opportunity] -> [Activity / Task]
```

---

## 2. Core Entity Definitions

### `families` / `households`
- `id` (UUID / string, PK)
- `family_name` (string, e.g. "Gupta Family Household")
- `primary_client_id` (FK -> clients.id)
- `total_household_aum` (numeric)
- `total_monthly_sip` (numeric)
- `total_insurance_cover` (numeric)
- `notes` (text)

### `clients`
- `id` (UUID / string, PK)
- `family_id` (FK -> families.id)
- `full_name` (string)
- `pan_number` (string, unique)
- `mobile` (string)
- `email` (string)
- `dob` (date)
- `client_type` ('HNI' | 'Retail' | 'B2B Merchant' | 'Corporate')
- `firm_name` (string, for MSME merchants)
- `relationship_to_head` ('Self' | 'Spouse' | 'Child' | 'Parent' | 'Other')
- `risk_profile` ('Conservative' | 'Moderate' | 'Growth' | 'Aggressive')
- `status` ('Active' | 'Dormant' | 'Prospect')

### `mutual_fund_holdings` & `sips`
- `id` (PK)
- `client_id` (FK -> clients.id)
- `amc_name` (string)
- `scheme_name` (string)
- `category` ('Equity: Large Cap' | 'Flexi Cap' | 'Small Cap' | 'Hybrid' | 'Debt' | etc.)
- `folio_number` (string)
- `sip_due_day` (integer 1-31)
- `monthly_amt` (numeric)
- `current_aum` (numeric)
- `invested_value` (numeric)
- `units` (numeric)
- `nav` (numeric)
- `status` ('Active' | 'Paused' | 'Ceased')

### `insurance_policies`
- `id` (PK)
- `client_id` (FK -> clients.id)
- `policy_number` (string, unique)
- `insurer` (string)
- `policy_type` ('Health (Family Floater)' | 'Motor' | 'Term' | 'Commercial' | 'Property')
- `sum_insured` (numeric)
- `net_premium` (numeric)
- `expiry_date` (date)
- `primary_member_name` (string)
- `primary_member_dob` (date)
- `dep1_name`, `dep1_relation`, `dep1_dob`
- `dep2_name`, `dep2_relation`, `dep2_dob`
- `document_url`, `document_name`

### `home_loan_checks` / `acquisitions`
- `id` (PK)
- `client_name` (string)
- `mobile` (string)
- `current_lender` (string)
- `outstanding_principal` (numeric)
- `current_rate` (numeric)
- `remaining_tenure_months` (numeric)
- `current_emi` (numeric)
- `proposed_rate` (numeric)
- `transfer_costs` (numeric)
- `new_emi` (numeric)
- `gross_interest_saving` (numeric)
- `net_saving` (numeric)
- `break_even_months` (numeric)
- `decision` ('BENEFICIAL' | 'NOT BENEFICIAL ON CURRENT NUMBERS')
- `discovery_needs` (JSON / text: vehicle loan, MF relationship, MSME funding)

### `content_assets` / `marketing`
- `id` (PK)
- `topic_id` (string)
- `topic_title` (string)
- `product` ('Mutual Funds' | 'Health Insurance' | 'Home Loans' | 'Market Update')
- `format` ('WhatsApp Post' | 'LinkedIn' | 'Instagram' | 'Reel Script' | 'Client Conversation')
- `content_body` (text)
- `status` ('DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED')
