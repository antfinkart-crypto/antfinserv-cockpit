// AntFinServ Cockpit - Universal Security & Cryptographic Gatekeeper Engine
// Provides salted SHA-256 credential hashing, rate limiting, emergency recovery, and 24h device trust.

const APP_SALT = 'ANTFINSERV_SALT_v1_94204';

const DEFAULT_PWD_HASH = '8b2e53c73909accffd674844b290866777ec6c80fe9020ff6d63e55d02cc1644';
const DEFAULT_PIN_HASH = '337ccac25ca9d3112419db5291c0346b6b8223faa9fb603728d3b5f351484487';
const DEFAULT_EMK_HASH = '4e330f007dbe1dbcb06432435f07d783cc1a5ffa75ea9bba815111ba7f54f77e';

const STORAGE_KEYS = {
  PWD_HASH: 'antfinserv_sec_pwd_hash',
  PIN_HASH: 'antfinserv_sec_pin_hash',
  EMK_HASH: 'antfinserv_sec_emk_hash',
  AUTOLOCK_MINS: 'antfinserv_sec_autolock_mins',
  DEVICE_TRUST_UNTIL: 'antfinserv_sec_device_trust_until',
  FAILED_ATTEMPTS: 'antfinserv_sec_failed_attempts',
  LOCKOUT_UNTIL: 'antfinserv_sec_lockout_until',
  SESSION_ACTIVE: 'antfinserv_sec_session_active'
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Computes salted SHA-256 hash using native Web Crypto API.
 */
export async function hashCredential(value: string, salt: string = APP_SALT): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(value.trim() + salt);
  
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gets the current active Master Password Hash.
 */
function getActivePasswordHash(): string {
  return localStorage.getItem(STORAGE_KEYS.PWD_HASH) || DEFAULT_PWD_HASH;
}

/**
 * Gets the current active PIN Hash.
 */
function getActivePinHash(): string {
  return localStorage.getItem(STORAGE_KEYS.PIN_HASH) || DEFAULT_PIN_HASH;
}

/**
 * Gets the current active Emergency Master Key Hash.
 */
function getActiveEmergencyKeyHash(): string {
  return localStorage.getItem(STORAGE_KEYS.EMK_HASH) || DEFAULT_EMK_HASH;
}

/**
 * Checks lockout status due to brute-force attempts.
 */
export function getLockoutStatus(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  const attempts = parseInt(localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS) || '0', 10);
  const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL) || '0', 10);
  const now = Date.now();

  if (lockoutUntil > now) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return { isLocked: true, remainingSeconds, attempts };
  }

  // Lockout expired, reset if needed
  if (lockoutUntil > 0 && lockoutUntil <= now) {
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, '0');
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  return { isLocked: false, remainingSeconds: 0, attempts };
}

/**
 * Increments failed attempt count and triggers 5-minute lockout if threshold reached.
 */
export function recordFailedAttempt(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  const currentAttempts = parseInt(localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS) || '0', 10) + 1;
  localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, currentAttempts.toString());

  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_MS;
    localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
    return { isLocked: true, remainingSeconds: 300, attempts: currentAttempts };
  }

  return { isLocked: false, remainingSeconds: 0, attempts: currentAttempts };
}

/**
 * Resets lockout and failed attempt counters.
 */
export function resetLockout(): void {
  localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, '0');
}

/**
 * Verifies Master Password against active salted hash.
 */
export async function verifyMasterPassword(password: string): Promise<boolean> {
  const lockout = getLockoutStatus();
  if (lockout.isLocked) return false;

  const inputHash = await hashCredential(password);
  const valid = inputHash === getActivePasswordHash();

  if (valid) {
    resetLockout();
  } else {
    recordFailedAttempt();
  }

  return valid;
}

/**
 * Verifies 6-Digit Quick PIN against active salted hash.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const lockout = getLockoutStatus();
  if (lockout.isLocked) return false;

  const inputHash = await hashCredential(pin);
  const valid = inputHash === getActivePinHash();

  if (valid) {
    resetLockout();
  } else {
    recordFailedAttempt();
  }

  return valid;
}

/**
 * Verifies Emergency Recovery Key.
 * Notice: This intentionally bypasses brute-force lockout so the owner can always recover.
 */
export async function verifyEmergencyKey(key: string): Promise<boolean> {
  const inputHash = await hashCredential(key.trim());
  return inputHash === getActiveEmergencyKeyHash();
}

/**
 * Emergency reset of Master Password & PIN using the Emergency Recovery Key.
 * Resets lockouts, sets new hashes, and generates a fresh session.
 */
export async function emergencyResetCredentials(
  recoveryKey: string,
  newPassword: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const isKeyValid = await verifyEmergencyKey(recoveryKey);
  if (!isKeyValid) {
    return { success: false, error: 'Invalid Master Emergency Recovery Key. Please check and try again.' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New Master Password must be at least 8 characters long.' };
  }

  if (!/^\d{6}$/.test(newPin)) {
    return { success: false, error: 'New Quick PIN must be exactly 6 numeric digits.' };
  }

  const newPwdHash = await hashCredential(newPassword);
  const newPinHash = await hashCredential(newPin);

  localStorage.setItem(STORAGE_KEYS.PWD_HASH, newPwdHash);
  localStorage.setItem(STORAGE_KEYS.PIN_HASH, newPinHash);
  resetLockout();

  return { success: true };
}

/**
 * Updates Master Password from authenticated settings.
 */
export async function updateMasterPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const isCurrentValid = await verifyMasterPassword(currentPassword);
  if (!isCurrentValid) {
    return { success: false, error: 'Current password does not match.' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  const newHash = await hashCredential(newPassword);
  localStorage.setItem(STORAGE_KEYS.PWD_HASH, newHash);
  return { success: true };
}

/**
 * Updates 6-Digit Quick PIN from authenticated settings.
 */
export async function updatePin(newPin: string): Promise<{ success: boolean; error?: string }> {
  if (!/^\d{6}$/.test(newPin)) {
    return { success: false, error: 'PIN must be exactly 6 numeric digits.' };
  }

  const newHash = await hashCredential(newPin);
  localStorage.setItem(STORAGE_KEYS.PIN_HASH, newHash);
  return { success: true };
}

/**
 * Checks if this device is trusted for the next 24 hours.
 */
export function isDeviceTrusted24h(): boolean {
  const trustUntil = parseInt(localStorage.getItem(STORAGE_KEYS.DEVICE_TRUST_UNTIL) || '0', 10);
  return trustUntil > Date.now();
}

/**
 * Records successful authentication and sets session/trust states.
 */
export function recordSuccessfulAuth(isFullPasswordAuth: boolean, trustDevice24h: boolean = false): void {
  resetLockout();
  sessionStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, 'true');

  if (isFullPasswordAuth && trustDevice24h) {
    const trustUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.DEVICE_TRUST_UNTIL, trustUntil.toString());
  }
}

/**
 * Returns true if the session is currently authenticated.
 */
export function isSessionAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE) === 'true';
}

/**
 * Locks the current session immediately.
 */
export function lockSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_ACTIVE);
}

/**
 * Gets configured auto-lock duration in minutes (default: 15 mins).
 */
export function getAutoLockMinutes(): number {
  const val = localStorage.getItem(STORAGE_KEYS.AUTOLOCK_MINS);
  if (val) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 15;
}

/**
 * Sets auto-lock duration in minutes (0 means never during session).
 */
export function setAutoLockMinutes(mins: number): void {
  localStorage.setItem(STORAGE_KEYS.AUTOLOCK_MINS, mins.toString());
}
