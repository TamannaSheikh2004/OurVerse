import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, KeyRound, Lock, RotateCcw, AlertTriangle } from 'lucide-react';

interface RecoverFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

export const RecoverForm: React.FC<RecoverFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { recover } = useAuth();
  const [username, setUsername] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !recoveryKey.trim() || !newPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
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
      setError(err.message || 'Password recovery failed');
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
        <label className="text-xs font-mono font-medium text-slate-300">
          RESERVED USERNAME <span className="text-indigo-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. starlight_explorer"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-600 focus:ring-0"
          />
        </div>
      </div>

      {/* Recovery Key Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono font-medium text-slate-300">
          RECOVERY KEY <span className="text-indigo-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            value={recoveryKey}
            onChange={(e) => setRecoveryKey(e.target.value)}
            placeholder="OUR-XXXX-XXXX-XXXX-XXXX"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono uppercase tracking-wider placeholder:normal-case placeholder:text-slate-600 focus:ring-0"
          />
        </div>
      </div>

      {/* New Password & Confirm Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-medium text-slate-300">
            NEW PASSWORD <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono font-medium text-slate-300">
            CONFIRM NEW PASSWORD <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
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
          className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
        >
          Remember your password? <span className="text-indigo-400 underline font-semibold">Sign In</span>
        </button>
      </div>
    </form>
  );
};
