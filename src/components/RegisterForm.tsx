import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatAuthError } from '../api/authClient';
import { User, Lock, Sparkles, Image, ShieldAlert, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

const PRESET_AVATARS = [
  { name: 'Stellar Nebula', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=150&auto=format&fit=crop&q=80' },
  { name: 'Cosmic Galaxy', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=80' },
  { name: 'Deep Eclipse', url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=150&auto=format&fit=crop&q=80' },
  { name: 'Supernova', url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=150&auto=format&fit=crop&q=80' },
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError(formatAuthError('Username and password are required'));
      return;
    }

    if (password !== confirmPassword) {
      setError(formatAuthError('Passwords do not match'));
      return;
    }

    if (password.length < 6) {
      setError(formatAuthError('Password must be at least 6 characters'));
      return;
    }

    try {
      setIsSubmitting(true);
      const finalAvatar = customAvatar.trim() || avatarUrl;
      await register({
        username: username.trim(),
        password,
        displayName: displayName.trim() || undefined,
        avatarUrl: finalAvatar || undefined,
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
      {/* Privacy Guarantee Alert */}
      <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Privacy Guarantee:</span> We never ask for email, phone number, or real name. Your username is permanently reserved for your identity.
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-1.5">
        <label htmlFor="register-username" className="text-xs font-mono font-medium text-slate-300 flex items-center justify-between">
          <span>RESERVED USERNAME <span className="text-indigo-400">*</span></span>
          <span className="text-[10px] text-slate-400">Permanent & Immutable</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="register-username"
            name="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="e.g. starlight_explorer"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Optional Display Name */}
      <div className="space-y-1.5">
        <label htmlFor="register-displayname" className="text-xs font-mono font-medium text-slate-300 flex items-center justify-between">
          <span>DISPLAY NAME <span className="text-slate-400">(OPTIONAL)</span></span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            id="register-displayname"
            name="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Captain Orion"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Password & Confirm Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-xs font-mono font-medium text-slate-300">
            PASSWORD <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-password"
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

        <div className="space-y-1.5">
          <label htmlFor="register-confirmpassword" className="text-xs font-mono font-medium text-slate-300">
            CONFIRM PASSWORD <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-confirmpassword"
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

      {/* Optional Cosmic Avatar Selector */}
      <div className="space-y-2 pt-1">
        <label htmlFor="register-customavatar" className="text-xs font-mono font-medium text-slate-300 flex items-center justify-between">
          <span>COSMIC AVATAR <span className="text-slate-400">(OPTIONAL)</span></span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AVATARS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setAvatarUrl(preset.url);
                setCustomAvatar('');
              }}
              className={`relative rounded-xl overflow-hidden aspect-square border transition-all focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                avatarUrl === preset.url && !customAvatar
                  ? 'border-indigo-400 ring-2 ring-indigo-500/30 scale-95'
                  : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
              }`}
            >
              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
              {avatarUrl === preset.url && !customAvatar && (
                <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="relative pt-1">
          <div className="absolute inset-y-0 left-0 pt-1 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Image className="w-3.5 h-3.5" />
          </div>
          <input
            id="register-customavatar"
            name="customAvatar"
            type="url"
            value={customAvatar}
            onChange={(e) => setCustomAvatar(e.target.value)}
            placeholder="Or paste custom image URL (https://...)"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 group focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090E] focus-visible:outline-none"
      >
        {isSubmitting ? (
          <span>Creating Identity & Argon2id Hash...</span>
        ) : (
          <>
            <span>Launch Identity into OurVerse</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      {/* Switch to Login */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs text-slate-400 hover:text-indigo-300 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none rounded-md px-1"
        >
          Already have an identity? <span className="text-indigo-400 underline font-semibold">Sign In</span>
        </button>
      </div>
    </form>
  );
};
