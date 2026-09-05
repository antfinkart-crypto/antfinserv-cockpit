/**
 * ANTOS Institutional Entity Resolution & Deduplication Engine
 * Specialized for Indian Financial Services, Wealth Management, and InsurTech.
 * 
 * Prevents "Household Over-Clustering" (e.g. Husband, Wife, and Son sharing 
 * the exact same phone, email, and residential flat address).
 * 
 * Enforces a Deterministic 3-Tier Architecture:
 * - Tier 0: Strict Inviolable Disqualification (PAN conflict, Gender mismatch, Generational age gap, distinct first names)
 * - Tier 1: Definitive 100% Match (Matching valid PAN)
 * - Tier 2: Dual-Pillar Corroboration Engine (Pillar A: Individual Identity + Pillar B: Household/Premise)
 */

export interface EntityRecord {
  id?: string;
  client_id?: string;
  name?: string | null;
  investor_name?: string | null;
  member_name?: string | null;
  proposer_name?: string | null;
  pan?: string | null;
  gender?: string | null;
  dob?: string | null;
  mobile?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  address_line_1?: string | null;
  city?: string | null;
  pincode?: string | null;
  relationship_to_head?: string | null;
  mapping_role?: string | null;
}

export interface EntityMatchResult {
  isMatch: boolean;
  confidence: number;
  tier: 'TIER_0_DISQUALIFIED' | 'TIER_1_PAN' | 'TIER_2_DUAL_PILLAR' | 'NO_MATCH';
  reason: string;
}

export function normalizeMobile(mob: string | null | undefined): string | null {
  if (!mob) return null;
  const cleaned = mob.replace(/\D/g, '');
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length > 10) {
    const last10 = cleaned.slice(-10);
    if (/^[6-9]/.test(last10)) return last10;
  }
  return cleaned.length >= 10 ? cleaned.slice(-10) : null;
}

export function normalizePan(pan: string | null | undefined): string | null {
  if (!pan) return null;
  const clean = pan.trim().toUpperCase();
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) {
    return clean;
  }
  return null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@') || clean.length < 5) return null;
  if (
    clean.includes('customersupport@') ||
    clean.includes('customerservice@') ||
    clean.includes('support@') ||
    clean.includes('helpdesk@') ||
    clean.includes('noreply@') ||
    clean.includes('@godigit.com') ||
    clean.includes('@icicilombard.com') ||
    clean.includes('@pbpartners.com')
  ) {
    return null;
  }
  return clean;
}

export function normalizeNameTokens(rawName: string | null | undefined): {
  raw: string;
  tokens: string[];
  initials: string[];
  longTokens: string[];
} {
  if (!rawName) return { raw: '', tokens: [], initials: [], longTokens: [] };
  const clean = rawName
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\b(MR|MRS|MS|DR|SH|SMT|KUMARI|SHRI)\b/g, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials: string[] = [];
  const longTokens: string[] = [];

  parts.forEach(p => {
    if (p.length === 1) {
      initials.push(p);
    } else {
      longTokens.push(p);
    }
  });

  return {
    raw: clean,
    tokens: parts,
    initials,
    longTokens
  };
}

