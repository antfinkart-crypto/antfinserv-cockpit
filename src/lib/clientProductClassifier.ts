import {
  ClientMasterRecord,
  MfHolding,
  ActiveSip,
  Lead,
  ProtectionAsset,
  InsurancePolicy
} from '../types';

export const STANDARD_PRODUCTS = [
  'Mutual Funds',
  'Health Insurance',
  'Motor Insurance',
  'Life Insurance',
  'Home Loans',
  'Travel Insurance',
  'General Insurance'
] as const;

export type StandardProduct = typeof STANDARD_PRODUCTS[number];

function normalizeStr(str?: string | null): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function isClientMatchingPolicy(
  client: ClientMasterRecord,
  policy: InsurancePolicy | ProtectionAsset
): boolean {
  if ('primary_client_id' in policy && policy.primary_client_id && policy.primary_client_id === client.client_id) {
    return true;
  }

  const cMobile = (client.mobile || '').replace(/\D/g, '');
  if (cMobile.length >= 10) {
    if ('proposer_mobile' in policy && policy.proposer_mobile) {
      const pMobile = policy.proposer_mobile.replace(/\D/g, '');
      if (pMobile.includes(cMobile) || cMobile.includes(pMobile)) return true;
    }
  }

  const cNorm = normalizeStr(client.investor_name);
  if (!cNorm) return false;

  const polNameNorm = normalizeStr(
    'client_name' in policy ? policy.client_name : (policy as ProtectionAsset).client_name
  );
  const proposerNorm = normalizeStr(
    'proposer_name' in policy ? policy.proposer_name : (policy as ProtectionAsset).primary_member_name
  );

  if (polNameNorm && (cNorm.includes(polNameNorm) || polNameNorm.includes(cNorm))) return true;
  if (proposerNorm && (cNorm.includes(proposerNorm) || proposerNorm.includes(cNorm))) return true;

  if ('members' in policy && Array.isArray(policy.members)) {
    for (const m of policy.members) {
      if (m.client_id && m.client_id === client.client_id) return true;
      const mNorm = normalizeStr(m.member_name);
      if (mNorm && (cNorm === mNorm || (cNorm.length > 5 && mNorm.includes(cNorm)))) return true;
    }
  }

  return false;
}

export function getClientActiveProducts(
  client: ClientMasterRecord,
  holdings: MfHolding[] = [],
  sips: ActiveSip[] = [],
  insurancePolicies: InsurancePolicy[] = [],
  policies: ProtectionAsset[] = [],
  leads: Lead[] = []
): string[] {
  const products = new Set<string>(client.primary_products || []);

  const hasAum = (client.aum || 0) > 0;
  const hasHoldings = holdings.some(
    h => (client.pan && h.pan === client.pan) || normalizeStr(h.investor_name) === normalizeStr(client.investor_name)
  );
  const hasSips = sips.some(
    s => (client.pan && s.pan_number === client.pan) || normalizeStr(s.investor_name) === normalizeStr(client.investor_name)
  );
  if (hasAum || hasHoldings || hasSips) {
    products.add('Mutual Funds');
  }

  insurancePolicies.forEach(pol => {
    if (isClientMatchingPolicy(client, pol)) {
      switch (pol.vertical) {
        case 'HEALTH':
          products.add('Health Insurance');
          break;
        case 'MOTOR':
          products.add('Motor Insurance');
          break;
        case 'LIFE':
          products.add('Life Insurance');
          break;
        case 'TRAVEL':
          products.add('Travel Insurance');
          break;
        case 'HOME_PROPERTY':
        case 'COMMERCIAL_GENERAL':
        case 'PERSONAL_ACCIDENT':
          products.add('General Insurance');
          break;
        default:
          products.add('Insurance');
      }
    }
  });

  policies.forEach(pol => {
    if (isClientMatchingPolicy(client, pol)) {
      const type = (pol.policy_type || '').toLowerCase();
      if (type.includes('motor') || type.includes('car') || type.includes('bike')) {
        products.add('Motor Insurance');
      } else if (type.includes('term') || type.includes('life')) {
        products.add('Life Insurance');
      } else if (type.includes('travel')) {
        products.add('Travel Insurance');
      } else {
        products.add('Health Insurance');
      }
    }
  });

  if (client.loan_details && client.loan_details.sanctioned_amount) {
    products.add(client.loan_details.loan_type || 'Home Loans');
  } else {
    const hasLoanLead = leads.some(l => {
      const isOwner = normalizeStr(l.owner_name) === normalizeStr(client.investor_name);
      const isMobile = client.mobile && l.mobile && l.mobile.includes(client.mobile.slice(-8));
      return (isOwner || isMobile) && (l.prospect_type?.toLowerCase().includes('loan') || l.status === 'Converted');
    });
    if (hasLoanLead) {
      products.add('Home Loans');
    }
  }

  if (products.size === 0) {
    if (client.source_system === 'INSURANCE') {
      products.add('Health Insurance');
    } else if (client.source_system === 'LOANS') {
      products.add('Home Loans');
    } else {
      products.add('Mutual Funds');
    }
  }

  return Array.from(products);
}

