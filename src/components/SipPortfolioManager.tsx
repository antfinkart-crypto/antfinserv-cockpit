import React, { useState } from 'react';
import { SipPortfolio } from '../types';
import { Search, Filter, ArrowUpDown, TrendingUp, Shield, MessageSquare, Download } from 'lucide-react';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface SipPortfolioManagerProps {
  sips: SipPortfolio[];
}

export const SipPortfolioManager: React.FC<SipPortfolioManagerProps> = ({ sips }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState<'all' | '1-5' | '6-10' | '11-15' | '16-20' | '21-25' | '26-31'>('all');
  const [sortBy, setSortBy] = useState<'aum' | 'amount' | 'due_day' | 'name'>('due_day');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter logic
  const filtered = sips.filter(s => {
    // Search query
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (s.investor_name && s.investor_name.toLowerCase().includes(q)) ||
      (s.scheme_name && s.scheme_name.toLowerCase().includes(q)) ||
      (s.pan_number && s.pan_number.toLowerCase().includes(q)) ||
      (s.client_pan && s.client_pan.toLowerCase().includes(q)) ||
      (s.folio_number && s.folio_number.toLowerCase().includes(q)) ||
      (s.mobile && s.mobile.includes(q));

    if (!matchSearch) return false;

    // Day filter
    if (dayFilter === '1-5') return s.sip_due_day >= 1 && s.sip_due_day <= 5;
    if (dayFilter === '6-10') return s.sip_due_day >= 6 && s.sip_due_day <= 10;
    if (dayFilter === '11-15') return s.sip_due_day >= 11 && s.sip_due_day <= 15;
    if (dayFilter === '16-20') return s.sip_due_day >= 16 && s.sip_due_day <= 20;
    if (dayFilter === '21-25') return s.sip_due_day >= 21 && s.sip_due_day <= 25;
    if (dayFilter === '26-31') return s.sip_due_day >= 26 && s.sip_due_day <= 31;

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'aum') diff = (a.current_aum || 0) - (b.current_aum || 0);
    else if (sortBy === 'amount') diff = (a.monthly_amt || 0) - (b.monthly_amt || 0);
    else if (sortBy === 'due_day') diff = (a.sip_due_day || 0) - (b.sip_due_day || 0);
    else if (sortBy === 'name') diff = (a.investor_name || '').localeCompare(b.investor_name || '');

    return sortOrder === 'asc' ? diff : -diff;
  });

  const totalFilteredAum = sorted.reduce((acc, s) => acc + (s.current_aum || 0), 0);
  const totalFilteredAmt = sorted.reduce((acc, s) => acc + (s.monthly_amt || 0), 0);

  const exportCsv = () => {
    const headers = ['Investor Name,PAN,Mobile,Folio,Scheme Name,Due Day,Monthly Amount,Current AUM,XIRR,Status\n'];
    const rows = sorted.map(s =>
      `"${s.investor_name || ''}","${s.pan_number || s.client_pan || ''}","${s.mobile || ''}","${s.folio_number || ''}","${s.scheme_name}","${s.sip_due_day}","${s.monthly_amt}","${s.current_aum}","${s.xirr || ''}","${s.status}"`
    );
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'antfinserv_sip_portfolio.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-white tracking-tight">
            Mutual Fund Active SIP Portfolios (RTA Engine)
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Live absorption feed from AdvisorKhoj / TheMFBox with multi-folio consolidation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search Investor, Scheme, PAN, Folio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Due Day Buckets */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar md:col-span-2 text-xs">
          {(['all', '1-5', '6-10', '11-15', '16-20', '21-25', '26-31'] as const).map(b => (
            <button
              key={b}
              onClick={() => setDayFilter(b)}
              className={`px-3 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                dayFilter === b
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {b === 'all' ? 'All Days' : `Day ${b}`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-400">
        <span>Showing <strong className="text-white">{sorted.length}</strong> of {sips.length} SIPs</span>
        <div className="flex items-center gap-3">
          <span>Total AUM: <strong className="text-emerald-400">₹{totalFilteredAum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
          <span>Monthly Book: <strong className="text-amber-400">₹{totalFilteredAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
        </div>
      </div>

      {/* Table View */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-xs md:text-sm tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 md:px-5 py-3 md:py-4 cursor-pointer" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Investor / Client
                </th>
                <th className="px-4 md:px-5 py-3 md:py-4">Scheme & Folio</th>
                <th className="px-3 md:px-4 py-3 md:py-4 text-center cursor-pointer" onClick={() => { setSortBy('due_day'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Debit Day
                </th>
                <th className="px-4 md:px-5 py-3 md:py-4 text-right cursor-pointer" onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  SIP Amount
                </th>
                <th className="px-4 md:px-5 py-3 md:py-4 text-right cursor-pointer" onClick={() => { setSortBy('aum'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Current AUM
                </th>
                <th className="px-3 md:px-4 py-3 md:py-4 text-center">XIRR</th>
                <th className="px-3 md:px-4 py-3 md:py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.slice(0, 100).map((sip, idx) => {
                const waText = `Dear ${sip.investor_name || 'Investor'}, regarding your SIP in ${sip.scheme_name} (Due Day: ${sip.sip_due_day}th, Amount: ₹${sip.monthly_amt.toLocaleString('en-IN')}) - AntFinserv Wealth Management (ARN-94204).`;
                const waUrl = generateWhatsAppUrl(sip.mobile || '', waText);

                return (
                  <tr key={sip.id || idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 md:px-5 py-3.5 md:py-4">
                      <div className="font-bold text-white text-xs md:text-sm">{sip.investor_name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {sip.pan_number || sip.client_pan || 'NO PAN'} • {sip.mobile || 'No Mobile'}
                      </div>
                    </td>

                    <td className="px-4 md:px-5 py-3.5 md:py-4 max-w-sm">
                      <div className="font-medium text-slate-200 text-xs md:text-sm truncate" title={sip.scheme_name}>
                        {sip.scheme_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        {sip.folio_number ? `Folio: ${sip.folio_number}` : 'Direct Folio'}
                        {sip.scheme_code && ` • Code: ${sip.scheme_code}`}
                      </div>
                    </td>

                    <td className="px-3 md:px-4 py-3.5 md:py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs border border-slate-700">
                        {sip.sip_due_day}th
                      </span>
                    </td>

                    <td className="px-4 md:px-5 py-3.5 md:py-4 text-right font-bold text-xs md:text-sm text-amber-300">
                      ₹{sip.monthly_amt.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 md:px-5 py-3.5 md:py-4 text-right font-bold text-xs md:text-sm text-slate-200">
                      ₹{sip.current_aum.toLocaleString('en-IN')}
                    </td>

                    <td className="px-3 md:px-4 py-3.5 md:py-4 text-center font-mono">
                      {sip.xirr ? (
                        <span className={`text-xs font-bold ${sip.xirr >= 15 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {sip.xirr.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="px-3 md:px-4 py-3.5 md:py-4 text-right">
                      {sip.mobile && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 inline-block"
                          title="Message via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
