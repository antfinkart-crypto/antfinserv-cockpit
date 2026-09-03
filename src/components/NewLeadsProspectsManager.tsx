import React, { useState } from 'react';
import { Lead, ClientMasterRecord } from '../types';
import { INDUSTRY_SECTORS } from '../data/industries';
import { Users, Plus, Search, Tag, MessageSquare, Building2, MapPin, Briefcase, Trash2 } from 'lucide-react';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface NewLeadsProspectsManagerProps {
  leads: Lead[];
  clients?: ClientMasterRecord[];
  onAddLead: (lead: Lead) => Promise<void>;
  onDeleteLead?: (leadId: string) => Promise<void>;
}

export const NewLeadsProspectsManager: React.FC<NewLeadsProspectsManagerProps> = ({
  leads,
  clients = [],
  onAddLead,
  onDeleteLead
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    firm_name: '',
    owner_name: '',
    designation: '',
    mobile: '',
    email: '',
    location: '',
    industry_sector: INDUSTRY_SECTORS[0],
    industry_remarks: '',
    status: 'Warm Lead',
    priority: 'Medium',
    notes: ''
  });

  const columns: { status: Lead['status']; title: string; color: string }[] = [
    { status: 'Cold Contact', title: 'Cold Outreach', color: 'text-slate-600 bg-slate-100' },
    { status: 'Warm Lead', title: 'Warm Discussions', color: 'text-amber-700 bg-amber-50' },
    { status: 'Negotiation Phase', title: 'Proposal & Structuring', color: 'text-blue-700 bg-blue-50' },
    { status: 'Converted', title: 'Converted Clients', color: 'text-emerald-700 bg-emerald-50' },
    { status: 'Dropped', title: 'Dropped / Inactive', color: 'text-rose-700 bg-rose-50' }
  ];

  const filteredLeads = leads.filter(lead => {
    const matchSearch =
      (lead.firm_name && lead.firm_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.owner_name && lead.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.mobile && lead.mobile.includes(searchTerm));

    const matchIndustry =
      selectedIndustry === 'all' || lead.industry_sector === selectedIndustry;

    return matchSearch && matchIndustry;
  });

  const handleSubmitNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerName = newLead.owner_name?.trim() || '';
    const mobile = newLead.mobile?.trim() || '';
    const firmName = newLead.firm_name?.trim() || '';

    if (!ownerName && !mobile && !firmName) {
      alert('Please enter at least a Contact Name or Mobile Number to add this prospect.');
      return;
    }

    // Check duplicate mobile in client master
    if (mobile && clients && clients.length > 0) {
      const cleanDigits = mobile.replace(/\D/g, '');
      if (cleanDigits.length >= 10) {
        const existingClient = clients.find(c => c.mobile && c.mobile.replace(/\D/g, '').endsWith(cleanDigits.slice(-10)));
        if (existingClient) {
          const confirmAdd = window.confirm(
            `Notice: A client with mobile ${mobile} is already registered in your Mutual Fund Client Master (${existingClient.investor_name})!\n\nDo you still want to create this as a separate pipeline lead?`
          );
          if (!confirmAdd) return;
        }
      }
    }

    const lead: Lead = {
      id: `lead_${Date.now()}`,
      firm_name: firmName || (ownerName ? `${ownerName} (Individual)` : 'Prospect Lead'),
      owner_name: ownerName || 'Prospect Contact',
      designation: newLead.designation?.trim() || 'Owner / Partner',
      mobile: mobile || '',
      email: newLead.email?.trim() || '',
      location: newLead.location?.trim() || '',
      industry_sector: newLead.industry_sector || 'Other',
      industry_remarks: newLead.industry_remarks?.trim() || '',
      status: newLead.status || 'Warm Lead',
      priority: newLead.priority || 'Medium',
      notes: newLead.notes?.trim() || '',
      created_at: new Date().toISOString()
    };

    await onAddLead(lead);
    setIsAddModalOpen(false);
    setNewLead({
      firm_name: '',
      owner_name: '',
      designation: '',
      mobile: '',
      email: '',
      location: '',
      industry_sector: INDUSTRY_SECTORS[0],
      industry_remarks: '',
      status: 'Warm Lead',
      priority: 'Medium',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs bg-white">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              New Leads & Prospects Pipeline
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
              {leads.length} Total Prospects
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            B2B Commercial & Retail Lead Management. Quick outreach via WhatsApp Business.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Lead / Prospect</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by firm, owner, or mobile..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Industry:</label>
          <select
            value={selectedIndustry}
            onChange={e => setSelectedIndustry(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Industries ({leads.length})</option>
            {INDUSTRY_SECTORS.map(sec => {
              const count = leads.filter(l => l.industry_sector === sec).length;
              return (
                <option key={sec} value={sec}>
                  {sec} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Kanban Board Layout */}
      {leads.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Prospects in Pipeline</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "+ Add New Lead / Prospect" above to add contacts with name and mobile number.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map(col => {
            const colLeads = filteredLeads.filter(l => l.status === col.status);
            return (
              <div key={col.status} className="glass-panel p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                  {colLeads.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    colLeads.map(lead => {
                      const waText = `Dear ${lead.owner_name},\n\nGreetings from Rana Sahib | AntFinServ.com.\n\nWarm Regards,\n+91 98727 00392`;
                      const waUrl = generateWhatsAppUrl(lead.mobile, waText);

                      return (
                        <div
                          key={lead.id}
                          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{lead.firm_name}</h4>
                              <p className="text-xs text-slate-600 font-medium">
                                {lead.owner_name} {lead.designation && `• ${lead.designation}`}
                              </p>
                            </div>
                            {lead.priority && (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${lead.priority === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                {lead.priority}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 space-y-1">
                            {lead.industry_sector && (
                              <div className="flex items-center gap-1 font-semibold text-slate-700">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                <span>{lead.industry_sector === 'Other' && lead.industry_remarks ? `Other: ${lead.industry_remarks}` : lead.industry_sector}</span>
                              </div>
                            )}
                            {lead.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{lead.location}</span>
                              </div>
                            )}
                          </div>

                          {lead.notes && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              "{lead.notes}"
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline">
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">{lead.mobile}</span>
                              {onDeleteLead && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteLead(lead.id)}
                                  className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Add New Lead / Prospect</span>
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Non-Mandatory Fields
              </span>
            </div>

            <form onSubmit={handleSubmitNewLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Goyal Sanitary Store"
                    value={newLead.firm_name}
                    onChange={e => setNewLead(prev => ({ ...prev, firm_name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Goyal"
                    value={newLead.owner_name}
                    onChange={e => setNewLead(prev => ({ ...prev, owner_name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={newLead.mobile}
                    onChange={e => setNewLead(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Ludhiana, Gill Road"
                    value={newLead.location}
                    onChange={e => setNewLead(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector</label>
                  <select
                    value={newLead.industry_sector}
                    onChange={e => setNewLead(prev => ({ ...prev, industry_sector: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium bg-white"
                  >
                    {INDUSTRY_SECTORS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    value={newLead.status}
                    onChange={e => setNewLead(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium bg-white"
                  >
                    {columns.map(c => (
                      <option key={c.status} value={c.status}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Advisor Notes & Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Notes, discussion highlights, financial needs..."
                  value={newLead.notes}
                  onChange={e => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Lead to Pipeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
