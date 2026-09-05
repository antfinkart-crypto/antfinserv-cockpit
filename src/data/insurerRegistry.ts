/**
 * ANTOS Insurance Claims Helpdesk & Insurer Registry
 * Authoritative contact information and claims intimation endpoints for Indian Insurers.
 * Grounded in actual policy documents and IRDAI registrations.
 */

export interface InsurerRecord {
  id: string;
  name: string;
  aliases: string[];
  verticals: ('HEALTH' | 'MOTOR' | 'LIFE' | 'HOME_PROPERTY' | 'COMMERCIAL_GENERAL' | 'TRAVEL')[];
  claims_helpline_tollfree: string;
  claims_helpline_alternate?: string;
  customer_support_phone: string;
  claims_email: string;
  customer_support_email: string;
  cashless_portal_url: string;
  cashless_network_url?: string;
  head_office_address: string;
  irda_reg_no?: string;
  verified_from_policy?: string;
  verified_at?: string;
  notes?: string;
}

export const DEFAULT_INSURERS: InsurerRecord[] = [
  {
    id: 'ins_godigit',
    name: 'Go Digit General Insurance Limited',
    aliases: ['Go Digit', 'Digit', 'Digit General Insurance'],
    verticals: ['MOTOR', 'HEALTH', 'HOME_PROPERTY', 'TRAVEL', 'COMMERCIAL_GENERAL'],
    claims_helpline_tollfree: '1800-258-5956',
    claims_helpline_alternate: '1800-103-4448',
    customer_support_phone: '1800-258-4242',
    claims_email: 'claims@godigit.com',
    customer_support_email: 'hello@godigit.com',
    cashless_portal_url: 'https://www.godigit.com/claims',
    cashless_network_url: 'https://www.godigit.com/network-garages',
    head_office_address: 'Atlantis, 95, 4th B Cross Road, Koramangala Industrial Layout, 5th Block, Bengaluru, Karnataka 560095',
    irda_reg_no: '158',
    verified_from_policy: 'POPMCAR00102986126 (Surinder Kumar Sonet) & D223136189',
    verified_at: '2026-08-28',
    notes: '24x7 self-inspection video link for motor accidental damage claims.'
  },
  {
    id: 'ins_icicilombard',
    name: 'ICICI Lombard General Insurance Company Limited',
    aliases: ['ICICI Lombard', 'ICICI General'],
    verticals: ['MOTOR', 'HEALTH', 'HOME_PROPERTY', 'TRAVEL', 'COMMERCIAL_GENERAL'],
    claims_helpline_tollfree: '1800-2666',
    claims_helpline_alternate: '022-61666666',
    customer_support_phone: '1800-2666',
    claims_email: 'customersupport@icicilombard.com',
    customer_support_email: 'support@icicilombard.com',
    cashless_portal_url: 'https://www.icicilombard.com/claims',
    cashless_network_url: 'https://www.icicilombard.com/cashless-garages',
    head_office_address: 'ICICI Lombard House, 414 Veer Savarkar Marg, Near Siddhivinayak Temple, Prabhadevi, Mumbai 400025',
    irda_reg_no: '115',
    verified_from_policy: '1015/452500307/00/000 (Swaminathan Arunachalam Mumbai Home)',
    verified_at: '2026-08-20',
    notes: 'IL TakeCare app provides instant cashless claim pre-authorization.'
  },
  {
    id: 'ins_starhealth',
    name: 'Star Health and Allied Insurance Company Limited',
    aliases: ['Star Health', 'Star Allied'],
    verticals: ['HEALTH', 'TRAVEL'],
    claims_helpline_tollfree: '1800-425-2255',
    claims_helpline_alternate: '1800-102-4477',
    customer_support_phone: '044-28288800',
    claims_email: 'support@starhealth.in',
    customer_support_email: 'info@starhealth.in',
    cashless_portal_url: 'https://www.starhealth.in/claims',
    cashless_network_url: 'https://www.starhealth.in/network-hospitals',
    head_office_address: 'No. 1, New Tank Street, Valluvar Kottam High Road, Nungambakkam, Chennai 600034',
    irda_reg_no: '129',
    verified_from_policy: '9453112402005501 (Jerry Mathai Comprehensive Floater)',
    verified_at: '2026-07-06',
    notes: 'India largest standalone health insurer. Dedicated in-house claim settlement team.'
  },
  {
    id: 'ins_nivabupa',
    name: 'Niva Bupa Health Insurance Company Limited',
    aliases: ['Niva Bupa', 'Max Bupa'],
    verticals: ['HEALTH', 'TRAVEL'],
    claims_helpline_tollfree: '1860-500-8888',
    claims_helpline_alternate: '011-46096000',
    customer_support_phone: '1860-500-8888',
    claims_email: 'customercare@nivabupa.com',
    customer_support_email: 'customerfirst@nivabupa.com',
    cashless_portal_url: 'https://www.nivabupa.com/claims.html',
    cashless_network_url: 'https://www.nivabupa.com/hospital-network.html',
    head_office_address: 'CP-08, Logix Cyber Park, Sector 62, Noida, Uttar Pradesh 201301',
    irda_reg_no: '145',
    verified_from_policy: '34154365202602 (Naresh Yemula Family ReAssure)',
    verified_at: '2026-08-15',
    notes: '30-minute cashless approval commitment. Any hospital cashless processing.'
  },
  {
    id: 'ins_bajajallianz',
    name: 'Bajaj Allianz General Insurance Company Limited',
    aliases: ['Bajaj Allianz', 'BAGIC'],
    verticals: ['MOTOR', 'HEALTH', 'HOME_PROPERTY', 'TRAVEL', 'COMMERCIAL_GENERAL'],
    claims_helpline_tollfree: '1800-209-5858',
    claims_helpline_alternate: '1800-102-5858',
    customer_support_phone: '020-66439090',
    claims_email: 'bagichelp@bajajallianz.co.in',
    customer_support_email: 'customercare@bajajallianz.co.in',
    cashless_portal_url: 'https://www.bajajallianz.com/claims.html',
    cashless_network_url: 'https://www.bajajallianz.com/locate-us/motor-network-garages.html',
    head_office_address: 'Bajaj Allianz House, Airport Road, Yerawada, Pune, Maharashtra 411006',
    irda_reg_no: '113',
    verified_from_policy: 'OG-25-1021-1825-0030547 (Underlying 3-Yr TP Policy for Sonet)',
    verified_at: '2026-08-28',
    notes: 'Motor OTS (On The Spot) claim settlement for repairs up to ₹30,000.'
  },
  {
    id: 'ins_carehealth',
    name: 'Care Health Insurance Limited',
    aliases: ['Care Health', 'Religare Health', 'Care'],
    verticals: ['HEALTH', 'TRAVEL'],
    claims_helpline_tollfree: '1800-102-4488',
    claims_helpline_alternate: '1800-200-4488',
    customer_support_phone: '0124-4409440',
    claims_email: 'claims@careinsurance.com',
    customer_support_email: 'customerfirst@careinsurance.com',
    cashless_portal_url: 'https://www.careinsurance.com/claim-settlement.html',
    head_office_address: 'Vipul Tech Square, Tower C, 3rd Floor, Golf Course Road, Sector 43, Gurugram, Haryana 122009',
    irda_reg_no: '148',
    verified_from_policy: 'Official IRDAI Register',
    verified_at: '2026-08-01',
    notes: 'In-house claim processing team with digital cashless hospital pre-auth.'
  },
  {
    id: 'ins_hdfcergo',
    name: 'HDFC ERGO General Insurance Company Limited',
    aliases: ['HDFC ERGO', 'HDFC General'],
    verticals: ['MOTOR', 'HEALTH', 'HOME_PROPERTY', 'TRAVEL', 'COMMERCIAL_GENERAL'],
    claims_helpline_tollfree: '1800-2666-400',
    claims_helpline_alternate: '022-62346234',
    customer_support_phone: '1800-2666-400',
    claims_email: 'care@hdfcergo.com',
    customer_support_email: 'grievance@hdfcergo.com',
    cashless_portal_url: 'https://www.hdfcergo.com/claims',
    head_office_address: 'D-301, 3rd Floor, Eastern Business District, LBS Marg, Bhandup West, Mumbai 400078',
    irda_reg_no: '146',
    verified_from_policy: 'Official IRDAI Register',
    verified_at: '2026-08-01',
    notes: '20-minute cashless hospital turnaround guarantee with Here App.'
  },
  {
    id: 'ins_tataaig',
    name: 'Tata AIG General Insurance Company Limited',
    aliases: ['Tata AIG', 'Tata General'],
    verticals: ['MOTOR', 'HEALTH', 'HOME_PROPERTY', 'TRAVEL', 'COMMERCIAL_GENERAL'],
    claims_helpline_tollfree: '1800-266-7780',
    claims_helpline_alternate: '1800-22-9966',
    customer_support_phone: '1800-266-7780',
    claims_email: 'customersupport@tataaig.com',
    customer_support_email: 'general.complaints@tataaig.com',
    cashless_portal_url: 'https://www.tataaig.com/claims',
    head_office_address: 'Peninsula Business Park, Tower A, 15th Floor, G.K. Marg, Lower Parel, Mumbai 400013',
    irda_reg_no: '108',
    verified_from_policy: 'Official IRDAI Register',
    verified_at: '2026-08-01',
    notes: 'Over 8,200+ cashless network garages and 10,000+ hospital network.'
  },
  {
    id: 'ins_sbigeneral',
    name: 'SBI General Insurance Company Limited',
    aliases: ['SBI General'],
    verticals: ['MOTOR', 'HEALTH', 'HOME_PROPERTY', 'COMMERCIAL_GENERAL'],
    claims_helpline_tollfree: '1800-102-1111',
    claims_helpline_alternate: '1800-22-1111',
    customer_support_phone: '1800-102-1111',
    claims_email: 'customer.care@sbigeneral.in',
    customer_support_email: 'gro@sbigeneral.in',
    cashless_portal_url: 'https://www.sbigeneral.in/claims',
    head_office_address: '9th Floor, A & B Wing, Fulcrum Building, Sahar Road, Andheri East, Mumbai 400099',
    irda_reg_no: '144',
    verified_from_policy: 'Official IRDAI Register',
    verified_at: '2026-08-01',
    notes: 'Backed by State Bank of India network. Seamless rural & semi-urban presence.'
  },
  {
    id: 'ins_lic',
    name: 'Life Insurance Corporation of India (LIC)',
    aliases: ['LIC', 'LIC of India'],
    verticals: ['LIFE'],
    claims_helpline_tollfree: '022-68276827',
    customer_support_phone: '022-68276827',
    claims_email: 'co_claims@licindia.com',
    customer_support_email: 'bo_grievance@licindia.com',
    cashless_portal_url: 'https://licindia.com/claims',
    head_office_address: 'Yogakshema Building, Jeevan Bima Marg, Nariman Point, Mumbai 400021',
    irda_reg_no: 'Statutory Body (LIC Act 1956)',
    verified_from_policy: 'Official LIC Schedule',
    verified_at: '2026-08-01',
    notes: 'Settles over 98.5% death claims. Requires original bond submission at servicing branch.'
  },
  {
    id: 'ins_hdfclife',
    name: 'HDFC Life Insurance Company Limited',
    aliases: ['HDFC Life'],
    verticals: ['LIFE'],
    claims_helpline_tollfree: '1800-266-9777',
    claims_helpline_alternate: '022-68446530',
    customer_support_phone: '1800-266-9777',
    claims_email: 'claims@hdfclife.com',
    customer_support_email: 'service@hdfclife.com',
    cashless_portal_url: 'https://www.hdfclife.com/claims',
    head_office_address: 'Lodha Excelus, 13th Floor, Apollo Mills Compound, N.M. Joshi Marg, Mahalaxmi, Mumbai 400011',
    irda_reg_no: '101',
    verified_from_policy: 'Official IRDAI Register',
    verified_at: '2026-08-01',
    notes: '1-day claim settlement commitment for eligible policies held over 3 years.'
  },
  {
    id: 'ins_iciciprulife',
    name: 'ICICI Prudential Life Insurance Company Limited',
    aliases: ['ICICI Prudential Life', 'ICICI Pru Life'],
    verticals: ['LIFE'],
    claims_helpline_tollfree: '1860-266-7766',
    claims_helpline_alternate: '1800-222-999',
    customer_support_phone: '1860-266-7766',
    claims_email: 'claimsupport@iciciprulife.com',
    customer_support_email: 'lifeline@iciciprulife.com',
    cashless_portal_url: 'https://www.iciciprulife.com/claims/claims.html',
    head_office_address: '1089, Appasaheb Marathe Marg, Prabhadevi, Mumbai 400025',
    irda_reg_no: '105',
    verified_from_policy: 'Official IRDAI Register',
    verified_at: '2026-08-01',
    notes: 'Claim For Sure initiative: Claim decision within 1 day on eligible non-investigative claims.'
  }
];

export function findInsurerRecord(name: string, insurers: InsurerRecord[] = DEFAULT_INSURERS): InsurerRecord | null {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  for (const ins of insurers) {
    if (ins.name.toLowerCase().includes(clean) || clean.includes(ins.name.toLowerCase())) {
      return ins;
    }
    for (const alias of ins.aliases) {
      if (clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(clean)) {
        return ins;
      }
    }
  }
  return null;
}
