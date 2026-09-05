import React, { useState, useRef } from 'react';
import { MfHolding, ActiveSip, ImportBatch } from '../types';
import { parseHoldingReport, parseActiveSipReport, ParseResult } from '../lib/mfReportParser';
import { TrendingUp, Upload, FileText, CheckCircle2, AlertTriangle, Search, Check, Edit3, Trash2 } from 'lucide-react';
import { EditHoldingModal } from './EditHoldingModal';

interface MutualFundsWorkspaceProps {
  holdings: MfHolding[];
  sips: ActiveSip[];
  batches: ImportBatch[];
  onSaveHoldings: (newHoldings: MfHolding[], batch: ImportBatch) => Promise<void>;
  onSaveSips: (newSips: ActiveSip[], batch: ImportBatch) => Promise<void>;
  onUpdateHolding?: (updated: MfHolding) => Promise<void>;
  onDeleteHolding?: (holdingId: string) => Promise<void>;
}

export const MutualFundsWorkspace: React.FC<MutualFundsWorkspaceProps> = ({
  holdings,
  sips,
  batches,
  onSaveHoldings,
  onSaveSips,
  onUpdateHolding,
  onDeleteHolding
}) => {
  const [holdingToEdit, setHoldingToEdit] = useState<MfHolding | null>(null);
  const [isEditHoldingModalOpen, setIsEditHoldingModalOpen] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState<MfHolding | null>(null);
  const [isDeleteHoldingConfirmOpen, setIsDeleteHoldingConfirmOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'holdings' | 'sips' | 'batches'>('holdings');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [holdingPreview, setHoldingPreview] = useState<ParseResult<MfHolding> | null>(null);
  const [sipPreview, setSipPreview] = useState<ParseResult<ActiveSip> | null>(null);
  const [activeFileName, setActiveFileName] = useState('');

  const holdingFileInputRef = useRef<HTMLInputElement>(null);
  const sipFileInputRef = useRef<HTMLInputElement>(null);

  // Authority Calculations:
  // 1. Portfolio AUM = Sum of Current Value from Holding Report ONLY! Never add SIP amounts.
  const totalPortfolioAum = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalInvestedCost = holdings.reduce((sum, h) => sum + (h.invested_cost || 0), 0);
  const totalAbsoluteGain = totalPortfolioAum - totalInvestedCost;
  const totalGainPct = totalInvestedCost > 0 ? (totalAbsoluteGain / totalInvestedCost) * 100 : 0;

  // 2. Monthly SIP Commitment = Sum of Monthly Amount from Active SIP Report ONLY!
  const totalMonthlySipCommitment = sips.reduce((sum, s) => sum + (s.monthly_amount || 0), 0);
  const uniqueAmcs = new Set(holdings.map(h => h.amc_name)).size;
  const uniqueFolios = new Set(holdings.map(h => h.folio_number)).size;

  // File Upload Handlers
  const handleHoldingFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setActiveFileName(file.name);
    try {
      const result = await parseHoldingReport(file, batches, holdings);
      setHoldingPreview(result);
    } catch (err: any) {
      alert('Error parsing Holding Report: ' + err.message);
    } finally {
      setIsUploading(false);
      if (holdingFileInputRef.current) holdingFileInputRef.current.value = '';
    }
  };

  const handleSipFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setActiveFileName(file.name);
    try {
      const result = await parseActiveSipReport(file, batches, holdings);
      setSipPreview(result);
    } catch (err: any) {
      alert('Error parsing Active SIP Report: ' + err.message);
    } finally {
      setIsUploading(false);
      if (sipFileInputRef.current) sipFileInputRef.current.value = '';
    }
  };

  const commitHoldingImport = async () => {
    if (!holdingPreview) return;
    if (holdingPreview.records.length === 0) {
      alert('No valid holding records detected in this file to commit.');
      return;
    }
    const batch: ImportBatch = {
      id: holdingPreview.records[0]?.batch_id || 'batch-' + Date.now(),
      report_type: 'holding',
      file_name: activeFileName,
      file_hash: holdingPreview.fileHash,
      row_count: holdingPreview.records.length,
      new_count: holdingPreview.newCount,
      matched_count: holdingPreview.matchedCount,
      imported_at: new Date().toISOString()
    };
    await onSaveHoldings(holdingPreview.records, batch);
    setHoldingPreview(null);
    setActiveSubTab('holdings');
  };

  const commitSipImport = async () => {
    if (!sipPreview) return;
    if (sipPreview.records.length === 0) {
      alert('No valid active SIP records detected in this file to commit.');
      return;
    }
    const batch: ImportBatch = {
      id: sipPreview.records[0]?.batch_id || 'batch-' + Date.now(),
      report_type: 'sip',
      file_name: activeFileName,
      file_hash: sipPreview.fileHash,
      row_count: sipPreview.records.length,
      new_count: sipPreview.newCount,
      matched_count: sipPreview.matchedCount,
      imported_at: new Date().toISOString()
    };
    await onSaveSips(sipPreview.records, batch);
    setSipPreview(null);
    setActiveSubTab('sips');
  };

  const q = searchTerm.toLowerCase();
  const filteredHoldings = holdings.filter(h =>
    (h.investor_name && h.investor_name.toLowerCase().includes(q)) ||
    (h.scheme_name && h.scheme_name.toLowerCase().includes(q)) ||
    (h.folio_number && h.folio_number.toLowerCase().includes(q)) ||
    (h.pan && h.pan.toLowerCase().includes(q))
  );

  const filteredSips = sips.filter(s =>
    (s.investor_name && s.investor_name.toLowerCase().includes(q)) ||
    (s.scheme_name && s.scheme_name.toLowerCase().includes(q)) ||
    (s.folio_number && s.folio_number.toLowerCase().includes(q)) ||
    (s.pan_number && s.pan_number.toLowerCase().includes(q))
  );

  const hasData = holdings.length > 0 || sips.length > 0;

  return (
    <div className="space-y-6">
      <input
        ref={holdingFileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleHoldingFileUpload}
      />
      <input
        ref={sipFileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleSipFileUpload}
      />

      {/* Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Client Mutual Fund Portfolio Workspace
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Direct client report ingestion, dual-authority separation (AUM vs SIP Commitment), and automated reconciliation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => holdingFileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 md:px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Holding Report (.xlsx/.csv)</span>
          </button>

          <button
            onClick={() => sipFileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 md:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Active SIP Report (.xlsx/.csv)</span>
          </button>
        </div>
      </div>

      {/* Holding Preview Validation Modal */}
      {holdingPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>Holding Report Import Validation</span>
              </h3>
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                {activeFileName}
              </span>
            </div>

            {holdingPreview.isDuplicateBatch && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Duplicate File Checksum: </span>
                  File previously uploaded. Committing will perform a <strong>Portfolio Refresh</strong> without duplicate AUM inflation.
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-xs text-slate-500">Rows Detected</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{holdingPreview.totalRows}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <div className="text-xs text-emerald-600">New Holdings</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{holdingPreview.newCount}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <div className="text-xs text-blue-600">Refreshed</div>
                <div className="text-2xl font-black text-blue-700 mt-1">{holdingPreview.matchedCount}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setHoldingPreview(null)}
                className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={commitHoldingImport}
                disabled={holdingPreview.records.length === 0}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm ${
                  holdingPreview.records.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {holdingPreview.isDuplicateBatch ? 'Refresh / Re-import' : 'Commit'} {holdingPreview.records.length} Holdings
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active SIP Preview Validation Modal */}
      {sipPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Active SIP Report Import Validation</span>
              </h3>
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                {activeFileName}
              </span>
            </div>

            {sipPreview.isDuplicateBatch && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Duplicate File Detected: </span>
                  Preserving all legitimate multiple SIP mandates while tracking import batch.
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-xs text-slate-500">Rows Detected</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{sipPreview.totalRows}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <div className="text-xs text-emerald-600">Holding Linked</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{sipPreview.matchedCount}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <div className="text-xs text-amber-600">Pending Match</div>
                <div className="text-2xl font-black text-amber-700 mt-1">{sipPreview.newCount}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSipPreview(null)}
                className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={commitSipImport}
                disabled={sipPreview.records.length === 0}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm ${
                  sipPreview.records.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {sipPreview.isDuplicateBatch ? 'Refresh / Re-import' : 'Commit'} {sipPreview.records.length} Active SIPs
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Empty State */}
      {!hasData ? (
        <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">No Mutual Fund Portfolio Imported Yet</h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Upload your client holding statement (.xlsx / .csv) or active SIP report to initiate portfolio tracking, AUM analysis, and mandate shield intimation.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => holdingFileInputRef.current?.click()}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Holding Report (.xlsx/.csv)</span>
            </button>
            <button
              onClick={() => sipFileInputRef.current?.click()}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Active SIP Report (.xlsx/.csv)</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Authoritative Portfolio AUM
              </span>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                ₹{totalPortfolioAum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>Holdings Valuation Only</span>
                <span className="font-semibold text-emerald-600">+{totalGainPct.toFixed(1)}% Gain</span>
              </div>
            </div>

            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Monthly SIP Commitment
              </span>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-600 mt-2 tracking-tight">
                ₹{totalMonthlySipCommitment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>Active Mandates: <strong>{sips.length}</strong></span>
                <span className="text-slate-600 font-semibold">Excluded from AUM</span>
              </div>
            </div>

            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Invested Cost & Gain
              </span>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                ₹{totalInvestedCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <div className="text-xs text-slate-500 mt-2">
                <span>Total Gain: ₹{totalAbsoluteGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Portfolio Breadth
              </span>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                {uniqueFolios} <span className="text-sm font-normal text-slate-500">Folios</span>
              </p>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>{uniqueAmcs} Fund Houses</span>
                <span>{holdings.length} Schemes</span>
              </div>
            </div>
          </div>

          {/* Sub Tab Controls */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('holdings')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeSubTab === 'holdings' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Holding Report Records ({holdings.length})
              </button>
              <button
                onClick={() => setActiveSubTab('sips')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeSubTab === 'sips' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active SIP Records ({sips.length})
              </button>
              <button
                onClick={() => setActiveSubTab('batches')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeSubTab === 'batches' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Import Batches ({batches.length})
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Investor, Folio, PAN, Scheme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Holdings View */}
          {activeSubTab === 'holdings' && (
            <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Investor & PAN</th>
                      <th className="px-5 py-3.5">Scheme & AMC</th>
                      <th className="px-5 py-3.5">Folio Number</th>
                      <th className="px-5 py-3.5 text-right">Units & NAV</th>
                      <th className="px-5 py-3.5 text-right">Invested Cost</th>
                      <th className="px-5 py-3.5 text-right">Current Valuation</th>
                      <th className="px-5 py-3.5 text-center">Linked SIP</th>
                      <th className="px-5 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHoldings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">No matching holding records found.</td>
                      </tr>
                    ) : (
                      filteredHoldings.map((h) => {
                        const matched = sips.filter(s => s.folio_number === h.folio_number);
                        return (
                          <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900">{h.investor_name}</div>
                              <div className="text-xs font-mono text-slate-500">{h.pan}</div>
                            </td>
                            <td className="px-5 py-3.5 max-w-sm">
                              <div className="font-semibold text-slate-900 truncate" title={h.scheme_name}>{h.scheme_name}</div>
                              <div className="text-xs text-slate-500">{h.amc_name} {h.category_name && `• ${h.category_name}`}</div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-700">{h.folio_number}</td>
                            <td className="px-5 py-3.5 text-right font-mono">
                              <div className="text-slate-900">{h.holding_units.toLocaleString('en-IN', { maximumFractionDigits: 3 })}</div>
                              <div className="text-xs text-slate-500">₹{h.latest_nav.toFixed(2)}</div>
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-700">
                              ₹{h.invested_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-emerald-700">
                              ₹{h.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {matched.length > 0 ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                  {matched.length} Active SIP{matched.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">None</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHoldingToEdit(h);
                                    setIsEditHoldingModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Edit Holding"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                {onDeleteHolding && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHoldingToDelete(h);
                                      setIsDeleteHoldingConfirmOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Holding"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active SIPs View */}
          {activeSubTab === 'sips' && (
            <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Investor & PAN</th>
                      <th className="px-5 py-3.5">Scheme & Folio</th>
                      <th className="px-5 py-3.5 text-center">Debit Day</th>
                      <th className="px-5 py-3.5 text-center">Frequency</th>
                      <th className="px-5 py-3.5 text-right">Monthly Amount</th>
                      <th className="px-5 py-3.5 text-center">Holding Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSips.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">No matching active SIP records found.</td>
                      </tr>
                    ) : (
                      filteredSips.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{s.investor_name}</div>
                            <div className="text-xs font-mono text-slate-500">{s.pan_number} {s.mobile && `• ${s.mobile}`}</div>
                          </td>
                          <td className="px-5 py-3.5 max-w-sm">
                            <div className="font-semibold text-slate-900 truncate" title={s.scheme_name}>{s.scheme_name}</div>
                            <div className="text-xs font-mono text-slate-500">Folio: {s.folio_number}</div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                              {s.sip_date}th
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-600">{s.frequency}</td>
                          <td className="px-5 py-3.5 text-right font-black text-amber-600">
                            ₹{s.monthly_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {s.holding_match_status === 'Matched' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                                <Check className="w-3 h-3" /> Matched
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                Pending / Not Found
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Batches View */}
          {activeSubTab === 'batches' && (
            <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Import Timestamp</th>
                    <th className="px-5 py-3.5">Report Type</th>
                    <th className="px-5 py-3.5">Source File</th>
                    <th className="px-5 py-3.5 text-right">Rows Ingested</th>
                    <th className="px-5 py-3.5 text-right">New Records</th>
                    <th className="px-5 py-3.5 text-right">Matched Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 text-slate-700">{new Date(b.imported_at).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 font-bold uppercase text-xs">
                        <span className={b.report_type === 'holding' ? 'text-amber-700' : 'text-blue-700'}>
                          {b.report_type === 'holding' ? 'Holding Report' : 'Active SIP Report'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{b.file_name}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">{b.row_count}</td>
                      <td className="px-5 py-3.5 text-right text-emerald-600 font-bold">{b.new_count}</td>
                      <td className="px-5 py-3.5 text-right text-blue-600 font-bold">{b.matched_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* EDIT HOLDING MODAL */}
      {isEditHoldingModalOpen && holdingToEdit && (
        <EditHoldingModal
          isOpen={isEditHoldingModalOpen}
          holding={holdingToEdit}
          onClose={() => {
            setIsEditHoldingModalOpen(false);
            setHoldingToEdit(null);
          }}
          onSave={async (updated) => {
            if (onUpdateHolding) {
              await onUpdateHolding(updated);
            }
          }}
        />
      )}

      {/* DELETE HOLDING CONFIRMATION MODAL */}
      {isDeleteHoldingConfirmOpen && holdingToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Delete Mutual Fund Holding?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete the holding in <strong className="text-slate-900">{holdingToDelete.scheme_name}</strong> (Folio: {holdingToDelete.folio_number}) for <strong className="text-slate-900">{holdingToDelete.investor_name}</strong>?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                ⚠️ Client AUM will be recalculated and updated in Client Master.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteHoldingConfirmOpen(false);
                  setHoldingToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteHolding && holdingToDelete) {
                    await onDeleteHolding(holdingToDelete.id);
                    setIsDeleteHoldingConfirmOpen(false);
                    setHoldingToDelete(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
              >
                Yes, Delete Holding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};