export function isClientInBucket(
  client: ClientMasterRecord,
  bucket: 'all' | 'mf' | 'insurance' | 'loans' | 'travel',
  products: string[]
): boolean {
  if (bucket === 'all') return true;

  if (bucket === 'mf') {
    return products.includes('Mutual Funds') || (client.aum || 0) > 0;
  }

  if (bucket === 'insurance') {
    return products.some(p =>
      ['Health Insurance', 'Motor Insurance', 'Life Insurance', 'Travel Insurance', 'General Insurance', 'Insurance'].includes(p)
    );
  }

  if (bucket === 'loans') {
    return products.some(p =>
      ['Home Loans', 'Loans', 'Personal Loan', 'Business Loan', 'Loan Against Property'].includes(p)
    ) || Boolean(client.loan_details?.sanctioned_amount);
  }

  if (bucket === 'travel') {
    return products.includes('Travel Insurance') || products.includes('General Insurance');
  }

  return false;
}

export interface ClientInsuranceSummary {
  policyCount: number;
  totalSumInsured: number;
  totalPremium: number;
  verticals: string[];
  nextRenewalDate: string | null;
  policiesList: Array<{
    id: string;
    policy_number: string;
    insurer: string;
    vertical: string;
    sum_insured: number;
    premium: number;
    expiry_date: string;
  }>;
}

export function getClientInsuranceSummary(
  client: ClientMasterRecord,
  insurancePolicies: InsurancePolicy[] = [],
  policies: ProtectionAsset[] = []
): ClientInsuranceSummary {
  const matchingModern = insurancePolicies.filter(p => isClientMatchingPolicy(client, p));
  const matchingLegacy = policies.filter(p => isClientMatchingPolicy(client, p));

  const seenNumbers = new Set<string>();
  const policiesList: ClientInsuranceSummary['policiesList'] = [];
  const verticals = new Set<string>();
  let totalSumInsured = 0;
  let totalPremium = 0;
  let earliestRenewal: string | null = null;

  matchingModern.forEach(p => {
    if (!seenNumbers.has(p.policy_number)) {
      seenNumbers.add(p.policy_number);
      verticals.add(p.vertical);
      totalSumInsured += p.sum_insured || 0;
      totalPremium += p.net_premium || 0;
      if (!earliestRenewal || p.renewal_due_date < earliestRenewal) {
        earliestRenewal = p.renewal_due_date;
      }
      policiesList.push({
        id: p.id,
        policy_number: p.policy_number,
        insurer: p.insurer_name,
        vertical: p.vertical,
        sum_insured: p.sum_insured,
        premium: p.net_premium,
        expiry_date: p.expiry_date
      });
    }
  });

  matchingLegacy.forEach(p => {
    if (!seenNumbers.has(p.policy_number)) {
      seenNumbers.add(p.policy_number);
      const v = (p.policy_type || '').includes('Motor') ? 'MOTOR' : (p.policy_type || '').includes('Term') ? 'LIFE' : 'HEALTH';
      verticals.add(v);
      totalSumInsured += p.sum_insured || 0;
      totalPremium += p.net_premium || 0;
      if (p.expiry_date && (!earliestRenewal || p.expiry_date < earliestRenewal)) {
        earliestRenewal = p.expiry_date;
      }
      policiesList.push({
        id: p.id,
        policy_number: p.policy_number,
        insurer: p.insurer,
        vertical: v,
        sum_insured: p.sum_insured,
        premium: p.net_premium,
        expiry_date: p.expiry_date
      });
    }
  });

  return {
    policyCount: policiesList.length,
    totalSumInsured,
    totalPremium,
    verticals: Array.from(verticals),
    nextRenewalDate: earliestRenewal,
    policiesList
  };
}

export interface ClientMfSummary {
  aum: number;
  monthlySip: number;
  folioCount: number;
}

export function getClientMfSummary(
  client: ClientMasterRecord,
  holdings: MfHolding[] = [],
  sips: ActiveSip[] = []
): ClientMfSummary {
  const clientPan = client.pan;
  const clientNameNorm = normalizeStr(client.investor_name);

  const clientHoldings = holdings.filter(h =>
    (clientPan && h.pan === clientPan) || (clientNameNorm && normalizeStr(h.investor_name) === clientNameNorm)
  );

  const clientSips = sips.filter(s =>
    (clientPan && s.pan_number === clientPan) || (clientNameNorm && normalizeStr(s.investor_name) === clientNameNorm)
  );

  const aum = clientHoldings.reduce((sum, h) => sum + (h.current_value || 0), client.aum || 0);
  const monthlySip = clientSips.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);
  const folios = new Set(clientHoldings.map(h => h.folio_number)).size;

  return {
    aum,
    monthlySip,
    folioCount: folios || (aum > 0 ? 1 : 0)
  };
}
