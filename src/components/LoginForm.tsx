import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatAuthError } from '../api/authClient';
import { User, Lock, LogIn, KeyRound, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
  onSwitchToRecover: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister, onSwitchToRecover }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError(formatAuthError('Please enter your username and password'));
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        username: username.trim(),
        password,
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
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-1.5">
        <label htmlFor="login-username" className="text-xs font-mono font-medium text-slate-300">
          RESERVED USERNAME
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="login-username"
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

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-xs font-mono font-medium text-slate-300">
            PASSWORD
          </label>
          <button
            type="button"
            onClick={onSwitchToRecover}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded-md px-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>Use Recovery Key?</span>
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 rounded-lg focus:text-indigo-400"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090E] focus-visible:outline-none"
      >
        {isSubmitting ? (
          <span>Authenticating Argon2id...</span>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>Authenticate Identity</span>
          </>
        )}
      </button>

      {/* Switch to Register */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-xs text-slate-400 hover:text-indigo-300 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded-md px-1"
        >
          New to OurVerse? <span className="text-indigo-400 underline font-semibold">Reserve Your Identity</span>
        </button>
      </div>
    </form>
  );
};
