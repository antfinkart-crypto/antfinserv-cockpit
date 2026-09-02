import React, { useState } from 'react';
import { Lead, Client } from '../types';
import { Users, Phone, MessageSquare, Plus, CheckCircle, Calendar, ArrowRight, Building2, Tag } from 'lucide-react';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface LeadPipelineManagerProps {
  leads: Lead[];
  onAddLead: () => void;
  onUpdateStatus: (leadId: string, status: Lead['status']) => void;
  onConvertLead: (lead: Lead) => void;
}

export const LeadPipelineManager: React.FC<LeadPipelineManagerProps> = ({
  leads,
  onAddLead,
  onUpdateStatus,
  onConvertLead
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const industries = Array.from(new Set(leads.map(l => l.industry_sector).filter(Boolean)));

  const filteredLeads = leads.filter(l => {
    if (selectedIndustry !== 'all' && l.industry_sector !== selectedIndustry) return false;
    return true;
  });

  const columns: { title: string; status: Lead['status']; color: string }[] = [
    { title: 'Warm Lead', status: 'Warm Lead', color: 'border-amber-500/40 text-amber-300' },
    { title: 'Cold Contact', status: 'Cold Contact', color: 'border-blue-500/40 text-blue-300' },
    { title: 'Negotiation Phase', status: 'Negotiation Phase', color: 'border-purple-500/40 text-purple-300' },
    { title: 'Converted', status: 'Converted', color: 'border-emerald-500/40 text-emerald-300' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              B2B MSME Acquisition Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Targeted merchant acquisition: Plywood, Hardware, Cement, Sanitary & Iron/Steel trade partners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold"
          >
            {viewMode === 'kanban' ? 'Switch to Table' : 'Switch to Kanban'}
          </button>

          <button
            onClick={onAddLead}
            className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add MSME Lead</span>
          </button>
        </div>
      </div>

      {/* Industry Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs md:text-sm">
        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
          <Tag className="w-4 h-4" />
          Industry:
        </span>
        <button
          onClick={() => setSelectedIndustry('all')}
          className={`px-3.5 md:px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
            selectedIndustry === 'all'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Sectors ({leads.length})
        </button>
        {industries.map(ind => (
          <button
            key={ind}
            onClick={() => setSelectedIndustry(ind!)}
            className={`px-3.5 md:px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedIndustry === ind
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {columns.map(col => {
            const colLeads = filteredLeads.filter(l => l.status === col.status);

            return (
              <div key={col.status} className="glass-panel p-4 md:p-5 rounded-2xl border border-slate-800 flex flex-col space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <span className={`text-xs md:text-sm font-bold uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs md:text-sm px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {colLeads.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-xs italic">
                      No leads in this stage
                    </div>
                  ) : (
                    colLeads.map(lead => {
                      const waText = `Dear ${lead.owner_name} Ji (${lead.firm_name}), following up from AntFinserv regarding our discussion on wealth treasury and business financial solutions. Warm Regards, AntFinserv.com (ARN-94204)`;
                      const waUrl = generateWhatsAppUrl(lead.mobile, waText);

                      return (
                        <div
                          key={lead.id}
                          className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5 text-xs md:text-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-white text-xs md:text-sm">{lead.firm_name}</h4>
                              <p className="text-xs text-slate-400">{lead.owner_name}</p>
                            </div>
                            {lead.industry_sector && (
                              <span className="text-[10px] md:text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 font-semibold">
                                {lead.industry_sector}
                              </span>
                            )}
                          </div>

                          {lead.notes && (
                            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                              {lead.notes}
                            </p>
                          )}

                          {lead.next_followup_date && (
                            <div className="text-[10px] text-amber-400/90 flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3" />
                              <span>Follow-up: {lead.next_followup_date}</span>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <select
                              value={lead.status}
                              onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
                              className="bg-slate-950 text-[10px] text-slate-300 rounded px-1.5 py-1 border border-slate-800 focus:outline-none"
                            >
                              <option value="Warm Lead">Warm Lead</option>
                              <option value="Cold Contact">Cold Contact</option>
                              <option value="Negotiation Phase">Negotiation</option>
                              <option value="Converted">Converted</option>
                            </select>

                            <div className="flex items-center gap-1">
                              {lead.status !== 'Converted' && (
                                <button
                                  onClick={() => onConvertLead(lead)}
                                  className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                  title="Convert to Client Master"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                                title="WhatsApp Follow-up"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Firm / Company</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Mobile & PAN</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-bold text-white">{lead.firm_name}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.owner_name}</td>
                  <td className="px-4 py-3 text-blue-300 font-medium">{lead.industry_sector || '-'}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{lead.mobile} • {lead.pan_number || 'NO PAN'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onConvertLead(lead)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                    >
                      Convert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
