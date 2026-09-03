import React, { useState } from 'react';
import { Lead } from '../types';
import { INDUSTRY_SECTORS } from '../data/industries';
import { Users, Plus, Search, Tag, MessageSquare, Building2, MapPin, Briefcase } from 'lucide-react';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';

interface NewLeadsProspectsManagerProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => Promise<void>;
}

export const NewLeadsProspectsManager: React.FC<NewLeadsProspectsManagerProps> = ({
  leads,
  onAddLead
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
      alert('Please provide at least a Contact Person Name or Mobile number to save this prospect.');
      return;
    }

    const lead: Lead = {
      id: 'lead-' + Date.now(),
      entry_date: new Date().toISOString().split('T')[0],
      firm_name: firmName || (ownerName ? `${ownerName} (Individual)` : 'Individual Prospect'),
      owner_name: ownerName || firmName || 'Prospect',
      designation: newLead.designation?.trim(),
      mobile: mobile,
      email: newLead.email?.trim(),
      location: newLead.location?.trim(),
      industry_sector: newLead.industry_sector || 'Banking & Financial Services',
      industry_remarks: newLead.industry_sector === 'Other' ? newLead.industry_remarks : undefined,
      status: (newLead.status as Lead['status']) || 'Warm Lead',
      priority: (newLead.priority as Lead['priority']) || 'Medium',
      notes: newLead.notes?.trim(),
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
      {/* Top Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                New Leads & Prospects Pipeline
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Corporate, MSME, and retail investor acquisition repository across all trade & business sectors.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Prospect</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Industry:</span>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="p-2 text-xs md:text-sm rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-blue-500 max-w-xs"
          >
            <option value="all">All Industries ({leads.length})</option>
            {INDUSTRY_SECTORS.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Company, Contact, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Empty State */}
      {leads.length === 0 ? (
        <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">No prospects added yet.</h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Begin by registering your first business, MSME, or retail prospect to manage consultations, treasury pitches, and wealth conversions.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm inline-flex items-center gap-2 shadow-sm transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Prospect</span>
          </button>
        </div>
      ) : (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {columns.map(col => {
            const colLeads = filteredLeads.filter(l => l.status === col.status);
            return (
              <div key={col.status} className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${col.color}`}>{col.title}</span>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{colLeads.length}</span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {colLeads.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">No leads in this stage</div>
                  ) : (
                    colLeads.map(lead => {
                      const waText = `Dear ${lead.owner_name} Ji (${lead.firm_name}), following up from AntFinserv regarding our discussion on corporate treasury and wealth solutions. Warm Regards, AntFinserv.com (ARN-94204)`;
                      const waUrl = generateWhatsAppUrl(lead.mobile, waText);

                      return (
                        <div key={lead.id} className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all space-y-2.5 shadow-sm">
                          <div className="flex items-start justify-between">
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
                            <span className="text-xs text-slate-400 font-mono">{lead.mobile}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Add New Lead / Prospect</span>
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Quick Add: Name or Mobile is enough
              </span>
            </div>

            <form onSubmit={handleSubmitNewLead} className="space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Company / Business Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Health Logistics or leave empty"
                    value={newLead.firm_name}
                    onChange={(e) => setNewLead({ ...newLead, firm_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Arpit Arora / Rajesh Khurana"
                    value={newLead.owner_name}
                    onChange={(e) => setNewLead({ ...newLead, owner_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mobile Number (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={newLead.mobile}
                    onChange={(e) => setNewLead({ ...newLead, mobile: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Designation / Role (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Investor / Managing Director"
                    value={newLead.designation}
                    onChange={(e) => setNewLead({ ...newLead, designation: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Industry Sector</label>
                  <select
                    value={newLead.industry_sector}
                    onChange={(e) => setNewLead({ ...newLead, industry_sector: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  >
                    {INDUSTRY_SECTORS.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Pipeline Stage</label>
                  <select
                    value={newLead.status}
                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value as Lead['status'] })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cold Contact">Cold Outreach</option>
                    <option value="Warm Lead">Warm Discussions</option>
                    <option value="Negotiation Phase">Proposal & Structuring</option>
                    <option value="Converted">Converted Client</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
              </div>

              {newLead.industry_sector === 'Other' && (
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Industry Remarks (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Cold Chain Storage & Automation"
                    value={newLead.industry_remarks}
                    onChange={(e) => setNewLead({ ...newLead, industry_remarks: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Ludhiana / Chandigarh"
                    value={newLead.location}
                    onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Priority</label>
                  <select
                    value={newLead.priority}
                    onChange={(e) => setNewLead({ ...newLead, priority: e.target.value as Lead['priority'] })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes / Requirement Details</label>
                <textarea
                  rows={3}
                  placeholder="Requirement details, treasury parking, insurance needs, or key notes..."
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-sm"
                >
                  Save Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};