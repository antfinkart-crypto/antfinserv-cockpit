import React, { useState } from 'react';
import {
  X,
  Save,
  Shield,
  Calendar,
  Users,
  AlertCircle,
  Car,
  Heart,
  Briefcase,
  Plane,
  Home,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  InsurancePolicy,
  InsuranceVertical,
  MemberRelationship,
  PolicyMember,
  PolicyStatus,
  PaymentFrequency
} from '../types/insurance';
import { KNOWN_INSURERS } from '../lib/policyParser';

interface EditPolicyModalProps {
  policy: InsurancePolicy;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPolicy: InsurancePolicy) => Promise<void> | void;
}

export const EditPolicyModal: React.FC<EditPolicyModalProps> = ({
  policy,
  isOpen,
  onClose,
  onSave
}) => {
  // 1. Core Policy & Master Proposer Fields
  const [vertical, setVertical] = useState<InsuranceVertical>(policy.vertical || 'HEALTH');
  const [clientName, setClientName] = useState(policy.client_name || '');
  const [proposerName, setProposerName] = useState(policy.proposer_name || policy.client_name || '');
  const [proposerMobile, setProposerMobile] = useState(policy.proposer_mobile || '');
  const [proposerEmail, setProposerEmail] = useState(policy.proposer_email || '');
  const [insurerName, setInsurerName] = useState(policy.insurer_name || '');
  const [productName, setProductName] = useState(policy.product_name || '');
  const [policyNumber, setPolicyNumber] = useState(policy.policy_number || '');
  const [policyStatus, setPolicyStatus] = useState<PolicyStatus>(policy.status || 'ACTIVE');

  // 2. Financials
  const [sumInsured, setSumInsured] = useState<number | ''>(policy.sum_insured || '');
  const [netPremium, setNetPremium] = useState<number | ''>(policy.net_premium || '');
  const [grossPremium, setGrossPremium] = useState<number | ''>(policy.gross_premium || '');
  const [taxesGst, setTaxesGst] = useState<number | ''>(policy.taxes_gst || '');
  const [paymentFreq, setPaymentFreq] = useState<PaymentFrequency>(policy.payment_frequency || 'ANNUAL');

  // 3. Lifecycle Dates (with sanitization for mistyped years like 72027)
  const sanitizeDate = (d?: string | null) => {
    if (!d) return '';
    // If year starts with erroneous 5-digit like 72027, strip leading 7
    if (/^7202[0-9]/.test(d)) {
      return d.substring(1);
    }
    return d;
  };

  const [inceptionDate, setInceptionDate] = useState(sanitizeDate(policy.inception_date));
  const [expiryDate, setExpiryDate] = useState(sanitizeDate(policy.expiry_date));
  const [renewalDueDate, setRenewalDueDate] = useState(sanitizeDate(policy.renewal_due_date || policy.expiry_date));

  // 4. Covered Family Members
  const [members, setMembers] = useState<Array<{
    id: string;
    member_name: string;
    relationship_to_head: MemberRelationship;
    dob: string;
    celebrated_dob_custom?: string;
    gender: 'Male' | 'Female' | 'Other';
    is_primary_insured: boolean;
  }>>(() => {
    if (policy.members && policy.members.length > 0) {
      return policy.members.map(m => ({
        id: m.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        member_name: m.member_name || '',
        relationship_to_head: m.relationship_to_head || 'Self',
        dob: m.dob || '',
        celebrated_dob_custom: m.celebrated_dob_custom || '',
        gender: m.gender || 'Not Specified' as any,
        is_primary_insured: m.is_primary_insured ?? false
      }));
    }
    return [{
      id: `mem_${Date.now()}`,
      member_name: policy.client_name || '',
      relationship_to_head: 'Self',
      dob: '',
      celebrated_dob_custom: '',
      gender: 'Male',
      is_primary_insured: true
    }];
  });

  // 5. Vertical Data
  const [verticalData, setVerticalData] = useState<Record<string, any>>({ ...(policy.vertical_data || {}) });

  // UI state
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'specs'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add Member
  const handleAddMember = () => {
    setMembers(prev => [
      ...prev,
      {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        member_name: '',
        relationship_to_head: 'Spouse',
        dob: '',
        celebrated_dob_custom: '',
        gender: 'Female',
        is_primary_insured: false
      }
    ]);
  };

  // Remove Member
  const handleRemoveMember = (id: string) => {
    if (members.length === 1) {
      alert('At least one member must be attached to the policy.');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // Handle Submit & Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validations
    if (!clientName.trim()) {
      setErrorMsg('Client Name is required.');
      return;
    }
    if (!policyNumber.trim()) {
      setErrorMsg('Policy Number is required.');
      return;
    }
    if (!expiryDate) {
      setErrorMsg('Expiry Date is required.');
      return;
    }

    // Validate 4-digit Year in Expiry Date
    const expParts = expiryDate.split('-');
    if (expParts[0] && expParts[0].length !== 4) {
      setErrorMsg(`Invalid year "${expParts[0]}" in Expiry Date. Please enter a valid 4-digit year (e.g. 2027).`);
      return;
    }

    try {
      setIsSaving(true);

      const netPremNum = Number(netPremium) || 0;
      const isRetailTaxExempt = vertical === 'HEALTH' || vertical === 'LIFE';
      const calculatedGst = isRetailTaxExempt ? 0 : (taxesGst !== '' ? Number(taxesGst) : Math.round(netPremNum * 0.18));
      const calculatedGross = isRetailTaxExempt ? netPremNum : (grossPremium !== '' ? Number(grossPremium) : Math.round(netPremNum + calculatedGst));

      const updatedPolicyMembers: PolicyMember[] = members.map(m => ({
        id: m.id,
        policy_id: policy.id,
        member_name: m.member_name.trim(),
        relationship_to_head: m.relationship_to_head,
        dob: m.dob,
        celebrated_dob_custom: m.celebrated_dob_custom || undefined,
        gender: m.gender,
        is_primary_insured: m.is_primary_insured,
        synced_to_client_master: true,
        synced_at: new Date().toISOString()
      }));

      const updatedPolicy: InsurancePolicy = {
        ...policy,
        client_name: clientName.trim(),
        proposer_name: (proposerName || clientName).trim(),
        proposer_mobile: proposerMobile.trim() || undefined,
        proposer_email: proposerEmail.trim() || undefined,
        insurer_name: insurerName.trim(),
        product_name: productName.trim(),
        policy_number: policyNumber.trim(),
        vertical,
        status: policyStatus,
        sum_insured: Number(sumInsured) || 0,
        net_premium: netPremNum,
        taxes_gst: calculatedGst,
        gross_premium: calculatedGross,
        payment_frequency: paymentFreq,
        inception_date: inceptionDate || policy.inception_date,
        expiry_date: expiryDate,
        renewal_due_date: renewalDueDate || expiryDate,
        members: updatedPolicyMembers,
        vertical_data: verticalData,
        updated_at: new Date().toISOString()
      };

      await onSave(updatedPolicy);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Failed to save policy changes');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Edit Policy Details
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {policy.id}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">Modify Insurance Policy</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Policy & Proposer Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'members'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>2. Covered Insured Members ({members.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'specs'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Vertical Specifications
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: CORE POLICY & PROPOSER */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Vertical Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Insurance Vertical</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'HEALTH', label: 'Health', icon: Heart },
                    { id: 'MOTOR', label: 'Motor', icon: Car },
                    { id: 'LIFE', label: 'Life/Term', icon: Shield },
                    { id: 'TRAVEL', label: 'Travel', icon: Plane },
                    { id: 'COMMERCIAL_GENERAL', label: 'Commercial', icon: Briefcase },
                    { id: 'HOME_PROPERTY', label: 'Home', icon: Home }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setVertical(item.id as InsuranceVertical)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          vertical === item.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Master Policyholder vs Proposer Distinction */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" /> Master Policyholder & Proposer Identity
                  </span>
                  <span className="text-[11px] text-amber-700">Proposer may differ from insured member</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Master Policyholder / Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="e.g. ESMIE JAIN VALENTINE"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proposer Name <span className="text-slate-400 font-normal">(if different from insured)</span>
                    </label>
                    <input
                      type="text"
                      value={proposerName}
                      onChange={e => setProposerName(e.target.value)}
                      placeholder="e.g. ANKIT ATTRI"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Proposer Mobile Number</label>
                    <input
                      type="text"
                      value={proposerMobile}
                      onChange={e => setProposerMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Proposer Email</label>
                    <input
                      type="email"
                      value={proposerEmail}
                      onChange={e => setProposerEmail(e.target.value)}
                      placeholder="e.g. client@domain.com"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Policy Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Number *</label>
                  <input
                    type="text"
                    required
                    value={policyNumber}
                    onChange={e => setPolicyNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Company *</label>
                  <input
                    type="text"
                    required
                    list="insurers-datalist"
                    value={insurerName}
                    onChange={e => setInsurerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <datalist id="insurers-datalist">
                    {KNOWN_INSURERS.map(ins => (
                      <option key={ins} value={ins} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product / Plan Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="e.g. Aspire Platinum+ Family Floater"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Lifecycle Dates & Mistype Correction */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Policy Term & Renewal Dates
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Correct any mistyped year</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Inception Date</label>
                    <input
                      type="date"
                      value={inceptionDate}
                      onChange={e => setInceptionDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Expiry Date * <span className="text-rose-600 font-normal">(Correct mistyped date)</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={e => {
                        setExpiryDate(e.target.value);
                        setRenewalDueDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Renewal Due Date</label>
                    <input
                      type="date"
                      value={renewalDueDate}
                      onChange={e => setRenewalDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Financials Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sum Insured (₹)</label>
                  <input
                    type="number"
                    value={sumInsured}
                    onChange={e => setSumInsured(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Net Premium (₹)</label>
                  <input
                    type="number"
                    value={netPremium}
                    onChange={e => setNetPremium(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-amber-700"
                  />
                </div>

{vertical !== 'HEALTH' && vertical !== 'LIFE' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Taxes / GST (₹)</label>
                    <input
                      type="number"
                      value={taxesGst}
                      onChange={e => setTaxesGst(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-700">Retail Tax Status</span>
                    <div className="mt-1 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>0% GST (Exempt)</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Frequency</label>
                  <select
                    value={paymentFreq}
                    onChange={e => setPaymentFreq(e.target.value as PaymentFrequency)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="ANNUAL">Annual</option>
                    <option value="HALF_YEARLY">Half-Yearly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="SINGLE">Single</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COVERED INSURED MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Covered Family Members & Birthday Radar</h4>
                  <p className="text-xs text-slate-500">
                    Insured members covered under this policy. Their birthdays are tracked for celebration greetings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="space-y-3">
                {members.map((m, idx) => (
                  <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">Member #{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMembers(prev => prev.map((item, i) => ({
                              ...item,
                              is_primary_insured: i === idx
                            })));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            m.is_primary_insured
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {m.is_primary_insured ? 'Primary Insured ★' : 'Set as Primary'}
                        </button>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={m.member_name}
                          onChange={e => {
                            const val = e.target.value;
                            setMembers(prev => prev.map(item => item.id === m.id ? { ...item, member_name: val } : item));
                          }}
                          placeholder="e.g. ESMIE JAIN VALENTINE"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Relationship to Head
                        </label>
                        <select
                          value={m.relationship_to_head}
                          onChange={e => {
                            const val = e.target.value as MemberRelationship;
                            setMembers(prev => prev.map(item => item.id === m.id ? { ...item, relationship_to_head: val } : item));
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium"
                        >
                          <option value="Self">Self</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Dependent">Dependent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Date of Birth (DOB)
                        </label>
                        <input
                          type="date"
                          value={m.dob}
                          onChange={e => {
                            const val = e.target.value;
                            setMembers(prev => prev.map(item => item.id === m.id ? { ...item, dob: val } : item));
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                          Hindu / Custom DOB
                        </label>
                        <input
                          type="date"
                          value={m.celebrated_dob_custom || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setMembers(prev => prev.map(item => item.id === m.id ? { ...item, celebrated_dob_custom: val } : item));
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VERTICAL SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900">
                {vertical} Policy Parameters & Specifications
              </h4>

              {vertical === 'HEALTH' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Type</label>
                    <input
                      type="text"
                      value={verticalData.plan_type || 'Family Floater'}
                      onChange={e => setVerticalData({ ...verticalData, plan_type: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Room Rent Limit</label>
                    <input
                      type="text"
                      value={verticalData.room_rent_limit || 'Single Private Room'}
                      onChange={e => setVerticalData({ ...verticalData, room_rent_limit: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Co-Pay Percentage (%)</label>
                    <input
                      type="number"
                      value={verticalData.copay_percentage ?? 0}
                      onChange={e => setVerticalData({ ...verticalData, copay_percentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NCB / Cumulative Bonus Amount for Current Year (₹) *
                    </label>
                    <input
                      type="number"
                      value={verticalData.ncb_current_year_amount ?? ''}
                      onChange={e => setVerticalData({ ...verticalData, ncb_current_year_amount: Number(e.target.value) })}
                      placeholder="e.g. 200000 (copied directly from renewal copy)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Exact rupee amount from policy schedule</span>
                  </div>
                </div>
              )}

              {vertical === 'MOTOR' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider">Mandatory IRDAI Motor Framework</span>
                    <p className="text-xs text-blue-900 mt-0.5">
                      New 4-Wheelers require 1+3 (1 Yr OD + 3 Yr TP). New 2-Wheelers require 1+5 (1 Yr OD + 5 Yr TP). Subsequent renewals are Standalone Own Damage (SAOD) while TP remains active.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Motor Policy Structure *</label>
                      <select
                        value={verticalData.policy_structure || (verticalData.vehicle_type === 'Two Wheeler' ? 'Comprehensive (1yr OD + 1yr TP)' : 'Standalone Own Damage (SAOD Renewal)')}
                        onChange={e => setVerticalData({ ...verticalData, policy_structure: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-bold text-slate-800"
                      >
                        <option value="Standalone Own Damage (SAOD Renewal)">Standalone Own Damage (SAOD Renewal) - [Underlying 3/5-Yr TP active]</option>
                        <option value="1+3 Bundled (New 4W: 1yr OD + 3yr TP)">1+3 Bundled (New 4-Wheeler: 1 Yr OD + 3 Yr TP)</option>
                        <option value="1+5 Bundled (New 2W: 1yr OD + 5yr TP)">1+5 Bundled (New 2-Wheeler: 1 Yr OD + 5 Yr TP)</option>
                        <option value="Comprehensive (1yr OD + 1yr TP)">Comprehensive (Standard 1 Yr OD + 1 Yr TP)</option>
                        <option value="Third Party Liability Only">Third Party Liability Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Registration No</label>
                      <input
                        type="text"
                        value={verticalData.registration_number || ''}
                        onChange={e => setVerticalData({ ...verticalData, registration_number: e.target.value.toUpperCase() })}
                        placeholder="e.g. PB10JS5941"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Make & Model</label>
                      <input
                        type="text"
                        value={verticalData.model || ''}
                        onChange={e => setVerticalData({ ...verticalData, model: e.target.value })}
                        placeholder="e.g. KIA SONET G1.0 T iMT"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Insured Declared Value (IDV ₹)</label>
                      <input
                        type="number"
                        value={verticalData.idv ?? ''}
                        onChange={e => setVerticalData({ ...verticalData, idv: Number(e.target.value) })}
                        placeholder="e.g. 1269900"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">NCB Discount % & Amount (₹)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={verticalData.ncb_percentage ?? 20}
                          onChange={e => setVerticalData({ ...verticalData, ncb_percentage: Number(e.target.value) })}
                          placeholder="NCB %"
                          className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                        />
                        <input
                          type="number"
                          value={verticalData.ncb_discount_amount ?? ''}
                          onChange={e => setVerticalData({ ...verticalData, ncb_discount_amount: Number(e.target.value) })}
                          placeholder="Discount ₹ (e.g. 7718)"
                          className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 font-mono font-semibold text-emerald-700"
                        />
                      </div>
                    </div>

                    {/* Third Party Details */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Third Party (TP) Insurer</label>
                      <input
                        type="text"
                        value={verticalData.tp_insurer_name || ''}
                        onChange={e => setVerticalData({ ...verticalData, tp_insurer_name: e.target.value })}
                        placeholder="e.g. Bajaj Allianz General Insurance Co. Ltd."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Third Party (TP) Policy Number</label>
                      <input
                        type="text"
                        value={verticalData.tp_policy_number || ''}
                        onChange={e => setVerticalData({ ...verticalData, tp_policy_number: e.target.value })}
                        placeholder="e.g. OG-25-1021-1825-0030547"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">TP Cover Expiry Date</label>
                      <input
                        type="date"
                        value={verticalData.tp_policy_expiry_date || ''}
                        onChange={e => setVerticalData({ ...verticalData, tp_policy_expiry_date: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-indigo-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Zero Depreciation (Nil Dep)</label>
                      <select
                        value={verticalData.zero_depreciation ? 'yes' : 'no'}
                        onChange={e => setVerticalData({ ...verticalData, zero_depreciation: e.target.value === 'yes' })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
                      >
                        <option value="yes">Yes (Included)</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {vertical === 'HOME_PROPERTY' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Multi-Property Risk Asset</span>
                    <p className="text-xs text-amber-900 mt-0.5">
                      Clients with multiple homes/flats (e.g. Mumbai flat & Bengaluru flat) are tagged individually with unique property identifiers and sum insured breakdown.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Property / Flat Identifier Tag *</label>
                      <input
                        type="text"
                        value={verticalData.property_identifier || ''}
                        onChange={e => setVerticalData({ ...verticalData, property_identifier: e.target.value })}
                        placeholder="e.g. Flat 1302 Tower E, Oberoi Splendor (Mumbai)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Risk Premises Location Address</label>
                      <textarea
                        rows={2}
                        value={verticalData.risk_location_address || verticalData.property_address || ''}
                        onChange={e => setVerticalData({ ...verticalData, risk_location_address: e.target.value, property_address: e.target.value })}
                        placeholder="Complete property address as per policy schedule..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Building Structure Sum Insured (₹)</label>
                      <input
                        type="number"
                        value={verticalData.structure_sum_insured ?? ''}
                        onChange={e => setVerticalData({ ...verticalData, structure_sum_insured: Number(e.target.value) })}
                        placeholder="e.g. 40000555"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Home Contents Sum Insured (₹)</label>
                      <input
                        type="number"
                        value={verticalData.contents_sum_insured ?? 0}
                        onChange={e => setVerticalData({ ...verticalData, contents_sum_insured: Number(e.target.value) })}
                        placeholder="e.g. 2000000"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Carpet Area (Sq. Meters)</label>
                      <input
                        type="number"
                        value={verticalData.carpet_area_sq_m ?? ''}
                        onChange={e => setVerticalData({ ...verticalData, carpet_area_sq_m: Number(e.target.value) })}
                        placeholder="e.g. 889 or 118"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Policy Tenure (Years)</label>
                      <input
                        type="number"
                        value={verticalData.policy_tenure_years ?? 1}
                        onChange={e => setVerticalData({ ...verticalData, policy_tenure_years: Number(e.target.value) })}
                        placeholder="e.g. 1 or 2"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {vertical === 'LIFE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Category</label>
                    <input
                      type="text"
                      value={verticalData.plan_category || 'Pure Term'}
                      onChange={e => setVerticalData({ ...verticalData, plan_category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nominee Name</label>
                    <input
                      type="text"
                      value={verticalData.nominee_name || ''}
                      onChange={e => setVerticalData({ ...verticalData, nominee_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Raw JSON fallback for extra fields */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Additional Specification Key-Values</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-xs">
                  {Object.entries(verticalData).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-slate-500">{k}:</span>
                      <span className="font-bold text-slate-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Policy Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
