import React from 'react';
import { Heart, MessageSquare, Sparkles } from 'lucide-react';
import { CelebrationAlert } from '../types';
import { generateWhatsAppUrl, formatCelebrationWhatsAppMessage } from '../lib/whatsAppRouter';

interface CelebrationsTabProps {
  celebrations: CelebrationAlert[];
}

export const CelebrationsTab: React.FC<CelebrationsTabProps> = ({ celebrations }) => {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Celebration & Relationship Radar
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Automated birthday & milestone intelligence for Primary Investors and family dependents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {celebrations.length === 0 ? (
        <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">No Birthdays Today or Upcoming</h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Family member birthdays and client anniversaries will display here with 1-click WhatsApp greetings.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {celebrations.map(cel => {
            const waMsg = formatCelebrationWhatsAppMessage(cel);
            const waUrl = generateWhatsAppUrl(cel.mobile, waMsg);

            return (
              <div key={cel.id} className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base md:text-lg text-slate-900">{cel.celebrant_name}</h4>
                    <p className="text-xs text-slate-500">{cel.relationship} of {cel.client_name}</p>
                  </div>
                  {cel.is_today && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold uppercase">
                      Today!
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 font-mono">DOB: {cel.dob}</div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Birthday Wish</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
