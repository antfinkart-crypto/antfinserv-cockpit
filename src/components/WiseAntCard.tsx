import React from 'react';
import { Sparkles } from 'lucide-react';

interface WiseAntCardProps {
  mood?: 'Analytical' | 'Disciplined' | 'Trust' | 'Opportunity' | 'Cautious';
  title?: string;
  message?: string;
  subtext?: string;
  sipsCount?: number;
  leadsCount?: number;
  expiringPoliciesCount?: number;
  pendingShieldCount?: number;
}

export const WiseAntCard: React.FC<WiseAntCardProps> = ({
  mood = 'Disciplined',
  title = 'The Wise Ant Says',
  message,
  subtext,
  sipsCount = 0,
  leadsCount = 0,
  expiringPoliciesCount = 0,
  pendingShieldCount = 0
}) => {
  let displayMessage = message;
  let displaySubtext = subtext;

  if (!displayMessage) {
    if (pendingShieldCount > 0) {
      displayMessage = `You have ${pendingShieldCount} pre-debit intimation(s) due in the next 4 days. Send advance WhatsApp reminders to prevent mandate bounce charges and protect client credit scores.`;
      displaySubtext = '4-Day SIP Shield Protocol • Proactive Wealth Governance';
    } else if (expiringPoliciesCount > 0) {
      displayMessage = `${expiringPoliciesCount} insurance policies are due for renewal within 30 days. Initiating renewal audits before grace period expiry prevents loss of waiting period credits.`;
      displaySubtext = 'Protection Vault Protocol • Zero Gap Family Coverage';
    } else {
      displayMessage = 'A NO-TRANSFER recommendation is not a failed deal; it is a TRUST EVENT. Protect client capital first, and compounding wealth will follow relentlessly.';
      displaySubtext = 'AntFinserv Wealth Advisory Principle • ARN-94204';
    }
  }

  return (
    <div className="glass-panel p-5 md:p-6 lg:p-7 rounded-2xl border border-amber-200 bg-amber-50/40 relative overflow-hidden shadow-sm">
      <div className="flex items-start gap-4 relative z-10">
        {/* Official Mascot Avatar */}
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-md flex-shrink-0 bg-slate-950">
          <img
            src="/logo.png"
            alt="The Wise Ant"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{title}</span>
              </h4>
              <span className="text-[10px] md:text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                {mood} Check
              </span>
            </div>
          </div>

          <p className="text-sm md:text-base lg:text-lg font-medium text-slate-900 leading-relaxed">
            "{displayMessage}"
          </p>

          {displaySubtext && (
            <p className="text-xs md:text-sm text-slate-600 font-semibold pt-0.5">
              {displaySubtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};