/**
 * AntFinserv WhatsApp Messaging Router
 * Generates verified deep-link URLs and clipboard fallbacks
 */

export function cleanIndianMobile(raw: string | undefined | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return '91' + digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length > 10 && !digits.startsWith('91')) {
    return '91' + digits.slice(-10);
  }
  return digits;
}

export function generateWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = cleanIndianMobile(phone);
  const encodedText = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

import { GroupedSipAlert, CelebrationAlert } from '../types';

export function formatSipShieldWhatsAppMessage(alert: GroupedSipAlert): string {
  const schemeLines = alert.schemes.map(s => `• ${s.scheme_name}: ₹${s.amount.toLocaleString('en-IN')}`).join('\n');
  return `Dear *${alert.investor_name}*,

A quick advance intimation from AntFinserv regarding your upcoming Mutual Fund SIP debits scheduled for *${alert.due_date_str}*:

${schemeLines}

*Total Scheduled Debit: ₹${alert.total_debit.toLocaleString('en-IN')}*

Kindly ensure your bank account has sufficient balance prior to banking clearance cut-offs to avoid NACH return penalties.

Warm Regards,
*AntFinserv.com* | AMFI Regd. Mutual Fund Distributor (ARN-94204)`;
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

  return `Dear *${alert.client_name}*,

Heartiest Birthday Greetings to your ${alert.relationship.toLowerCase()}, *${alert.celebrant_name}*! 🎂✨

Wishing them abundant happiness, vibrant health, and joyous moments on this special day. May your entire family always be blessed with prosperity and peace. 🙏

Warmest Regards,
*Team AntFinserv.com*
AMFI Regd. Mutual Fund Distributor | ARN-94204`;
}
