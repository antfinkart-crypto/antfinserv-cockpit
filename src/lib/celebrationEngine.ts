import { Client, ClientMasterRecord, ProtectionAsset, CelebrationAlert } from '../types';

/**
 * Celebration & Relationship Intelligence Engine
 * - Evaluates Primary Client DOB vs Dependent DOBs
 * - Real Unicode Emojis (🎂, ✨, 🙏) safely encoded
 * - High priority for Primary Client personal greetings
 * - Relationship-tailored greetings for family dependents
 */

export function parseDateOfBirth(dobStr: string | null | undefined): { day: number; month: number; year?: number } | null {
  if (!dobStr) return null;
  const cleaned = dobStr.trim();

  // Handle DD-MM-YYYY or DD-MM-YY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1; // 0-indexed
    let year = parseInt(ddmmyyyy[3], 10);
    if (year < 100) {
      year = year > 30 ? 1900 + year : 2000 + year;
    }
    return { day, month, year };
  }

  // Handle YYYY-MM-DD (ISO)
  const yyyymmdd = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    return { day, month, year };
  }

  return null;
}

export function getCelebrationAlerts(
  clients: (Client | ClientMasterRecord)[],
  policies: ProtectionAsset[],
  baseDate: Date = new Date()
): CelebrationAlert[] {
  const alerts: CelebrationAlert[] = [];
  const todayDay = baseDate.getDate();
  const todayMonth = baseDate.getMonth();

  // Helper to calculate days until birthday
  const getDaysUntil = (bDay: number, bMonth: number): number => {
    const thisYearBday = new Date(baseDate.getFullYear(), bMonth, bDay);
    if (thisYearBday < new Date(baseDate.getFullYear(), todayMonth, todayDay)) {
      thisYearBday.setFullYear(baseDate.getFullYear() + 1);
    }
    const diffTime = thisYearBday.getTime() - new Date(baseDate.getFullYear(), todayMonth, todayDay).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. Scan Clients Master (Each person evaluated once)
  clients.forEach(c => {
    if (!c.dob) return;
    const parsed = parseDateOfBirth(c.dob);
    if (!parsed) return;

    const daysUntil = getDaysUntil(parsed.day, parsed.month);
    if (daysUntil <= 30) {
      const age = parsed.year ? baseDate.getFullYear() - parsed.year : undefined;
      const clientName = ('investor_name' in c && c.investor_name) ? c.investor_name : (c as Client).full_name;
      const keyId = ('client_id' in c && c.client_id) ? c.client_id : ((c as any).pan || (c as any).pan_number || clientName);

      alerts.push({
        id: `client-${keyId}`,
        client_name: clientName,
        celebrant_name: clientName,
        relationship: 'Self',
        dob: c.dob,
        mobile: c.mobile,
        is_today: daysUntil === 0,
        days_until: daysUntil,
        age
      });
    }
  });

  // 2. Scan Protection Vault Policies for Primary and Dependents
  policies.forEach(p => {
    // Primary Member
    if (p.primary_member_dob) {
      const parsed = parseDateOfBirth(p.primary_member_dob);
      if (parsed) {
        const daysUntil = getDaysUntil(parsed.day, parsed.month);
        if (daysUntil <= 30) {
          const age = parsed.year ? baseDate.getFullYear() - parsed.year : undefined;
          alerts.push({
            id: `pol-${p.id}-primary`,
            client_name: p.client_name,
            celebrant_name: p.primary_member_name || p.client_name,
            relationship: 'Self',
            dob: p.primary_member_dob,
            mobile: '',
            is_today: daysUntil === 0,
            days_until: daysUntil,
            age
          });
        }
      }
    }

    // Dependent 1
    if (p.dep1_name && p.dep1_dob) {
      const parsed = parseDateOfBirth(p.dep1_dob);
      if (parsed) {
        const daysUntil = getDaysUntil(parsed.day, parsed.month);
        if (daysUntil <= 30) {
          const age = parsed.year ? baseDate.getFullYear() - parsed.year : undefined;
          alerts.push({
            id: `pol-${p.id}-dep1`,
            client_name: p.client_name,
            celebrant_name: p.dep1_name,
            relationship: (p.dep1_relation as any) || 'Spouse',
            dob: p.dep1_dob,
            mobile: '',
            is_today: daysUntil === 0,
            days_until: daysUntil,
            age
          });
        }
      }
    }

    // Dependent 2
    if (p.dep2_name && p.dep2_dob) {
      const parsed = parseDateOfBirth(p.dep2_dob);
      if (parsed) {
        const daysUntil = getDaysUntil(parsed.day, parsed.month);
        if (daysUntil <= 30) {
          const age = parsed.year ? baseDate.getFullYear() - parsed.year : undefined;
          alerts.push({
            id: `pol-${p.id}-dep2`,
            client_name: p.client_name,
            celebrant_name: p.dep2_name,
            relationship: (p.dep2_relation as any) || 'Child',
            dob: p.dep2_dob,
            mobile: '',
            is_today: daysUntil === 0,
            days_until: daysUntil,
            age
          });
        }
      }
    }
  });

  // Deduplicate and prioritize Self over Dependent, and Today over Upcoming
  const uniqueMap = new Map<string, CelebrationAlert>();
  alerts.forEach(a => {
    const key = `${a.celebrant_name.trim().toUpperCase()}-${a.dob}`;
    if (!uniqueMap.has(key) || (!uniqueMap.get(key)!.is_today && a.is_today)) {
      uniqueMap.set(key, a);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => a.days_until - b.days_until);
}

export function formatCelebrationWhatsAppMessage(alert: CelebrationAlert): string {
  if (alert.relationship === 'Self') {
    return `Dear *${alert.celebrant_name}*,

Wishing you a very *Happy Birthday!* 🎂✨

May this year be filled with radiant health, abundant prosperity, and fulfilled life goals. We are deeply privileged to partner with you in your family's wealth and financial security journey.

Have a wonderful celebration today! 🙏

Warmest Wishes,
*Team AntFinserv.com*
AMFI Regd. Mutual Fund Distributor | ARN-94204`;
  }

  // Dependent Greeting
  return `Dear *${alert.client_name}*,

Heartiest Birthday Greetings to your ${alert.relationship.toLowerCase()}, *${alert.celebrant_name}*! 🎂✨

Wishing them abundant happiness, vibrant health, and joyous moments on this special day. May your entire family always be blessed with prosperity and peace. 🙏

Warmest Regards,
*Team AntFinserv.com*
AMFI Regd. Mutual Fund Distributor | ARN-94204`;
}
