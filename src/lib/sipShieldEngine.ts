import { GroupedSipAlert, ActiveSip, SipPortfolio } from '../types';
import { generateWhatsAppUrl } from './whatsAppRouter';

/**
 * The 4-Day SIP Shield Engine
 * - Pre-debit alert 4 days in advance (Date + 4)
 * - Calendar-safe month-end rollover (28-31)
 * - Friday Weekend Offset Guardrail: Friday scans Saturday (+1), Sunday (+2), Monday (+3), and Tuesday (+4)
 * - Multi-SIP Client Grouping: Same client, same debit date consolidated into ONE message
 */

export interface ShieldDateTarget {
  targetDate: Date;
  targetDay: number;
  dateStr: string;
  reason: string;
}

export function getShieldTargetDates(baseDate: Date = new Date()): ShieldDateTarget[] {
  const targets: ShieldDateTarget[] = [];
  const dayOfWeek = baseDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat

  const formatDateStr = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
  };

  if (dayOfWeek === 5) {
    // Friday Weekend Offset Guardrail:
    const offsets = [
      { offset: 1, label: 'Saturday Weekend Cut-off (+1)' },
      { offset: 2, label: 'Sunday Weekend Cut-off (+2)' },
      { offset: 3, label: 'Monday Banking Open (+3)' },
      { offset: 4, label: 'Tuesday Standard (+4)' }
    ];

    offsets.forEach(({ offset, label }) => {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offset);
      targets.push({
        targetDate: d,
        targetDay: d.getDate(),
        dateStr: formatDateStr(d),
        reason: `Friday Shield: ${label}`
      });
    });
  } else {
    // Standard Day: Target Date + 4
    const targetD = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 4);
    targets.push({
      targetDate: targetD,
      targetDay: targetD.getDate(),
      dateStr: formatDateStr(targetD),
      reason: 'Standard 4-Day Advance Shield'
    });
  }

  return targets;
}

/**
 * Groups active SIPs matching target shield dates by Investor PAN or Name
 */
export function calculateShieldAlerts(
  sips: (ActiveSip | SipPortfolio)[],
  baseDate: Date = new Date(),
  dispatchedIds: Set<string> = new Set()
): GroupedSipAlert[] {
  const targetDates = getShieldTargetDates(baseDate);
  const targetDaysSet = new Map<number, ShieldDateTarget>();
  targetDates.forEach(t => targetDaysSet.set(t.targetDay, t));

  // Filter active SIPs matching target days
  const matchingSips = sips.filter(s => {
    const dueDay = (s as any).sip_date ?? (s as any).sip_due_day ?? 0;
    return targetDaysSet.has(dueDay);
  });

  // Group by (Investor + Due Day)
  const groupedMap = new Map<string, GroupedSipAlert>();

  matchingSips.forEach(sip => {
    const dueDay = (sip as any).sip_date ?? (sip as any).sip_due_day ?? 10;
    const monthlyAmt = (sip as any).monthly_amount ?? (sip as any).monthly_amt ?? (sip as any).sip_amount ?? 0;
    const target = targetDaysSet.get(dueDay)!;
    const pan = (sip as any).pan_number || (sip as any).client_pan || 'UNKNOWN';
    const key = `${pan.trim().toUpperCase()}-${target.dateStr}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        investor_name: sip.investor_name || 'Valued Investor',
        client_pan: pan,
        mobile: sip.mobile || '',
        due_date_str: target.dateStr,
        total_debit: 0,
        schemes: [],
        dispatched: dispatchedIds.has(key),
        offset_reason: target.reason
      });
    }

    const group = groupedMap.get(key)!;
    group.total_debit += monthlyAmt;
    group.schemes.push({
      scheme_name: sip.scheme_name,
      folio_number: sip.folio_number,
      amount: monthlyAmt
    });
  });

  return Array.from(groupedMap.values());
}
