import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatAuthError } from '../api/authClient';
import { User, KeyRound, Lock, RotateCcw, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface RecoverFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

/**
 * Formats user input into standard OUR-XXXX-XXXX-XXXX-XXXX uppercase Recovery Key format.
 */
function formatRecoveryKey(input: string): string {
  const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!cleaned) return '';

  let hexChars = cleaned;
  if (cleaned.startsWith('OUR')) {
    hexChars = cleaned.slice(3);
  }

  if (hexChars.length === 0) {
    if (cleaned === 'O' || cleaned === 'OU' || cleaned === 'OUR') {
      return 'OUR-';
    }
    return '';
  }

  const trimmed = hexChars.slice(0, 16);
  const chunks: string[] = [];
  for (let i = 0; i < trimmed.length; i += 4) {
    chunks.push(trimmed.slice(i, i + 4));
  }

  return `OUR-${chunks.join('-')}`;
}

export const RecoverForm: React.FC<RecoverFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { recover } = useAuth();
  const [username, setUsername] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecoveryKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setRecoveryKey('');
      return;
    }
    setRecoveryKey(formatRecoveryKey(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !recoveryKey.trim() || !newPassword) {
      setError(formatAuthError('All fields are required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(formatAuthError('New passwords do not match'));
      return;
    }

    if (newPassword.length < 6) {
      setError(formatAuthError('New password must be at least 6 characters'));
      return;
    }

    try {
      setIsSubmitting(true);
      await recover({
        username: username.trim(),
        recoveryKey: recoveryKey.trim().toUpperCase(),
        newPassword,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informational Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Emergency Identity Recovery:</span> Enter your reserved username and your 16-character recovery key (`OUR-XXXX-XXXX-XXXX-XXXX`).
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-1.5">
        <label htmlFor="recover-username" className="text-xs font-mono font-medium text-slate-300">
          RESERVED USERNAME <span className="text-indigo-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="recover-username"
            name="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. starlight_explorer"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Recovery Key Field */}
      <div className="space-y-1.5">
        <label htmlFor="recover-key" className="text-xs font-mono font-medium text-slate-300">
          RECOVERY KEY <span className="text-indigo-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            id="recover-key"
            name="recoveryKey"
            type="text"
            required
            value={recoveryKey}
            onChange={handleRecoveryKeyChange}
            placeholder="OUR-XXXX-XXXX-XXXX-XXXX"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono uppercase tracking-wider placeholder:normal-case placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* New Password & Confirm Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="recover-newpassword" className="text-xs font-mono font-medium text-slate-300">
            NEW PASSWORD <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="recover-newpassword"
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 rounded-lg focus:text-indigo-400"
            >
              {showNewPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="recover-confirmpassword" className="text-xs font-mono font-medium text-slate-300">
            CONFIRM NEW PASSWORD <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="recover-confirmpassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 rounded-lg focus:text-indigo-400"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090E] focus-visible:outline-none"
      >
        {isSubmitting ? (
          <span>Verifying Argon2id Recovery Key...</span>
        ) : (
          <>
            <RotateCcw className="w-4 h-4" />
            <span>Reset Password & Re-key Identity</span>
          </>
        )}
      </button>

      {/* Back to Login */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs text-slate-400 hover:text-indigo-300 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded-md px-1"
        >
          Remember your password? <span className="text-indigo-400 underline font-semibold">Sign In</span>
        </button>
      </div>
    </form>
  );
};
