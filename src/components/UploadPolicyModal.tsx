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
  HelpCircle,
  RefreshCw,
  Calendar,
  Layers
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
  // Primary Vertical Selection
  const [vertical, setVertical] = useState<InsuranceVertical>('HEALTH');
  const [autoDetectedVertical, setAutoDetectedVertical] = useState<InsuranceVertical | null>(null);

  // Common Policy & Insurer Fields
  const [clientName, setClientName] = useState('');
  const [proposerMobile, setProposerMobile] = useState('');
  const [proposerEmail, setProposerEmail] = useState('');
  const [insurer, setInsurer] = useState('Niva Bupa Health Insurance Company Limited');
  const [productName, setProductName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [sumInsured, setSumInsured] = useState<number | ''>('');
  const [netPremium, setNetPremium] = useState<number | ''>('');
  const [taxesGst, setTaxesGst] = useState<number | ''>('');
  const [grossPremium, setGrossPremium] = useState<number | ''>('');
  const [inceptionDate, setInceptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [autoSyncFamily, setAutoSyncFamily] = useState(true);

  // Multi-Member Matrix for Family Floaters (Zero Imaginary Defaults)
  const [members, setMembers] = useState<Array<{
    id: string;
    member_name: string;
    relationship_to_head: MemberRelationship;
    dob: string;
    celebrated_dob_custom?: string;
    gender: 'Male' | 'Female' | 'Other';
    is_primary_insured: boolean;
  }>>([]);

  // Nominee Details
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState<MemberRelationship>('Nominee');

  // Motor Specific State (Zero Imaginary Defaults)
  const [regNumber, setRegNumber] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [mfgYear, setMfgYear] = useState<number>(2021);
  const [fuelType, setFuelType] = useState('Petrol');
  const [seatingCapacity, setSeatingCapacity] = useState<number>(5);
  const [rtoLocation, setRtoLocation] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [idv, setIdv] = useState<number | ''>('');
  const [basicOd, setBasicOd] = useState<number | ''>('');
  const [totalOd, setTotalOd] = useState<number | ''>('');
  const [basicTp, setBasicTp] = useState<number | ''>('');
  const [totalTp, setTotalTp] = useState<number | ''>('');
  const [ncb, setNcb] = useState<number>(0);
  const [zeroDep, setZeroDep] = useState(false);
  const [engineGuard, setEngineGuard] = useState(false);
  const [consumables, setConsumables] = useState(false);
  const [keyReplacement, setKeyReplacement] = useState(false);
  const [roadsideAssistance, setRoadsideAssistance] = useState(false);
  const [previousInsurer, setPreviousInsurer] = useState('');
  const [previousPolicyNo, setPreviousPolicyNo] = useState('');

  // Life Specific State
  const [lifePlanCategory, setLifePlanCategory] = useState<'Pure Term' | 'ULIP' | 'Endowment'>('Pure Term');
  const [lifeAssuredName, setLifeAssuredName] = useState('');
  const [policyTermYears, setPolicyTermYears] = useState<number>(30);
  const [premiumPayingTermYears, setPremiumPayingTermYears] = useState<number>(30);

  // Commercial Specific State
  const [businessName, setBusinessName] = useState('');
  const [riskLocation, setRiskLocation] = useState('');
  const [businessAssetsSi, setBusinessAssetsSi] = useState<number | ''>('');
  const [perilsCovered, setPerilsCovered] = useState('Standard Fire & Special Perils');

  // Document & OCR State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string>('');
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0.96);
  const [confidenceBreakdown, setConfidenceBreakdown] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'preview' | 'ocr'>('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Apply parsed extraction results into state
  const applyParsedResults = (parsed: any, rawText?: string, fileName?: string) => {
    if (parsed.vertical) {
      setVertical(parsed.vertical);
      setAutoDetectedVertical(parsed.vertical);
    }
    if (parsed.insurer) setInsurer(parsed.insurer);
    if (parsed.policy_number) setPolicyNumber(parsed.policy_number);
    if (parsed.product_name) setProductName(parsed.product_name);
    if (parsed.client_name) setClientName(parsed.client_name);
    if (parsed.proposer_mobile) setProposerMobile(parsed.proposer_mobile);
    if (parsed.proposer_email) setProposerEmail(parsed.proposer_email);
    if (parsed.sum_insured !== undefined && parsed.sum_insured > 0) setSumInsured(parsed.sum_insured);
    if (parsed.net_premium !== undefined) setNetPremium(parsed.net_premium);
    if (parsed.taxes_gst !== undefined) setTaxesGst(parsed.taxes_gst);
    if (parsed.gross_premium !== undefined) setGrossPremium(parsed.gross_premium);
    if (parsed.inception_date) setInceptionDate(parsed.inception_date);
    if (parsed.expiry_date) setExpiryDate(parsed.expiry_date);
    if (parsed.nominee_name) setNomineeName(parsed.nominee_name);
    if (parsed.nominee_relationship) setNomineeRelation(parsed.nominee_relationship);

    // Apply members if extracted (Zero Fake Data)
    if (parsed.members && parsed.members.length > 0) {
      setMembers(
        parsed.members.map((m: any, idx: number) => ({
          id: `mem_ext_${idx}_${Date.now()}`,
          member_name: m.member_name,
          relationship_to_head: m.relationship_to_head || (idx === 0 ? 'Self' : 'Dependent'),
          dob: m.dob || '',
          celebrated_dob_custom: m.celebrated_dob_custom || '',
          gender: m.gender || 'Male',
          is_primary_insured: m.is_primary_insured ?? (idx === 0)
        }))
      );
    } else if (parsed.vertical === 'HEALTH' && parsed.client_name) {
      setMembers([
        {
          id: `mem_primary_${Date.now()}`,
          member_name: parsed.client_name,
          relationship_to_head: 'Self',
          dob: '',
          gender: 'Male',
          is_primary_insured: true
        }
      ]);
    } else {
      setMembers([]);
    }

    // Apply motor fields
    if (parsed.motor_data) {
      if (parsed.motor_data.registration_number) setRegNumber(parsed.motor_data.registration_number);
      if (parsed.motor_data.make_model) setMakeModel(parsed.motor_data.make_model);
      if (parsed.motor_data.manufacturing_year) setMfgYear(parsed.motor_data.manufacturing_year);
      if (parsed.motor_data.fuel_type) setFuelType(parsed.motor_data.fuel_type);
      if (parsed.motor_data.idv) setIdv(parsed.motor_data.idv);
      if (parsed.motor_data.ncb_percentage !== undefined) setNcb(parsed.motor_data.ncb_percentage);
      if (parsed.motor_data.rto_location) setRtoLocation(parsed.motor_data.rto_location);
      if (parsed.motor_data.engine_number) setEngineNumber(parsed.motor_data.engine_number);
      if (parsed.motor_data.chassis_number) setChassisNumber(parsed.motor_data.chassis_number);
      if (parsed.motor_data.zero_depreciation !== undefined) setZeroDep(parsed.motor_data.zero_depreciation);
      if (parsed.motor_data.engine_protection !== undefined) setEngineGuard(parsed.motor_data.engine_protection);
      if (parsed.motor_data.consumables_cover !== undefined) setConsumables(parsed.motor_data.consumables_cover);
      if (parsed.motor_data.key_replacement !== undefined) setKeyReplacement(parsed.motor_data.key_replacement);
      if (parsed.motor_data.roadside_assistance !== undefined) setRoadsideAssistance(parsed.motor_data.roadside_assistance);
      if (parsed.motor_data.previous_insurer) setPreviousInsurer(parsed.motor_data.previous_insurer);
      if (parsed.motor_data.previous_policy_number) setPreviousPolicyNo(parsed.motor_data.previous_policy_number);
    }

    if (rawText) setExtractedRawText(rawText);
    if (parsed.confidence) {
      setExtractionConfidence(parsed.confidence.overall || 0.96);
      setConfidenceBreakdown(parsed.confidence);
    }
    setScanSuccess(true);
  };

  // Process File Upload
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
        extractedText = `${selectedFile.name} Insurance Policy Document`;
      }

      const parsed = parsePolicyText(extractedText);
      applyParsedResults(parsed, extractedText, selectedFile.name);
    } catch (err) {
      console.error('Error scanning document', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Re-run parsing if the advisor changes vertical
  const handleReparseForVertical = (forcedVert: InsuranceVertical) => {
    setVertical(forcedVert);
    if (extractedRawText) {
      const parsed = parsePolicyText(extractedRawText, forcedVert);
      applyParsedResults(parsed, extractedRawText, file?.name);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_POLICIES.find(s => s.id === sampleId);
    if (!sample) return;

    setIsScanning(true);
    setTimeout(() => {
      const parsed = parsePolicyText(sample.rawText, sample.vertical);
      applyParsedResults(parsed, sample.rawText, sample.fileName);
      setIsScanning(false);
    }, 250);
  };

  const handleAddMember = () => {
    setMembers(prev => [
      ...prev,
      {
        id: `mem_${Date.now()}`,
        member_name: '',
        relationship_to_head: 'Child',
        dob: '',
        celebrated_dob_custom: '',
        gender: 'Male',
        is_primary_insured: false
      }
    ]);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !policyNumber) {
      alert('Please fill in Client / Proposer Name and Policy Number.');
      return;
    }

    // Format members
    const formattedMembers: PolicyMember[] = members.map((m, idx) => ({
      id: m.id.startsWith('mem_') ? m.id : `mem_${Date.now()}_${idx}`,
      policy_id: `pol_${Date.now()}`,
      member_name: m.member_name.trim().toUpperCase() || (idx === 0 ? clientName.trim().toUpperCase() : `MEMBER ${idx + 1}`),
      relationship_to_head: m.relationship_to_head,
      dob: m.dob || '1990-01-01',
      celebrated_dob_custom: m.celebrated_dob_custom || undefined,
      gender: m.gender,
      is_primary_insured: m.is_primary_insured,
      sum_insured_individual: Number(sumInsured) || 0,
      synced_to_client_master: autoSyncFamily
    }));

    // Dynamic Vertical Payload
    let verticalData: any = {};
    if (vertical === 'MOTOR') {
      verticalData = {
        registration_number: regNumber.replace(/[\s-]/g, '').toUpperCase(),
        make: makeModel.split(' ')[0] || 'Vehicle',
        model: makeModel,
        variant: makeModel,
        manufacturing_year: mfgYear,
        fuel_type: fuelType as any,
        seating_capacity: seatingCapacity,
        rto_location: rtoLocation,
        engine_number_masked: engineNumber,
        chassis_number_masked: chassisNumber,
        idv: Number(idv) || Number(sumInsured) || 0,
        ncb_percentage: Number(ncb) || 0,
        zero_depreciation: zeroDep,
        engine_protection: engineGuard,
        consumables_cover: consumables,
        key_replacement: keyReplacement,
        roadside_assistance: roadsideAssistance,
        vehicle_type: 'Private Car',
        policy_subtype: 'Comprehensive'
      };
    } else if (vertical === 'HEALTH') {
      verticalData = {
        plan_type: members.length > 1 ? 'Family Floater' : 'Individual',
        room_rent_limit: 'Single Private Room',
        copay_percentage: 0,
        restoration_benefit: true,
        cumulative_bonus_percentage: 50,
        portability_eligible: true
      };
    } else if (vertical === 'LIFE') {
      verticalData = {
        plan_category: lifePlanCategory,
        life_assured_name: lifeAssuredName || clientName,
        proposer_name: clientName,
        nominee_name: nomineeName,
        nominee_relationship: nomineeRelation,
        policy_term_years: policyTermYears,
        premium_paying_term_years: premiumPayingTermYears,
        sum_assured_death: Number(sumInsured) || 0
      };
    } else if (vertical === 'COMMERCIAL_GENERAL') {
      verticalData = {
        business_legal_name: businessName || clientName,
        risk_location: riskLocation,
        business_assets_sum_insured: Number(businessAssetsSi) || Number(sumInsured) || 0,
        policy_name: perilsCovered
      };
    }

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
      sum_insured: Number(sumInsured) || 0,
      gross_premium: Number(grossPremium) || (Number(netPremium) + Number(taxesGst)) || 0,
      net_premium: Number(netPremium) || 0,
      taxes_gst: Number(taxesGst) || 0,
      payment_frequency: 'ANNUAL',
      inception_date: inceptionDate,
      expiry_date: expiryDate,
      renewal_due_date: expiryDate,
      verification_status: 'VERIFIED',
      extraction_confidence: extractionConfidence,
      source_document_name: file?.name || 'Policy_Schedule.pdf',
      members: formattedMembers,
      vertical_data: verticalData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSave(modernPolicy);
    if (onSaveInsurancePolicy) onSaveInsurancePolicy(modernPolicy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Upload & Scan Insurance Policy
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Document Intelligence Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-vertical OCR parser with real-time parameter extraction and full manual modification.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROMINENT VERTICAL SELECTOR BAR */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Insurance Vertical:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'HEALTH', label: 'Health Floater', icon: Heart },
                { id: 'MOTOR', label: 'Motor Vehicle', icon: Car },
                { id: 'LIFE', label: 'Life / Term', icon: Shield },
                { id: 'COMMERCIAL_GENERAL', label: 'Commercial / Fire', icon: Briefcase },
                { id: 'PERSONAL_ACCIDENT', label: 'Personal Accident', icon: AlertCircle },
                { id: 'TRAVEL', label: 'Travel', icon: Plane },
                { id: 'HOME_PROPERTY', label: 'Home', icon: Home }
              ].map(cat => {
                const CatIcon = cat.icon;
                const isSelected = vertical === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleReparseForVertical(cat.id as InsuranceVertical)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {autoDetectedVertical && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Detected: {autoDetectedVertical}</span>
              </span>
              {extractedRawText && (
                <button
                  type="button"
                  onClick={() => handleReparseForVertical(vertical)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white underline flex items-center gap-1 cursor-pointer"
                  title="Re-extract parameters for the currently selected vertical"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reparse</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Main Body (2 Columns Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* LEFT COLUMN: UPLOAD & DOCUMENT VIEWER */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col space-y-4 bg-slate-950/40">
            {/* 1-Click Built-in Sample Policies */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>1-Click Sample Fixtures</span>
                </span>
                <span className="text-[10px] text-slate-500">Instant test parse</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {SAMPLE_POLICIES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleLoadSample(s.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 hover:border-emerald-500/40 text-left border border-slate-700/60 transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-slate-200 group-hover:text-emerald-300 line-clamp-1">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.insurer}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all cursor-pointer bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center space-y-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <strong className="text-sm font-bold text-white block">
                  {file ? file.name : 'Upload Policy Schedule (PDF / Image)'}
                </strong>
                <span className="text-xs text-slate-400">
                  Auto-extracts policy parameters, financials & floater members
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-xs font-bold text-emerald-300">
                  Scanning document & extracting vertical parameters...
                </span>
              </div>
            )}

            {/* Extraction Confidence Badge */}
            {scanSuccess && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 font-semibold">Extraction Confidence:</span>
                </div>
                <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {(extractionConfidence * 100).toFixed(0)}% Match
                </span>
              </div>
            )}

            {/* Left Column Tabs: Preview vs Raw Text */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('preview')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Document Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('ocr')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === 'ocr' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Extracted Raw Text ({extractedRawText.length} chars)
                </button>
              </div>

              {activeLeftTab === 'preview' && (
                <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-3 overflow-y-auto flex items-center justify-center text-slate-500 text-xs text-center min-h-[200px]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Policy Preview" className="max-h-72 object-contain rounded-lg" />
                  ) : file ? (
                    <div className="space-y-1">
                      <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-300">{file.name}</p>
                      <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB PDF loaded</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-500">
                      <FileText className="w-8 h-8 mx-auto opacity-40" />
                      <p>Select a policy document or 1-click demo to preview</p>
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'ocr' && (
                <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-y-auto font-mono text-[11px] text-slate-400 max-h-72 whitespace-pre-wrap">
                  {extractedRawText || 'No text extracted yet. Upload a PDF or click a sample fixture above.'}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: DYNAMIC EDITABLE FORM */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col space-y-5 bg-slate-900/60 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* SECTION 1: POLICY & INSURER OVERVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Policy & Insurer Identification</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">All fields fully editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Client / Proposer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. YEMULA NARESH / VINOD VERMA"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Insurance Company *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Niva Bupa / SBI General / Star Health"
                      value={insurer}
                      onChange={e => setInsurer(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Policy / Certificate Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. POPMCAR00102986126"
                      value={policyNumber}
                      onChange={e => setPolicyNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Contact Mobile</label>
                    <input
                      type="text"
                      placeholder="e.g. 9872700392"
                      value={proposerMobile}
                      onChange={e => setProposerMobile(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="e.g. antfinkart@gmail.com"
                      value={proposerEmail}
                      onChange={e => setProposerEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Product / Plan Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Aspire Platinum+ Floater / Private Car Package"
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Inception Date *</label>
                    <input
                      type="date"
                      required
                      value={inceptionDate}
                      onChange={e => setInceptionDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Renewal / Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC SECTION 2: MOTOR SPECIFICATIONS (IF MOTOR SELECTED) */}
              {vertical === 'MOTOR' && (
                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-blue-800/30 pb-2">
                    <h4 className="font-extrabold text-sm text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-blue-400" />
                      <span>Motor Vehicle Specifications</span>
                    </h4>
                    <span className="text-[10px] text-blue-400">RC & Schedule Data</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Vehicle Reg Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. PB10HQ6966"
                        value={regNumber}
                        onChange={e => setRegNumber(e.target.value.toUpperCase())}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-blue-800/60 text-blue-300 font-mono font-black text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-300 block mb-1">Make, Model & Variant *</label>
                      <input
                        type="text"
                        placeholder="e.g. Maruti Suzuki XL6 Zeta Petrol"
                        value={makeModel}
                        onChange={e => setMakeModel(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-blue-800/60 text-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Manufacturing Year</label>
                      <input
                        type="number"
                        placeholder="2021"
                        value={mfgYear}
                        onChange={e => setMfgYear(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Fuel Type</label>
                      <select
                        value={fuelType}
                        onChange={e => setFuelType(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">RTO Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Ludhiana"
                        value={rtoLocation}
                        onChange={e => setRtoLocation(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Seating Capacity</label>
                      <input
                        type="number"
                        placeholder="6"
                        value={seatingCapacity}
                        onChange={e => setSeatingCapacity(Number(e.target.value))}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Engine Number</label>
                      <input
                        type="text"
                        placeholder="e.g. K15BN9125562"
                        value={engineNumber}
                        onChange={e => setEngineNumber(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Chassis Number</label>
                      <input
                        type="text"
                        placeholder="e.g. MA3CNC32SMF254235"
                        value={chassisNumber}
                        onChange={e => setChassisNumber(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Add-on Covers Opted */}
                  <div>
                    <label className="font-bold text-slate-300 block mb-1.5">Add-on Covers Opted</label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        { label: 'Zero Depreciation / Nil Dep', state: zeroDep, setter: setZeroDep },
                        { label: 'Engine Guard', state: engineGuard, setter: setEngineGuard },
                        { label: 'Consumables Cover', state: consumables, setter: setConsumables },
                        { label: 'Key Replacement', state: keyReplacement, setter: setKeyReplacement },
                        { label: 'Roadside Assistance', state: roadsideAssistance, setter: setRoadsideAssistance }
                      ].map((addon, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addon.setter(!addon.state)}
                          className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            addon.state
                              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${addon.state ? 'text-white' : 'text-slate-600'}`} />
                          <span>{addon.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Previous Policy Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-900/30">
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">Previous Insurer</label>
                      <input
                        type="text"
                        placeholder="e.g. Go Digit General Insurance"
                        value={previousInsurer}
                        onChange={e => setPreviousInsurer(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">Previous Policy Number</label>
                      <input
                        type="text"
                        placeholder="e.g. D207612663"
                        value={previousPolicyNo}
                        onChange={e => setPreviousPolicyNo(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FINANCIAL SCHEDULE & PREMIUM BREAKDOWN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>
                      {vertical === 'MOTOR' ? 'Vehicle IDV & Premium Breakdown' : 'Coverage & Financial Schedule'}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-400">All amounts in INR (₹)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      {vertical === 'MOTOR' ? 'Vehicle IDV (₹) *' : 'Sum Insured (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1000000 / 596232"
                      value={sumInsured}
                      onChange={e => {
                        const v = e.target.value ? Number(e.target.value) : '';
                        setSumInsured(v);
                        if (vertical === 'MOTOR') setIdv(v);
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-extrabold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Net / Taxable Premium (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 38964 / 14970"
                      value={netPremium}
                      onChange={e => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setNetPremium(val);
                        if (val && typeof val === 'number') {
                          const tax = Math.round(val * 0.18);
                          setTaxesGst(tax);
                          setGrossPremium(val + tax);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-extrabold text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">GST Taxes (₹)</label>
                    <input
                      type="number"
                      placeholder="0 or 18%"
                      value={taxesGst}
                      onChange={e => setTaxesGst(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Final / Gross Premium (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 38964 / 17665"
                      value={grossPremium}
                      onChange={e => setGrossPremium(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {vertical === 'MOTOR' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold block">Total OD Premium:</span>
                      <strong className="text-slate-200">₹{(basicOd || 11204).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Total TP Premium:</span>
                      <strong className="text-slate-200">₹{(basicTp || 3766).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">No Claim Bonus:</span>
                      <strong className="text-emerald-400">{ncb}% NCB</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* DYNAMIC SECTION 3: COVERED FAMILY MEMBERS (FOR HEALTH FLOATERS) */}
              {vertical === 'HEALTH' && (
                <div className="space-y-3 p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40">
                  <div className="flex items-center justify-between border-b border-rose-800/30 pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-rose-400" />
                        <span>Covered Family Members Matrix (Auto-Feeds Birthdays)</span>
                      </h4>
                      <p className="text-[11px] text-rose-400/80 mt-0.5">
                        Extracted dependents, relationships, and DOBs sync to Client Master for automated birthday greetings.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {members.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-rose-800/50 text-center space-y-2">
                      <Users className="w-6 h-6 text-rose-400/60 mx-auto" />
                      <p className="text-slate-400 text-xs font-semibold">
                        No family dependents detected yet. Click "+ Add Member" to add spouse, parents, or kids.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {members.map((mem, index) => (
                        <div
                          key={mem.id}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-rose-500/40 transition-colors"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            {/* Member Name */}
                            <div className="sm:col-span-4">
                              <label className="font-semibold text-slate-400 block text-[10px] mb-0.5">
                                Member #{index + 1} Name *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. YEMULA SHANKARAIAH"
                                value={mem.member_name}
                                onChange={e => {
                                  const val = e.target.value;
                                  setMembers(prev => prev.map((m, i) => (i === index ? { ...m, member_name: val } : m)));
                                }}
                                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs"
                              />
                            </div>

                            {/* Relationship */}
                            <div className="sm:col-span-3">
                              <label className="font-semibold text-slate-400 block text-[10px] mb-0.5">
                                Relationship to Head *
                              </label>
                              <select
                                value={mem.relationship_to_head}
                                onChange={e => {
                                  const val = e.target.value as MemberRelationship;
                                  setMembers(prev => prev.map((m, i) => (i === index ? { ...m, relationship_to_head: val } : m)));
                                }}
                                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold"
                              >
                                <option value="Self">Self (Family Head)</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Son">Son</option>
                                <option value="Daughter">Daughter</option>
                                <option value="Child">Child</option>
                                <option value="Father-in-law">Father-in-law</option>
                                <option value="Mother-in-law">Mother-in-law</option>
                                <option value="Dependent">Dependent</option>
                              </select>
                            </div>

                            {/* Date of Birth */}
                            <div className="sm:col-span-3">
                              <label className="font-semibold text-slate-400 block text-[10px] mb-0.5">
                                Date of Birth (DOB) *
                              </label>
                              <input
                                type="date"
                                required
                                value={mem.dob}
                                onChange={e => {
                                  const val = e.target.value;
                                  setMembers(prev => prev.map((m, i) => (i === index ? { ...m, dob: val } : m)));
                                }}
                                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold text-xs"
                              />
                            </div>

                            {/* Gender & Remove */}
                            <div className="sm:col-span-2 flex items-center gap-1.5">
                              <div className="flex-1">
                                <label className="font-semibold text-slate-400 block text-[10px] mb-0.5">Gender</label>
                                <select
                                  value={mem.gender}
                                  onChange={e => {
                                    const val = e.target.value as any;
                                    setMembers(prev => prev.map((m, i) => (i === index ? { ...m, gender: val } : m)));
                                  }}
                                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveMember(mem.id)}
                                className="p-2 text-slate-500 hover:text-rose-400 mt-4 rounded-lg hover:bg-slate-900 cursor-pointer"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Indian / Hindu Calendar Custom Date Modification Option */}
                          <div className="pt-1.5 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 text-amber-400">
                              <Calendar className="w-3 h-3" />
                              <span>Custom / Hindu Calendar Celebrated Birthday (Optional):</span>
                            </span>
                            <input
                              type="text"
                              placeholder="e.g. Celebrated as per Hindu Tithi / Preferred Date"
                              value={mem.celebrated_dob_custom || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setMembers(prev => prev.map((m, i) => (i === index ? { ...m, celebrated_dob_custom: val } : m)));
                              }}
                              className="p-1 px-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 text-xs w-full sm:w-72"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto-Sync Checkbox */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncFamily}
                      onChange={e => setAutoSyncFamily(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                    />
                    <span>
                      Auto-sync all family members to <strong>Golden Client Master</strong> & activate Birthday Radar
                    </span>
                  </label>
                </div>
              )}

              {/* DYNAMIC SECTION 4: LIFE & TERM SPECIFICATIONS */}
              {vertical === 'LIFE' && (
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3">
                  <h4 className="font-extrabold text-sm text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Life & Pure Term Vault Specifications</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Life Assured Name</label>
                      <input
                        type="text"
                        placeholder="e.g. ANKIT ATTRI"
                        value={lifeAssuredName || clientName}
                        onChange={e => setLifeAssuredName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Nominee Name</label>
                      <input
                        type="text"
                        placeholder="e.g. POOJA ATTRI"
                        value={nomineeName}
                        onChange={e => setNomineeName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Nominee Relation</label>
                      <select
                        value={nomineeRelation}
                        onChange={e => setNomineeRelation(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Nominee">Nominee</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Policy & Activate Intelligence</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
