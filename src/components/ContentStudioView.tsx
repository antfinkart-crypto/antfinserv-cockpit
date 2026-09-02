import React, { useState } from 'react';
import { Newspaper, Copy, Check, Share2, Sparkles, Filter } from 'lucide-react';
import { WiseAntCard } from './WiseAntCard';

interface ContentTopic {
  id: string;
  topic: string;
  product: 'Home Loans' | 'Mutual Funds' | 'Health Insurance' | 'Daily Market Wrap';
  audience: string;
  objective: string;
  formats: {
    format: string;
    hook: string;
    body: string;
  }[];
}

const SAMPLE_TOPICS: ContentTopic[] = [
  {
    id: 'HL001',
    topic: 'Will moving your home loan to a lower ROI actually save you money?',
    product: 'Home Loans',
    audience: 'Existing home-loan borrowers',
    objective: 'Education + Lead Generation',
    formats: [
      {
        format: 'WhatsApp Broadcast',
        hook: 'Lower ROI? Don\'t assume you are automatically saving money.',
        body: `A 0.50% lower rate sounds tempting, but here is what most borrowers forget to calculate:

1. Processing fees & legal charges (₹15,000–₹35,000)
2. MODT & franking charges
3. The remaining tenure of your loan

If your break-even period is more than 36 months, moving the loan may actually cost you more.

Planning your Finances, like the Wise Ant: Calculate before you sign.
Connect with AntFinserv.com for a transparent break-even check.`
      },
      {
        format: 'LinkedIn / Social Post',
        hook: 'Lower ROI ≠ automatically lower mortgage cost.',
        body: `Before switching home loans for an advertised rate cut, always calculate:
• Upfront transfer costs (legal, valuation, stamp duty)
• Break-even months (costs divided by monthly EMI savings)

If you plan to prepay within 2-3 years, a transfer rarely makes economic sense. A fiduciary advisor calculates the break-even before asking for your KYC.

AntFinserv Wealth OS • ARN-94204`
      }
    ]
  },
  {
    id: 'MF001',
    topic: 'The 4-Day SIP Rule: Why debits bounce right before month-end',
    product: 'Mutual Funds',
    audience: 'SIP Investors',
    objective: 'Investor Protection & Account Funding',
    formats: [
      {
        format: 'WhatsApp Broadcast',
        hook: 'Ensure your SIPs debit smoothly without bank NACH return penalties!',
        body: `A quick financial hygiene reminder from AntFinserv:

When your SIP debit falls around the 5th or 10th of the month, banking cut-offs on weekends can cause mandate failures if funds aren't settled 4 days in advance.

Banks charge up to ₹500 for NACH mandate returns. Keep your designated account funded in advance.

Warm Regards,
AntFinserv.com | AMFI Regd. Mutual Fund Distributor ARN-94204`
      }
    ]
  }
];

export const ContentStudioView: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<ContentTopic>(SAMPLE_TOPICS[0]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const handleCopy = (formatName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Newspaper className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Content Studio & Advisor Thought Leadership
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Pre-engineered topic bank, multi-format WhatsApp broadcast drafts, and fiduciary client education.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topic Bank */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Topic Bank</h3>
          {SAMPLE_TOPICS.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTopic(t)}
              className={`p-4 md:p-5 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                selectedTopic.id === t.id
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{t.product}</span>
              <h4 className="font-bold text-sm md:text-base text-slate-900 mt-1.5">{t.topic}</h4>
              <p className="text-xs text-slate-500 mt-1">{t.objective}</p>
            </div>
          ))}
        </div>

        {/* Formats Output */}
        <div className="lg:col-span-8 space-y-5">
          {selectedTopic.formats.map((f, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs md:text-sm px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                  {f.format}
                </span>
                <button
                  onClick={() => handleCopy(f.format, f.body)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  {copiedFormat === f.format ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Draft</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs md:text-sm font-semibold text-slate-600 italic">
                Hook: "{f.hook}"
              </p>

              <pre className="text-xs md:text-sm text-slate-800 whitespace-pre-wrap font-sans bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {f.body}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
