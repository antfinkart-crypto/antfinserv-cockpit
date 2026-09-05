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
      const calculatedGst = taxesGst !== '' ? Number(taxesGst) : Math.round(netPremNum * 0.18);
      const calculatedGross = grossPremium !== '' ? Number(grossPremium) : Math.round(netPremNum + calculatedGst);

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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taxes / GST (₹)</label>
                  <input
                    type="number"
                    value={taxesGst}
                    onChange={e => setTaxesGst(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cumulative Bonus (NCB %)</label>
                    <input
                      type="number"
                      value={verticalData.cumulative_bonus_percentage ?? 0}
                      onChange={e => setVerticalData({ ...verticalData, cumulative_bonus_percentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {vertical === 'MOTOR' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Registration No</label>
                    <input
                      type="text"
                      value={verticalData.registration_number || ''}
                      onChange={e => setVerticalData({ ...verticalData, registration_number: e.target.value.toUpperCase() })}
                      placeholder="e.g. PB10HQ6966"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Make & Model</label>
                    <input
                      type="text"
                      value={verticalData.model || ''}
                      onChange={e => setVerticalData({ ...verticalData, model: e.target.value })}
                      placeholder="e.g. Maruti Suzuki XL6"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Insured Declared Value (IDV ₹)</label>
                    <input
                      type="number"
                      value={verticalData.idv ?? ''}
                      onChange={e => setVerticalData({ ...verticalData, idv: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
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
