import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Sparkles, Image, ShieldAlert, ArrowRight, Check } from 'lucide-react';

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
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
      setError(err.message || 'Registration failed');
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
        <label className="text-xs font-mono font-medium text-slate-300 flex items-center justify-between">
          <span>RESERVED USERNAME <span className="text-indigo-400">*</span></span>
          <span className="text-[10px] text-slate-500">Permanent & Immutable</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="e.g. starlight_explorer"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-600 focus:ring-0"
          />
        </div>
      </div>

      {/* Optional Display Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono font-medium text-slate-300 flex items-center justify-between">
          <span>DISPLAY NAME <span className="text-slate-500">(OPTIONAL)</span></span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Captain Orion"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-600 focus:ring-0"
          />
        </div>
      </div>

      {/* Password & Confirm Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-medium text-slate-300">
            PASSWORD <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono font-medium text-slate-300">
            CONFIRM PASSWORD <span className="text-indigo-400">*</span>
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

      {/* Optional Cosmic Avatar Selector */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-mono font-medium text-slate-300 flex items-center justify-between">
          <span>COSMIC AVATAR <span className="text-slate-500">(OPTIONAL)</span></span>
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
              className={`relative rounded-xl overflow-hidden aspect-square border transition-all ${
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
          <div className="absolute inset-y-0 left-0 pt-1 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Image className="w-3.5 h-3.5" />
          </div>
          <input
            type="url"
            value={customAvatar}
            onChange={(e) => setCustomAvatar(e.target.value)}
            placeholder="Or paste custom image URL (https://...)"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 group"
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
          className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
        >
          Already have an identity? <span className="text-indigo-400 underline font-semibold">Sign In</span>
        </button>
      </div>
    </form>
  );
};
