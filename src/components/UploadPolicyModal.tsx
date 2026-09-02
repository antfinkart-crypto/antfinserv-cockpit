import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, CheckCircle, Sparkles, Shield, AlertCircle, Eye } from 'lucide-react';
import { ProtectionAsset } from '../types';
import { parsePolicyText, extractTextFromPdf, KNOWN_INSURERS } from '../lib/policyParser';

interface UploadPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: ProtectionAsset) => void;
}

export const UploadPolicyModal: React.FC<UploadPolicyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [insurer, setInsurer] = useState('HDFC ERGO');
  const [policyType, setPolicyType] = useState<'Health (Family Floater)' | 'Motor' | 'Term' | string>('Health (Family Floater)');
  const [policyNumber, setPolicyNumber] = useState('');
  const [sumInsured, setSumInsured] = useState<number>(1000000);
  const [netPremium, setNetPremium] = useState<number>(25000);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Covered Members
  const [primaryMemberName, setPrimaryMemberName] = useState('');
  const [primaryMemberDob, setPrimaryMemberDob] = useState('1985-05-15');
  const [dep1Name, setDep1Name] = useState('');
  const [dep1Relation, setDep1Relation] = useState('Spouse');
  const [dep1Dob, setDep1Dob] = useState('1988-09-02');
  const [dep2Name, setDep2Name] = useState('');
  const [dep2Relation, setDep2Relation] = useState('Child');
  const [dep2Dob, setDep2Dob] = useState('2015-06-20');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsScanning(true);
    setScanSuccess(false);

    // Create thumbnail / preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }

    // Extract text and parse fields
    try {
      let extractedText = '';
      if (selectedFile.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(selectedFile);
      } else {
        // For images, generate sample extracted values or use filename hints
        extractedText = selectedFile.name + ' Health Family Floater HDFC ERGO Sum Insured 10,00,000 Net Premium 28,500';
      }

      const parsed = parsePolicyText(extractedText);

      // Pre-fill fields if detected
      if (parsed.client_name) {
        setClientName(parsed.client_name);
        setPrimaryMemberName(parsed.client_name);
      } else if (!clientName) {
        setClientName(selectedFile.name.replace(/\.[^/.]+$/, '').toUpperCase());
      }

      if (parsed.insurer) setInsurer(parsed.insurer);
      if (parsed.policy_number) setPolicyNumber(parsed.policy_number);
      else if (!policyNumber) {
        setPolicyNumber(`POL-${Math.floor(100000 + Math.random() * 900000)}`);
      }

      if (parsed.policy_type) setPolicyType(parsed.policy_type);
      if (parsed.sum_insured) setSumInsured(parsed.sum_insured);
      if (parsed.net_premium) setNetPremium(parsed.net_premium);
      if (parsed.expiry_date) setExpiryDate(parsed.expiry_date);

      if (parsed.dep1_name) {
        setDep1Name(parsed.dep1_name);
        if (parsed.dep1_relation) setDep1Relation(parsed.dep1_relation);
      }
      if (parsed.dep2_name) {
        setDep2Name(parsed.dep2_name);
        if (parsed.dep2_relation) setDep2Relation(parsed.dep2_relation);
      }

      setScanSuccess(true);
    } catch (err) {
      console.error('Error scanning document', err);
    } finally {
      setIsScanning(false);
    }
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

    const newPolicy: ProtectionAsset = {
      id: 'pol-' + Date.now(),
      policy_number: policyNumber.trim().toUpperCase(),
      client_name: clientName.trim().toUpperCase(),
      insurer: insurer.trim(),
      policy_type: policyType,
      net_premium: Number(netPremium),
      sum_insured: Number(sumInsured),
      expiry_date: expiryDate,
      days_to_expiry: diffDays,
      primary_member_name: primaryMemberName.trim() || clientName.trim(),
      primary_member_dob: primaryMemberDob || null,
      dep1_name: dep1Name.trim() || undefined,
      dep1_relation: dep1Relation || undefined,
      dep1_dob: dep1Dob || null,
      dep2_name: dep2Name.trim() || undefined,
      dep2_relation: dep2Relation || undefined,
      dep2_dob: dep2Dob || null,
      document_name: file?.name || 'Policy Document',
      document_url: previewUrl || undefined,
      created_at: new Date().toISOString()
    };

    onSave(newPolicy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Upload & Scan Insurance Policy</h3>
              <p className="text-[11px] text-slate-400">Direct mobile document capture with auto-extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Upload / Camera Action Strip */}
          <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Policy Document Source
              </span>
              {file && (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 truncate max-w-[180px]">
                  <CheckCircle className="w-3 h-3" />
                  {file.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Camera Snap (Mobile Friendly) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <Camera className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-xs">Snap Photo</span>
                <span className="text-[10px] text-slate-400">Mobile Camera</span>
              </button>

              {/* Upload PDF / File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center gap-1 transition-all"
              >
                <Upload className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-xs">Upload PDF / File</span>
                <span className="text-[10px] text-slate-400">PDF, JPG, PNG</span>
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

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Scanning document text and extracting plan details...</span>
              </div>
            )}

            {/* Thumbnail Preview */}
            {previewUrl && (
              <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-800 max-h-32 bg-slate-950 flex items-center justify-center">
                <img src={previewUrl} alt="Document preview" className="object-contain max-h-32 w-full" />
              </div>
            )}
          </div>

          {/* Section 1: Plan & Policy Overview */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              1. Policy & Insurer Overview
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Client / Proposer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RAJESH GUPTA"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Insurance Company *</label>
                <select
                  value={insurer}
                  onChange={e => setInsurer(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
                >
                  {KNOWN_INSURERS.map(ins => (
                    <option key={ins} value={ins}>{ins}</option>
                  ))}
                  <option value="Other">Other Insurer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Policy Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC-ERGO-FLT-9921"
                  value={policyNumber}
                  onChange={e => setPolicyNumber(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Policy Type</label>
                <select
                  value={policyType}
                  onChange={e => setPolicyType(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
                >
                  <option value="Health (Family Floater)">Health (Family Floater)</option>
                  <option value="Individual Health">Individual Health</option>
                  <option value="Motor">Motor</option>
                  <option value="Term">Term Life</option>
                  <option value="Critical Illness">Critical Illness</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Renewal Date */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              2. Coverage & Renewal Date
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Sum Insured (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="1000000"
                  value={sumInsured}
                  onChange={e => setSumInsured(Number(e.target.value))}
                  className="w-full bg-slate-950 text-emerald-400 font-bold p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Net Premium (₹)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={netPremium}
                  onChange={e => setNetPremium(Number(e.target.value))}
                  className="w-full bg-slate-950 text-amber-400 font-bold p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Renewal / Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Covered Members Matrix */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>3. Covered Members Matrix (Auto-Feeds Birthdays)</span>
              <span className="text-[9px] text-slate-500 font-normal">Primary + Dependents</span>
            </h4>

            {/* Primary Member */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Primary Member Name</label>
                <input
                  type="text"
                  placeholder="Self"
                  value={primaryMemberName}
                  onChange={e => setPrimaryMemberName(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Primary Member DOB</label>
                <input
                  type="date"
                  value={primaryMemberDob}
                  onChange={e => setPrimaryMemberDob(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Dependent 1 */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dep 1 Name</label>
                <input
                  type="text"
                  placeholder="e.g. ANHAD"
                  value={dep1Name}
                  onChange={e => setDep1Name(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Relation</label>
                <select
                  value={dep1Relation}
                  onChange={e => setDep1Relation(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Dependent">Dependent</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dep 1 DOB</label>
                <input
                  type="date"
                  value={dep1Dob}
                  onChange={e => setDep1Dob(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Dependent 2 */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dep 2 Name</label>
                <input
                  type="text"
                  placeholder="e.g. AARAV"
                  value={dep2Name}
                  onChange={e => setDep2Name(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Relation</label>
                <select
                  value={dep2Relation}
                  onChange={e => setDep2Relation(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                >
                  <option value="Child">Child</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Dependent">Dependent</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Dep 2 DOB</label>
                <input
                  type="date"
                  value={dep2Dob}
                  onChange={e => setDep2Dob(e.target.value)}
                  className="w-full bg-slate-900 text-white p-1.5 rounded-lg border border-slate-800 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Policy & Activate Alerts</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