export function extractAddressTokens(addr: string | null | undefined): {
  flatNumbers: string[];
  societyKeywords: string[];
  pincode: string | null;
} {
  if (!addr) return { flatNumbers: [], societyKeywords: [], pincode: null };
  const clean = addr.toLowerCase();

  const pinMatch = clean.match(/\b\d{6}\b/);
  const pincode = pinMatch ? pinMatch[0] : null;

  const flatMatches = clean.match(/\b(?:flat\s*(?:no|#)?\s*)?([a-z]?[- ]?\d{1,5}[a-z]?)\b/g) || [];
  const flatNumbers = flatMatches
    .map(f => f.replace(/flat|no|#|\s/g, '').trim())
    .filter(f => /\d/.test(f) && f.length >= 1 && f.length <= 6);

  const societyTokens = clean
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => [
      'oberoi', 'splendor', 'sherwood', 'tata', 'godrej', 'dlf', 'lodha',
      'hiranandani', 'brigade', 'prestige', 'sobha', 'puravankara', 'majas', 'jvlr'
    ].includes(w));

  return {
    flatNumbers,
    societyKeywords: Array.from(new Set(societyTokens)),
    pincode
  };
}

export function isSamePersonOrEntity(
  a: EntityRecord,
  b: EntityRecord
): EntityMatchResult {
  const panA = normalizePan(a.pan);
  const panB = normalizePan(b.pan);

  const mobA = normalizeMobile(a.mobile || a.phone);
  const mobB = normalizeMobile(b.mobile || b.phone);

  const emailA = normalizeEmail(a.email);
  const emailB = normalizeEmail(b.email);

  const nameA = normalizeNameTokens(a.name || a.investor_name || a.member_name || a.proposer_name);
  const nameB = normalizeNameTokens(b.name || b.investor_name || b.member_name || b.proposer_name);

  const genderA = (a.gender || '').trim().toLowerCase();
  const genderB = (b.gender || '').trim().toLowerCase();

  const dobA = a.dob ? a.dob.slice(0, 10) : null;
  const dobB = b.dob ? b.dob.slice(0, 10) : null;

  // =========================================================================
  // TIER 0: STRICT NEGATIVE DISQUALIFICATION (NEVER MERGE IF CONFLICT DETECTED)
  // =========================================================================

  // 1. PAN Conflict: Both have different valid PANs
  if (panA && panB && panA !== panB) {
    return {
      isMatch: false,
      confidence: 0,
      tier: 'TIER_0_DISQUALIFIED',
      reason: `Strict Disqualification: Different PAN cards (${panA} vs ${panB}) prove distinct legal persons.`
    };
  }

  // 2. Gender Mismatch: Male vs Female
  const isGenderAStated = genderA === 'male' || genderA === 'female';
  const isGenderBStated = genderB === 'male' || genderB === 'female';
  if (isGenderAStated && isGenderBStated && genderA !== genderB) {
    return {
      isMatch: false,
      confidence: 0,
      tier: 'TIER_0_DISQUALIFIED',
      reason: `Strict Disqualification: Gender mismatch (${genderA} vs ${genderB}) prevents merging family members.`
    };
  }

  // 3. Generational Age Gap: Difference in birth years > 2 years
  if (dobA && dobB) {
    const yearA = parseInt(dobA.slice(0, 4), 10);
    const yearB = parseInt(dobB.slice(0, 4), 10);
    if (!isNaN(yearA) && !isNaN(yearB) && Math.abs(yearA - yearB) > 2) {
      if (!(panA && panB && panA === panB)) {
        return {
          isMatch: false,
          confidence: 0,
          tier: 'TIER_0_DISQUALIFIED',
          reason: `Strict Disqualification: Generational age difference (${yearA} vs ${yearB}) prevents parent/child merge.`
        };
      }
    }
  }

  // 4. Conflicting Household Roles
  const roleA = (a.relationship_to_head || a.mapping_role || '').toLowerCase();
  const roleB = (b.relationship_to_head || b.mapping_role || '').toLowerCase();
  const isHeadA = roleA === 'head' || roleA === 'self';
  const isHeadB = roleB === 'head' || roleB === 'self';
  const isDependentA = roleA === 'spouse' || roleA === 'son' || roleA === 'daughter' || roleA === 'child';
  const isDependentB = roleB === 'spouse' || roleB === 'son' || roleB === 'daughter' || roleB === 'child';
  if ((isHeadA && isDependentB) || (isHeadB && isDependentA)) {
    if (!(panA && panB && panA === panB)) {
      return {
        isMatch: false,
        confidence: 0,
        tier: 'TIER_0_DISQUALIFIED',
        reason: `Strict Disqualification: Household role conflict (${roleA} vs ${roleB}) protects separate family records.`
      };
    }
  }

  // 5. Completely Distinct First Names
  if (nameA.longTokens.length > 0 && nameB.longTokens.length > 0) {
    const sharedLongTokens = nameA.longTokens.filter(t => nameB.longTokens.includes(t));
    const hasInitialExpansion =
      (nameA.initials.length > 0 && nameB.longTokens.some(t => nameA.initials.includes(t[0]))) ||
      (nameB.initials.length > 0 && nameA.longTokens.some(t => nameB.initials.includes(t[0])));

    if (sharedLongTokens.length === 0 && !hasInitialExpansion) {
      if (!(panA && panB && panA === panB)) {
        return {
          isMatch: false,
          confidence: 0,
          tier: 'TIER_0_DISQUALIFIED',
          reason: `Strict Disqualification: Distinct names (${nameA.raw} vs ${nameB.raw}).`
        };
      }
    }
  }

  // =========================================================================
  // TIER 1: DEFINITIVE 100% PAN MATCH
  // =========================================================================
  if (panA && panB && panA === panB) {
    return {
      isMatch: true,
      confidence: 1.0,
      tier: 'TIER_1_PAN',
      reason: `Definitive Match: Identical PAN card (${panA}) across both records.`
    };
  }

  // =========================================================================
  // TIER 2: DUAL-PILLAR CORROBORATION ENGINE (Pillar A + Pillar B)
  // =========================================================================

  // PILLAR A: INDIVIDUAL IDENTITY CHECK (MUST PASS)
  let pillarAPassed = false;
  let nameScore = 0;

  if (nameA.raw && nameB.raw && nameA.raw === nameB.raw) {
    nameScore = 3.0;
  } else {
    const sharedTokens = nameA.longTokens.filter(t => nameB.longTokens.includes(t));
    const initialMatches =
      (nameA.initials.length > 0 && nameB.longTokens.some(t => nameA.initials.includes(t[0]))) ||
      (nameB.initials.length > 0 && nameA.longTokens.some(t => nameB.initials.includes(t[0])));

    if (sharedTokens.length > 0 && (initialMatches || nameA.tokens.length === sharedTokens.length || nameB.tokens.length === sharedTokens.length)) {
      nameScore = 2.5;
    } else if (sharedTokens.length > 0) {
      nameScore = 1.5;
    }
  }

  const isDobSame = dobA && dobB && dobA === dobB;

  if (nameScore >= 2.0 && (!isGenderAStated || !isGenderBStated || genderA === genderB)) {
    pillarAPassed = true;
  }

  // PILLAR B: CONTACT / PREMISE CORROBORATION (AT LEAST 2 MUST PASS)
  let pillarBMatches = 0;
  const pillarBReasons: string[] = [];

  if (mobA && mobB && mobA === mobB) {
    pillarBMatches++;
    pillarBReasons.push(`Mobile ${mobA}`);
  }

  if (emailA && emailB && emailA === emailB) {
    pillarBMatches++;
    pillarBReasons.push(`Email ${emailA}`);
  }

  const addrA = extractAddressTokens((a.address || a.address_line_1 || '') + ' ' + (a.city || '') + ' ' + (a.pincode || ''));
  const addrB = extractAddressTokens((b.address || b.address_line_1 || '') + ' ' + (b.city || '') + ' ' + (b.pincode || ''));

  const matchingFlats = addrA.flatNumbers.filter(f => addrB.flatNumbers.includes(f));
  const matchingSocieties = addrA.societyKeywords.filter(s => addrB.societyKeywords.includes(s));
  const matchingPincode = addrA.pincode && addrB.pincode && addrA.pincode === addrB.pincode;

  if (matchingFlats.length > 0 || (matchingSocieties.length > 0 && matchingPincode) || (matchingSocieties.length >= 2)) {
    pillarBMatches++;
    pillarBReasons.push(`Premises (${matchingFlats.join(', ') || matchingSocieties.join(', ')})`);
  }

  if (isDobSame) {
    pillarBMatches++;
    pillarBReasons.push(`DOB ${dobA}`);
  }

  if (pillarAPassed && pillarBMatches >= 2) {
    return {
      isMatch: true,
      confidence: 0.95,
      tier: 'TIER_2_DUAL_PILLAR',
      reason: `Dual-Pillar Match: Individual (${nameA.raw} ~ ${nameB.raw}) corroborated by ${pillarBReasons.join(', ')}.`
    };
  }

  if ((panA || panB) && nameScore >= 2.5 && mobA && mobB && mobA === mobB) {
    return {
      isMatch: true,
      confidence: 0.90,
      tier: 'TIER_2_DUAL_PILLAR',
      reason: `High Confidence Corroboration: Name initial match + identical mobile (${mobA}).`
    };
  }

  return {
    isMatch: false,
    confidence: 0.2,
    tier: 'NO_MATCH',
    reason: `Insufficient matching evidence (Pillar A: ${pillarAPassed ? 'PASS' : 'FAIL'}, Pillar B: ${pillarBMatches}/2 matches).`
  };
}

export function findMatchingClient<T extends EntityRecord>(
  record: EntityRecord,
  clientMasterList: T[]
): T | null {
  for (const client of clientMasterList) {
    const res = isSamePersonOrEntity(record, client);
    if (res.isMatch) {
      return client;
    }
  }
  return null;
}
