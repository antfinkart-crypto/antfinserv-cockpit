import React from 'react';
import { TrendingUp, Sparkles, Building2, ArrowUpRight, ShieldCheck, Heart, Home, Newspaper, Users, AlertTriangle } from 'lucide-react';
import { Lead, ProtectionAsset, GroupedSipAlert, CelebrationAlert } from '../types';
import { WiseAntCard } from './WiseAntCard';

interface DashboardCockpitProps {
  totalAum: number;
  monthlySipCommitment: number;
  holdingsCount: number;
  sipsCount: number;
  leads: Lead[];
  policies: ProtectionAsset[];
  shieldAlerts: GroupedSipAlert[];
  todayCelebrations: CelebrationAlert[];
  onNavigate: (tab: string) => void;
  onOpenAddLead: () => void;
}

export const DashboardCockpit: React.FC<DashboardCockpitProps> = ({
  totalAum,
  monthlySipCommitment,
  holdingsCount,
  sipsCount,
  leads,
  policies,
  shieldAlerts,
  todayCelebrations,
  onNavigate,
  onOpenAddLead
}) => {
  const activeLeads = leads.filter(l => l.status !== 'Converted' && l.status !== 'Dropped').length;

  const now = new Date();
  const expiringSoonPolicies = policies.filter(p => {
    const exp = new Date(p.expiry_date);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  const pendingShieldAlerts = shieldAlerts.filter(a => !a.dispatched);

  return (
    <div className="space-y-6">
      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {/* KPI 1: Mutual Fund AUM */}
        <div
          onClick={() => onNavigate('sips')}
          className="glass-panel p-5 md:p-6 lg:p-7 rounded-2xl border border-slate-200 glass-panel-hover group relative overflow-hidden cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm uppercase font-bold text-slate-500 tracking-wider">Portfolio AUM</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mt-2 font-sans tracking-tight">
            ₹{(totalAum / 10000000).toFixed(2)} <span className="text-sm font-semibold text-amber-600">Cr</span>
          </p>
          <div className="text-xs md:text-sm text-slate-500 mt-2 flex items-center justify-between">
            <span>₹{totalAum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-emerald-700 font-bold">{holdingsCount} Holdings</span>
          </div>
        </div>

        {/* KPI 2: Monthly SIP Commitment */}
        <div
          onClick={() => onNavigate('sips')}
          className="glass-panel p-5 md:p-6 lg:p-7 rounded-2xl border border-slate-200 glass-panel-hover group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm uppercase font-bold text-slate-500 tracking-wider">Monthly SIP Commitment</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            ₹{(monthlySipCommitment / 100000).toFixed(2)} <span className="text-sm font-semibold text-emerald-700">Lakh</span>
          </p>
          <div className="text-xs md:text-sm text-slate-500 mt-2 flex items-center justify-between">
            <span>₹{monthlySipCommitment.toLocaleString('en-IN')}/mo</span>
            <span className="text-slate-600 font-semibold">{sipsCount} Mandates</span>
          </div>
        </div>

        {/* KPI 3: New Leads / Prospects */}
        <div
          onClick={() => onNavigate('pipeline')}
          className="glass-panel p-5 md:p-6 lg:p-7 rounded-2xl border border-slate-200 glass-panel-hover group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm uppercase font-bold text-slate-500 tracking-wider">New Leads / Prospects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            {activeLeads} <span className="text-sm font-semibold text-blue-600">Active</span>
          </p>
          <div className="text-xs md:text-sm text-slate-500 mt-2 flex items-center justify-between">
            <span>Total Pipeline: {leads.length}</span>
            <span className="text-blue-700 font-semibold">All Sectors</span>
          </div>
        </div>

        {/* KPI 4: Expiring Policies */}
        <div
          onClick={() => onNavigate('protection')}
          className="glass-panel p-5 md:p-6 lg:p-7 rounded-2xl border border-slate-200 glass-panel-hover group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm uppercase font-bold text-slate-500 tracking-wider">Expiring Policies</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            {expiringSoonPolicies.length} <span className="text-sm font-semibold text-purple-600">Next 30d</span>
          </p>
          <div className="text-xs md:text-sm text-slate-500 mt-2 flex items-center justify-between">
            <span>Total Tracked: {policies.length}</span>
            <span className="text-emerald-700 font-semibold">Vault Protected</span>
          </div>
        </div>
      </div>

      {/* The Wise Ant AI Card */}
      <WiseAntCard
        sipsCount={sipsCount}
        leadsCount={leads.length}
        expiringPoliciesCount={expiringSoonPolicies.length}
        pendingShieldCount={pendingShieldAlerts.length}
      />

      {/* Today's Action Command Centre */}
      <div className="glass-panel p-5 md:p-7 rounded-2xl border border-amber-200/80 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base md:text-xl lg:text-2xl text-slate-900 tracking-tight flex items-center gap-2">
              <span>Advisor Command Centre</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                DAILY 4-POINT DISCIPLINE
              </span>
            </h3>
            <p className="text-xs md:text-sm text-slate-500">Answering your four critical business questions for today</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Question 1: Who needs attention? */}
          <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <span>1. Who Needs Attention Today?</span>
              </h4>
              <span className="text-xs font-bold text-amber-700">{pendingShieldAlerts.length} Mandates</span>
            </div>
            <ul className="text-xs md:text-sm text-slate-700 space-y-2">
              {pendingShieldAlerts.length > 0 ? (
                pendingShieldAlerts.slice(0, 3).map((a, i) => (
                  <li key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-900">{a.investor_name}</span>
                    <span className="font-bold text-emerald-700 font-mono">₹{a.total_debit.toLocaleString('en-IN')} (Due: {a.due_date_str})</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic">All SIP debits for the next 4 days are intimated & clear.</li>
              )}
            </ul>
            <button
              onClick={() => onNavigate('shield')}
              className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 pt-1"
            >
              Open 4-Day SIP Shield <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Question 2: What should I discuss? */}
          <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span>2. What Should I Discuss Today?</span>
              </h4>
              <span className="text-xs font-bold text-emerald-700">Home Loan BT</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
              High-interest borrower audit: Review mortgage statements for rate spreads ≥ 0.75%. Pitch disciplined EMI reduction and route net savings into Equity SIPs.
            </p>
            <button
              onClick={() => onNavigate('homeloan')}
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 pt-1"
            >
              Open Home Loan Balance Transfer Engine <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Question 3: Where will the next AUM come from? */}
          <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <span>3. Where Will the Next AUM Come From?</span>
              </h4>
              <span className="text-xs font-bold text-blue-700">{activeLeads} Prospects</span>
            </div>
            <div className="space-y-1.5">
              {leads.length > 0 ? (
                leads.slice(0, 2).map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-xs md:text-sm text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">{l.firm_name}</span>
                    <span className="text-xs text-blue-700 font-semibold">{l.status}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No prospects yet. Add your first prospect to build the pipeline.</p>
              )}
            </div>
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-xs font-bold text-blue-800 hover:underline flex items-center gap-1 pt-1"
            >
              Open New Leads & Prospects Pipeline <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Question 4: What content should I publish? */}
          <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <span>4. What Should I Publish Today?</span>
              </h4>
              <span className="text-xs font-bold text-purple-700">Daily Insight</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
              Topic: <em>'Why pausing your SIP during market volatility costs 3x more in compound returns.'</em> Formatted for 1-click WhatsApp Broadcast & LinkedIn.
            </p>
            <button
              onClick={() => onNavigate('content')}
              className="text-xs font-bold text-purple-800 hover:underline flex items-center gap-1 pt-1"
            >
              Open Content Studio & Topic Bank <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};