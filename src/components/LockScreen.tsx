import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Clock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Delete
} from 'lucide-react';
import {
  verifyPin,
  verifyMasterPassword,
  getLockoutStatus,
  recordSuccessfulAuth,
  isDeviceTrusted24h,
  emergencyResetCredentials
} from '../lib/security';

interface LockScreenProps {
  onUnlockSuccess: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlockSuccess }) => {
  const isTrusted = isDeviceTrusted24h();
  const [authMode, setAuthMode] = useState<'pin' | 'password'>(isTrusted ? 'pin' : 'password');
  
  // PIN Mode State
  const [pin, setPin] = useState<string>('');
  
  // Password Mode State
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  
  // Common UI State
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [lockoutStatus, setLockoutStatus] = useState(getLockoutStatus());

  // Emergency Recovery Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [recoverySuccess, setRecoverySuccess] = useState<boolean>(false);

  // Poll lockout timer every second if locked
  useEffect(() => {
    const timer = setInterval(() => {
      const status = getLockoutStatus();
      setLockoutStatus(status);
      if (!status.isLocked && errorMsg.includes('locked')) {
        setErrorMsg('');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [errorMsg]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Submit PIN Handler
  const handlePinSubmit = useCallback(async (pinToTest: string) => {
    if (pinToTest.length !== 6 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const isValid = await verifyPin(pinToTest);
      if (isValid) {
        recordSuccessfulAuth(false, false);
        onUnlockSuccess();
      } else {
        triggerShake();
        setPin('');
        const status = getLockoutStatus();
        if (status.isLocked) {
          setErrorMsg(`System locked for ${Math.ceil(status.remainingSeconds / 60)}m due to multiple failed attempts.`);
        } else {
          setErrorMsg(`Incorrect PIN. ${5 - status.attempts} attempts remaining.`);
        }
      }
    } catch (err: any) {
      setErrorMsg('Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onUnlockSuccess]);

  // Handle PIN Numpad Clicks
  const handlePinClick = (digit: string) => {
    if (lockoutStatus.isLocked || isSubmitting) return;
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 6) {
        handlePinSubmit(nextPin);
      }
    }
  };

  const handlePinBackspace = () => {
    if (lockoutStatus.isLocked || isSubmitting) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handlePinClear = () => {
    if (lockoutStatus.isLocked || isSubmitting) return;
    setPin('');
    setErrorMsg('');
  };

  // Keyboard support for PIN entry
  useEffect(() => {
    if (authMode !== 'pin' || showEmergencyModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockoutStatus.isLocked) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePinClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handlePinClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authMode, pin, lockoutStatus.isLocked, showEmergencyModal, handlePinClick]);

  // Submit Master Password Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isSubmitting || lockoutStatus.isLocked) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const isValid = await verifyMasterPassword(password);
      if (isValid) {
        recordSuccessfulAuth(true, trustDevice);
        onUnlockSuccess();
      } else {
        triggerShake();
        const status = getLockoutStatus();
        if (status.isLocked) {
          setErrorMsg(`System locked for ${Math.ceil(status.remainingSeconds / 60)}m due to multiple failed attempts.`);
        } else {
          setErrorMsg(`Incorrect Master Password. ${5 - status.attempts} attempts remaining.`);
        }
      }
    } catch (err: any) {
      setErrorMsg('Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Emergency Reset Handler
  const handleEmergencyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryKey.trim()) {
      setRecoveryError('Please enter your Master Emergency Recovery Key.');
      return;
    }
    if (newPassword.length < 8) {
      setRecoveryError('New Master Password must be at least 8 characters long.');
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      setRecoveryError('New PIN must be exactly 6 numeric digits.');
      return;
    }

    const res = await emergencyResetCredentials(recoveryKey, newPassword, newPin);
    if (res.success) {
      setRecoverySuccess(true);
      setTimeout(() => {
        setShowEmergencyModal(false);
        setRecoverySuccess(false);
        setAuthMode('password');
        setPassword(newPassword);
        recordSuccessfulAuth(true, true);
        onUnlockSuccess();
      }, 1200);
    } else {
      setRecoveryError(res.error || 'Invalid Emergency Recovery Key.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 overflow-y-auto">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Card */}
      <div
        className={`relative w-full max-w-md rounded-3xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 transition-all ${
          isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/20 bg-slate-950 p-1 mx-auto">
              <img
                src="./emblem-logo.jpg"
                alt="AntFinServ Royal Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md">
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            ANTFINSERV <span className="text-amber-400">COCKPIT</span>
          </h1>

          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
              ARN-94204
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Wealth OS Security Vault
            </span>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutStatus.isLocked && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm mb-1">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              Security Lockdown Active
            </div>
            <p className="text-xs text-rose-300/80 mb-2">
              Maximum failed attempts reached. Access paused for protection.
            </p>
            <div className="text-xl font-mono font-bold text-rose-400">
              {Math.floor(lockoutStatus.remainingSeconds / 60)}:
              {(lockoutStatus.remainingSeconds % 60).toString().padStart(2, '0')}
            </div>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
            >
              Emergency Advisor Unlock (EMK)
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && !lockoutStatus.isLocked && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        {!lockoutStatus.isLocked && (
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'pin'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Quick 6-Digit PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'password'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Master Password
            </button>
          </div>
        )}

        {/* MODE 1: 6-DIGIT QUICK PIN */}
        {authMode === 'pin' && !lockoutStatus.isLocked && (
          <div>
            {/* PIN Dots Indicator */}
            <div className="flex justify-center items-center gap-3.5 mb-6 py-2">
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pin.length > idx
                      ? 'bg-amber-400 scale-125 shadow-md shadow-amber-500/50'
                      : 'border-2 border-slate-700 bg-slate-950/50'
                  }`}
                />
              ))}
            </div>

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[280px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinClick(num.toString())}
                  disabled={isSubmitting}
                  className="h-12 sm:h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-amber-500 active:text-slate-950 border border-slate-700 text-white font-bold text-lg sm:text-xl transition-all flex items-center justify-center shadow-xs"
                >
                  {num}
                </button>
              ))}

              {/* Clear (C) */}
              <button
                type="button"
                onClick={handlePinClear}
                disabled={isSubmitting}
                className="h-12 sm:h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase transition-all flex items-center justify-center"
              >
                Clear
              </button>

              {/* Zero (0) */}
              <button
                type="button"
                onClick={() => handlePinClick('0')}
                disabled={isSubmitting}
                className="h-12 sm:h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-amber-500 active:text-slate-950 border border-slate-700 text-white font-bold text-lg sm:text-xl transition-all flex items-center justify-center shadow-xs"
              >
                0
              </button>

              {/* Backspace (⌫) */}
              <button
                type="button"
                onClick={handlePinBackspace}
                disabled={isSubmitting}
                className="h-12 sm:h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-500">
              Enter 6-digit numeric PIN to unlock
            </p>
          </div>
        )}

        {/* MODE 2: MASTER PASSWORD */}
        {authMode === 'password' && !lockoutStatus.isLocked && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Principal Advisor Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter master password..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 24h Trust Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={e => setTrustDevice(e.target.checked)}
                className="mt-0.5 rounded-sm border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20"
              />
              <span>
                Trust this device for <strong className="text-amber-400">24 Hours</strong> (Enables 1-tap PIN unlock for the rest of today).
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4 stroke-[2.5]" />
                  Unlock Cockpit
                </>
              )}
            </button>
          </form>
        )}

        {/* Forgot Password / Emergency Recovery Footer CTA */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowEmergencyModal(true)}
            className="hover:text-amber-400 transition-colors font-medium underline-offset-2 hover:underline"
          >
            Forgot Password / Emergency Reset?
          </button>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            End-to-End Vault
          </span>
        </div>
      </div>

      {/* EMERGENCY RECOVERY & RESET MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    Advisor Emergency Recovery
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reset Master Credentials via Emergency Master Key (EMK)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-500 hover:text-slate-300 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {recoverySuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-white font-bold text-lg">
                  Credentials Reset Successfully!
                </h4>
                <p className="text-xs text-slate-400">
                  Lockout removed. Unlocking your Cockpit platform now...
                </p>
              </div>
            ) : (
              <form onSubmit={handleEmergencyReset} className="space-y-4">
                {recoveryError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                  <strong>Zero Data Loss Guarantee:</strong> Using your Emergency Recovery Key will clear any lockout without wiping client folios or portfolio data.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Emergency Master Recovery Key (EMK)
                  </label>
                  <input
                    type="text"
                    value={recoveryKey}
                    onChange={e => setRecoveryKey(e.target.value)}
                    placeholder="Enter confidential Emergency Recovery Key..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      New Master Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      New 6-Digit PIN
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Verify Key & Reset Platform Access
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
