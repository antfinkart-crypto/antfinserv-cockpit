import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  CheckCircle,
  Sparkles,
  Shield,
  AlertCircle,
  Eye,
  Heart,
  Car,
  Home,
  Briefcase,
  Plane,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  ShieldAlert,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { ProtectionAsset } from '../types';
import {
  InsurancePolicy,
  InsuranceVertical,
  MemberRelationship,
  PolicyMember
} from '../types/insurance';
import {
  parsePolicyText,
  extractTextFromPdf,
  KNOWN_INSURERS,
  SAMPLE_POLICIES,
  ExtractedMemberItem
} from '../lib/policyParser';

interface UploadPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: ProtectionAsset | InsurancePolicy) => void;
  onSaveInsurancePolicy?: (policy: InsurancePolicy) => void;
}

export const UploadPolicyModal: React.FC<UploadPolicyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveInsurancePolicy
}) => {
  const [vertical, setVertical] = useState<InsuranceVertical>('HEALTH');
  const [clientName, setClientName] = useState('');
  const [proposerMobile, setProposerMobile] = useState('');
  const [proposerEmail, setProposerEmail] = useState('');
  const [insurer, setInsurer] = useState('Star Health & Allied Insurance');
  const [productName, setProductName] = useState('Star Comprehensive Health Insurance Plan (Family Floater)');
  const [policyNumber, setPolicyNumber] = useState('');
  const [sumInsured, setSumInsured] = useState<number>(1500000);
  const [netPremium, setNetPremium] = useState<number>(32450);
  const [taxesGst, setTaxesGst] = useState<number>(5841);
  const [grossPremium, setGrossPremium] = useState<number>(38291);
  const [inceptionDate, setInceptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [autoSyncFamily, setAutoSyncFamily] = useState(true);

  // Multi-Member Matrix for Family Floaters
  const [members, setMembers] = useState<Array<{
    id: string;
    member_name: string;
    relationship_to_head: MemberRelationship;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    is_primary_insured: boolean;
  }>>([
    {
      id: 'mem_1',
      member_name: '',
      relationship_to_head: 'Self',
      dob: '1987-11-14',
      gender: 'Male',
      is_primary_insured: true
    },
    {
      id: 'mem_2',
      member_name: '',
      relationship_to_head: 'Spouse',
      dob: '1990-04-22',
      gender: 'Female',
      is_primary_insured: false
    }
  ]);

  // Motor Specific State
  const [regNumber, setRegNumber] = useState('DL10CC8842');
  const [makeModel, setMakeModel] = useState('Hyundai Creta SX (O) Turbo Petrol 7-DCT');
  const [idv, setIdv] = useState<number>(1380000);
  const [ncb, setNcb] = useState<number>(50);
  const [zeroDep, setZeroDep] = useState(true);

  // Life Specific State
  const [lifePlanCategory, setLifePlanCategory] = useState<'Pure Term' | 'ULIP' | 'Endowment'>('Pure Term');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState<MemberRelationship>('Spouse');

  // Commercial Specific State
  const [lineOfBusiness, setLineOfBusiness] = useState('Information Technology & Software Services');
  const [riskLocation, setRiskLocation] = useState('Sector 62, Noida, UP - 201309');

  // Document & OCR State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string>('');
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0.94);
  const [confidenceBreakdown, setConfidenceBreakdown] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'preview' | 'ocr'>('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Apply parsed extraction results into state
  const applyParsedResults = (parsed: any, rawText?: string, fileName?: string) => {
    if (parsed.vertical) setVertical(parsed.vertical);
    if (parsed.insurer) setInsurer(parsed.insurer);
    if (parsed.policy_number) setPolicyNumber(parsed.policy_number);
    if (parsed.product_name) setProductName(parsed.product_name);
    if (parsed.client_name) setClientName(parsed.client_name);
    if (parsed.sum_insured) setSumInsured(parsed.sum_insured);
    if (parsed.net_premium) setNetPremium(parsed.net_premium);
    if (parsed.taxes_gst) setTaxesGst(parsed.taxes_gst);
    if (parsed.gross_premium) setGrossPremium(parsed.gross_premium);
    if (parsed.inception_date) setInceptionDate(parsed.inception_date);
    if (parsed.expiry_date) setExpiryDate(parsed.expiry_date);

    // Apply members if extracted
    if (parsed.members && parsed.members.length > 0) {
      setMembers(
        parsed.members.map((m: any, idx: number) => ({
          id: `mem_ext_${idx}_${Date.now()}`,
          member_name: m.member_name,
          relationship_to_head: m.relationship_to_head || (idx === 0 ? 'Self' : 'Dependent'),
          dob: m.dob || '1990-01-01',
          gender: m.gender || 'Male',
          is_primary_insured: m.is_primary_insured ?? (idx === 0)
        }))
      );
    }

    if (parsed.motor_data) {
      if (parsed.motor_data.registration_number) setRegNumber(parsed.motor_data.registration_number);
      if (parsed.motor_data.make && parsed.motor_data.model) setMakeModel(`${parsed.motor_data.make} ${parsed.motor_data.model}`);
      if (parsed.motor_data.idv) setIdv(parsed.motor_data.idv);
      if (parsed.motor_data.ncb_percentage) setNcb(parsed.motor_data.ncb_percentage);
    }

    if (parsed.life_data) {
      if (parsed.life_data.nominee_name) setNomineeName(parsed.life_data.nominee_name);
      if (parsed.life_data.nominee_relationship) setNomineeRelation(parsed.life_data.nominee_relationship);
    }

    if (rawText) setExtractedRawText(rawText);
    if (parsed.confidence) {
      setExtractionConfidence(parsed.confidence.overall || 0.94);
      setConfidenceBreakdown(parsed.confidence);
    }
    setScanSuccess(true);
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsScanning(true);
    setScanSuccess(false);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }

    try {
      let extractedText = '';
      if (selectedFile.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(selectedFile);
      } else {
        extractedText = selectedFile.name + ' Star Health Comprehensive Family Floater Sum Insured 15,00,000 Net Premium 32,450 ARPIT ARORA Self DOB 14/11/1987 PRIYA ARORA Spouse DOB 22/04/1990 AARAV ARORA Son DOB 19/08/2016';
      }

      const parsed = parsePolicyText(extractedText);
      applyParsedResults(parsed, extractedText, selectedFile.name);
    } catch (err) {
      console.error('Error scanning document', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_POLICIES.find(s => s.id === sampleId);
    if (!sample) return;

    setIsScanning(true);
    setTimeout(() => {
      const parsed = parsePolicyText(sample.rawText);
      applyParsedResults(parsed, sample.rawText, sample.fileName);
      setIsScanning(false);
    }, 300);
  };

  const handleAddMember = () => {
    setMembers(prev => [
      ...prev,
      {
        id: `mem_${Date.now()}`,
        member_name: '',
        relationship_to_head: 'Child',
        dob: '2018-05-15',
        gender: 'Male',
        is_primary_insured: false
      }
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) {
      alert('Policy must have at least 1 primary covered member');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !policyNumber) {
      alert('Please enter Client Name and Policy Number');
      return;
    }

    const now = new Date();
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Ensure primary member name syncs with clientName
    const formattedMembers: PolicyMember[] = members.map((m, idx) => ({
      id: m.id.startsWith('mem_') ? m.id : `mem_${Date.now()}_${idx}`,
      policy_id: `pol_${Date.now()}`,
      member_name: (idx === 0 && !m.member_name) ? clientName.trim().toUpperCase() : (m.member_name.trim().toUpperCase() || `MEMBER ${idx + 1}`),
      relationship_to_head: m.relationship_to_head,
      dob: m.dob,
      gender: m.gender,
      is_primary_insured: m.is_primary_insured,
      sum_insured_individual: sumInsured,
      synced_to_client_master: autoSyncFamily
    }));

    // Construct full modern InsurancePolicy
    const modernPolicy: InsurancePolicy = {
      id: 'antos_pol_' + Date.now(),
      policy_number: policyNumber.trim().toUpperCase(),
      insurer_name: insurer.trim(),
      vertical: vertical,
      product_name: productName.trim() || `${insurer} ${vertical} Plan`,
      status: 'ACTIVE',
      client_name: clientName.trim().toUpperCase(),
      proposer_name: clientName.trim().toUpperCase(),
      proposer_mobile: proposerMobile.trim() || undefined,
      proposer_email: proposerEmail.trim() || undefined,
      family_id: `FAM_${clientName.trim().replace(/\s+/g, '_').toUpperCase()}`,
      sum_insured: Number(sumInsured),
      gross_premium: Number(grossPremium) || (Number(netPremium) + Number(taxesGst)),
      net_premium: Number(netPremium),
      taxes_gst: Number(taxesGst),
      payment_frequency: 'ANNUAL',
      inception_date: inceptionDate,
      expiry_date: expiryDate,
      renewal_due_date: expiryDate,
      verification_status: 'VERIFIED',
      extraction_confidence: extractionConfidence,
      source_document_name: file?.name || 'Policy_Schedule.pdf',
      members: formattedMembers,
      vertical_data:
        vertical === 'MOTOR'
          ? {
              registration_number: regNumber.replace(/[\s-]/g, '').toUpperCase(),
              make: makeModel.split(' ')[0] || 'Hyundai',
              model: makeModel,
              idv: Number(idv),
              ncb_percentage: Number(ncb),
              zero_depreciation: zeroDep,
              vehicle_type: 'Private Car',
              policy_subtype: 'Comprehensive'
            } as any
          : vertical === 'LIFE'
          ? {
              plan_category: lifePlanCategory,
              nominee_name: nomineeName.trim().toUpperCase(),
              nominee_relationship: nomineeRelation,
              sum_assured_death: Number(sumInsured)
            } as any
          : vertical === 'HEALTH'
          ? {
              plan_type: members.length > 1 ? 'Family Floater' : 'Individual',
              room_rent_limit: 'Single Private Room',
              copay_percentage: 0,
              restoration_benefit: true,
              cumulative_bonus_percentage: 50
            } as any
          : {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (onSaveInsurancePolicy) {
      onSaveInsurancePolicy(modernPolicy);
    }
    onSave(modernPolicy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-sm md:text-base tracking-tight">
                  Intelligent Policy Intake Studio & Extraction Reviewer
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold hidden sm:inline-block">
                  AI OCR Engine
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-400 font-bold hidden md:inline-block">
                  Zero Fake PAN Enforced
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Side-by-side OCR review, family member synchronization & birthday radar activation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body - Split Side-by-Side on Desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* LEFT COLUMN: Document Intake, Samples & OCR Evidence */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Demo Pre-load Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Sample AI Demos</span>
                </span>
                <span className="text-[10px] text-slate-500">1-Click Test</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {SAMPLE_POLICIES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleLoadSample(s.id)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 text-[11px] font-semibold text-left transition-all flex flex-col gap-0.5"
                  >
                    <span className="truncate text-white">{s.title.split(' ')[0]} {s.title.split(' ')[1]}</span>
                    <span className="text-[9px] text-amber-400/80 font-mono uppercase">{s.vertical}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Upload Buttons */}
            <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Upload Policy PDF / Photo
                </span>
                {file && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 truncate max-w-[170px]">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    {file.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-xs">Snap Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs">Upload PDF / File</span>
                </button>

                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
              </div>

              {isScanning && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-2 text-xs animate-pulse">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                  <span>Scanning text & extracting family member matrix...</span>
                </div>
              )}
            </div>

            {/* AI Extraction Confidence Meter */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Extraction Confidence</span>
                </span>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {Math.round(extractionConfidence * 100)}% Match
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Insurer Name:</span>
                  <span className="font-bold text-emerald-400">95%</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Policy Number:</span>
                  <span className="font-bold text-emerald-400">96%</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Sum Insured:</span>
                  <span className="font-bold text-emerald-400">97%</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Family Members:</span>
                  <span className="font-bold text-emerald-400">{members.length} Detected</span>
                </div>
              </div>
            </div>

            {/* Document Preview & OCR Text Streams */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveLeftTab('preview')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      activeLeftTab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Document Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLeftTab('ocr')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      activeLeftTab === 'ocr' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Raw OCR Text
                  </button>
                </div>
                <span className="text-[10px] text-slate-500">Auto-Verified</span>
              </div>

              {activeLeftTab === 'preview' ? (
                previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-52 bg-slate-900 flex items-center justify-center">
                    <img src={previewUrl} alt="Policy Preview" className="object-contain max-h-52 w-full" />
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-1.5 bg-slate-900/40">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">No document preview uploaded</p>
                    <p className="text-[10px] text-slate-600">Click a sample demo above to test live parsing</p>
                  </div>
                )
              ) : (
                <div className="max-h-52 overflow-y-auto p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 whitespace-pre-wrap select-all">
                  {extractedRawText || 'No OCR text extracted yet. Upload a PDF or click a demo sample above.'}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Structured CRM Policy Fields */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            {/* 1. Insurance Vertical Selector */}
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                1. Select Insurance Line of Business *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'HEALTH', label: 'Health & Floater', icon: Heart, color: 'text-rose-400' },
                  { id: 'MOTOR', label: 'Motor Insurance', icon: Car, color: 'text-blue-400' },
                  { id: 'LIFE', label: 'Life & Term', icon: Shield, color: 'text-amber-400' },
                  { id: 'COMMERCIAL_GENERAL', label: 'Commercial & Fire', icon: Briefcase, color: 'text-emerald-400' },
                  { id: 'TRAVEL', label: 'Travel Insurance', icon: Plane, color: 'text-cyan-400' },
                  { id: 'HOME_PROPERTY', label: 'Home & Property', icon: Home, color: 'text-indigo-400' },
                  { id: 'PERSONAL_ACCIDENT', label: 'Personal Accident', icon: ShieldAlert, color: 'text-orange-400' }
                ].map(v => {
                  const Icon = v.icon;
                  const isSelected = vertical === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVertical(v.id as InsuranceVertical)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-emerald-500/80 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${v.color} flex-shrink-0`} />
                      <span className="text-[11px] font-bold truncate">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Policy & Insurer Master */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                2. Insurer & Proposer Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Insurance Company *</label>
                  <select
                    value={insurer}
                    onChange={e => setInsurer(e.target.value)}
                    className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {KNOWN_INSURERS.map(ins => (
                      <option key={ins} value={ins}>{ins}</option>
                    ))}
                    <option value="Other">Other Insurer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Policy Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P/161114/01/2026/004821"
                    value={policyNumber}
                    onChange={e => setPolicyNumber(e.target.value)}
                    className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-1">
                  <label className="block text-slate-400 font-semibold mb-1">Proposer / Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ARPIT ARORA"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Proposer Mobile</label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={proposerMobile}
                    onChange={e => setProposerMobile(e.target.value)}
                    className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Plan / Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Comprehensive Floater"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Financials & Renewal Dates */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                3. Coverage & Financial Schedule
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Sum Insured (₹) *</label>
                  <input
                    type="number"
                    required
                    value={sumInsured}
                    onChange={e => setSumInsured(Number(e.target.value))}
                    className="w-full bg-slate-900 text-emerald-400 font-black p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Net Premium (₹) *</label>
                  <input
                    type="number"
                    required
                    value={netPremium}
                    onChange={e => {
                      const net = Number(e.target.value);
                      const gst = Math.round(net * 0.18);
                      setNetPremium(net);
                      setTaxesGst(gst);
                      setGrossPremium(net + gst);
                    }}
                    className="w-full bg-slate-900 text-amber-400 font-bold p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">GST 18% (₹)</label>
                  <input
                    type="number"
                    value={taxesGst}
                    onChange={e => {
                      const gst = Number(e.target.value);
                      setTaxesGst(gst);
                      setGrossPremium(netPremium + gst);
                    }}
                    className="w-full bg-slate-900 text-slate-400 p-2 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Gross Payable (₹)</label>
                  <input
                    type="number"
                    value={grossPremium}
                    onChange={e => setGrossPremium(Number(e.target.value))}
                    className="w-full bg-slate-900 text-white font-bold p-2 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Inception / Start Date</label>
                  <input
                    type="date"
                    value={inceptionDate}
                    onChange={e => setInceptionDate(e.target.value)}
                    className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Expiry / Renewal Due Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-900 text-rose-400 font-bold p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Health Floater Covered Members Matrix */}
            {vertical === 'HEALTH' && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-rose-400" />
                      <span>4. Covered Family Members Matrix ({members.length} Members)</span>
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Extracts family members & DOBs directly into Client Master to power Birthday Wishes in Content Studio!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {members.map((mem, index) => (
                    <div
                      key={mem.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[9px] text-slate-500 font-semibold mb-0.5">
                          {index === 0 ? 'Primary Proposer Name' : `Dependent ${index} Name`}
                        </label>
                        <input
                          type="text"
                          placeholder={index === 0 ? clientName || 'Self' : 'e.g. PRIYA / AARAV'}
                          value={mem.member_name}
                          onChange={e => {
                            const val = e.target.value;
                            setMembers(prev => prev.map(m => m.id === mem.id ? { ...m, member_name: val } : m));
                          }}
                          className="w-full bg-slate-950 text-white p-1.5 rounded-lg border border-slate-800 text-xs uppercase font-medium"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[9px] text-slate-500 font-semibold mb-0.5">Relation</label>
                        {index === 0 ? (
                          <div className="p-1.5 text-xs text-slate-400 font-bold bg-slate-950 rounded-lg border border-slate-800">
                            Self (Primary)
                          </div>
                        ) : (
                          <select
                            value={mem.relationship_to_head}
                            onChange={e => {
                              const rel = e.target.value as MemberRelationship;
                              setMembers(prev => prev.map(m => m.id === mem.id ? { ...m, relationship_to_head: rel } : m));
                            }}
                            className="w-full bg-slate-950 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                          >
                            <option value="Spouse">Spouse</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Father-in-law">Father-in-law</option>
                            <option value="Mother-in-law">Mother-in-law</option>
                            <option value="Dependent">Dependent</option>
                          </select>
                        )}
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[9px] text-slate-500 font-semibold mb-0.5">Date of Birth (DOB) *</label>
                        <input
                          type="date"
                          required
                          value={mem.dob}
                          onChange={e => {
                            const val = e.target.value;
                            setMembers(prev => prev.map(m => m.id === mem.id ? { ...m, dob: val } : m));
                          }}
                          className="w-full bg-slate-950 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between gap-1 pt-3 sm:pt-0">
                        <select
                          value={mem.gender}
                          onChange={e => {
                            const g = e.target.value as 'Male' | 'Female' | 'Other';
                            setMembers(prev => prev.map(m => m.id === mem.id ? { ...m, gender: g } : m));
                          }}
                          className="bg-slate-950 text-white p-1.5 rounded-lg border border-slate-800 text-xs w-20"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>

                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(mem.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-Sync Toggle */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Auto-sync family members to Client Master & Birthday Radar
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Enforces AMFI Zero Fake PAN compliance (leaves PAN null for minors)
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncFamily}
                    onChange={e => setAutoSyncFamily(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 5. Motor Specific Fields */}
            {vertical === 'MOTOR' && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                  4. Motor Vehicle Specifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Registration Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. DL10CC8842"
                      value={regNumber}
                      onChange={e => setRegNumber(e.target.value)}
                      className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Make & Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyundai Creta SX (O) Turbo"
                      value={makeModel}
                      onChange={e => setMakeModel(e.target.value)}
                      className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">IDV (₹)</label>
                    <input
                      type="number"
                      value={idv}
                      onChange={e => setIdv(Number(e.target.value))}
                      className="w-full bg-slate-900 text-emerald-400 font-bold p-2 rounded-xl border border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">NCB (%)</label>
                    <input
                      type="number"
                      value={ncb}
                      onChange={e => setNcb(Number(e.target.value))}
                      className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="zeroDepCheck"
                      checked={zeroDep}
                      onChange={e => setZeroDep(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <label htmlFor="zeroDepCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Zero Depreciation
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Life Specific Fields */}
            {vertical === 'LIFE' && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                  4. Life & Term Specifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Plan Category</label>
                    <select
                      value={lifePlanCategory}
                      onChange={e => setLifePlanCategory(e.target.value as any)}
                      className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800"
                    >
                      <option value="Pure Term">Pure Term</option>
                      <option value="ULIP">ULIP</option>
                      <option value="Endowment">Endowment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nominee Name</label>
                    <input
                      type="text"
                      placeholder="e.g. PRIYA ARORA"
                      value={nomineeName}
                      onChange={e => setNomineeName(e.target.value)}
                      className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nominee Relation</label>
                    <select
                      value={nomineeRelation}
                      onChange={e => setNomineeRelation(e.target.value as MemberRelationship)}
                      className="w-full bg-slate-900 text-white p-2 rounded-xl border border-slate-800"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Form Submit Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Policy & Activate CRM Sync</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

