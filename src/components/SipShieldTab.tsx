import React, { useState } from 'react';
import { Shield, Calendar, AlertTriangle, MessageSquare, Copy, Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { GroupedSipAlert } from '../types';
import { generateWhatsAppUrl, formatSipShieldWhatsAppMessage } from '../lib/whatsAppRouter';

interface SipShieldTabProps {
  alerts: GroupedSipAlert[];
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onToggleDispatched?: (key: string) => void;
}

export const SipShieldTab: React.FC<SipShieldTabProps> = ({
  alerts,
  currentDate,
  onDateChange,
  onToggleDispatched
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = currentDate === todayStr;

  const handleCopy = (key: string, alert: GroupedSipAlert) => {
    const text = formatSipShieldWhatsAppMessage(alert);
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleStepDay = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleSetFriday = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const formattedDate = new Date(currentDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const totalShieldDebit = alerts.reduce((sum, a) => sum + a.total_debit, 0);
  const pendingAlerts = alerts.filter(a => !a.dispatched);
  const dispatchedAlerts = alerts.filter(a => a.dispatched);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                The 4-Day SIP Shield Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Automated Daily Radar
                </span>
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Advance intimation to prevent bank mandate bounce penalties and ensure uninterrupted wealth creation.
              </p>
            </div>
          </div>
        </div>

        {/* Evaluation Date Badge */}
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-slate-400" />
          <div className="text-xs">
            <span className="text-slate-500">Evaluation Date: </span>
            <strong className="text-slate-900">{formattedDate}</strong>
          </div>
          {isToday ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1">
              ● Live Today
            </span>
          ) : (
            <button
              onClick={() => onDateChange(todayStr)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold ml-1 flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset Today
            </button>
          )}
        </div>
      </div>

      {/* Interactive Date Controls Strip */}
      <div className="glass-panel p-4 md:p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Simulate / Check Any Date:</span>
          </span>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="bg-slate-50 text-slate-900 font-bold text-xs p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleStepDay(-1)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous Day
          </button>
          <button
            onClick={() => onDateChange(todayStr)}
            className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all ' + (isToday ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
          >
            Today
          </button>
          <button
            onClick={() => handleStepDay(1)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
          >
            Next Day <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSetFriday}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Fast forward to next Friday to see multi-day weekend banking offset guardrail"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Test Friday Offset</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Clients to Intimate</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{alerts.length}</p>
          <span className="text-[11px] text-slate-400">Target window: Date + 4 days</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Scheduled Debit</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalShieldDebit.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Protected against bank bounce</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Dispatch Progress</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{dispatchedAlerts.length} / {alerts.length}</p>
          <span className="text-[11px] text-slate-400">{pendingAlerts.length} reminders pending</span>
        </div>
      </div>

      {/* Alerts Grid */}
      {alerts.length === 0 ? (
        <div className="glass-panel p-12 md:p-16 text-center rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">No Pending SIP Intimations for This Date</h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              No active client SIP mandates fall due on the target date window relative to {formattedDate}.
            </p>
            <div className="pt-3">
              <button
                onClick={() => handleStepDay(1)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Scan Next Day &rarr;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {alerts.map((alert) => {
            const key = (alert.client_pan || alert.investor_name) + '-' + alert.due_date_str;
            const waMsg = formatSipShieldWhatsAppMessage(alert);
            const waUrl = generateWhatsAppUrl(alert.mobile, waMsg);

            return (
              <div
                key={key}
                className={'glass-panel p-6 rounded-2xl border space-y-4 shadow-sm transition-all ' + (alert.dispatched ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white')}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base md:text-lg text-slate-900">{alert.investor_name}</h4>
                      {alert.dispatched && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dispatched
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{alert.client_pan} • {alert.mobile || 'No Mobile'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm md:text-lg font-black text-emerald-700 font-mono">
                      ₹{alert.total_debit.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-500">Due: <strong>{alert.due_date_str}</strong></div>
                  </div>
                </div>

                {alert.offset_reason && alert.offset_reason.includes('Friday') && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>{alert.offset_reason}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Scheduled Mandates ({alert.schemes.length})</span>
                  {alert.schemes.map((s, si) => (
                    <div key={si} className="flex items-center justify-between text-xs md:text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-800 truncate pr-2">{s.scheme_name}</span>
                      <span className="font-bold text-amber-700 font-mono flex-shrink-0">₹{s.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {onToggleDispatched && (
                    <button
                      onClick={() => onToggleDispatched(key)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className={'w-3.5 h-3.5 ' + (alert.dispatched ? 'text-emerald-600' : 'text-slate-400')} />
                      <span>{alert.dispatched ? 'Mark Pending' : 'Mark Dispatched'}</span>
                    </button>
                  )}

                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleCopy(key, alert)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedKey === key ? 'Copied' : 'Copy Message'}</span>
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onToggleDispatched && onToggleDispatched(key)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};