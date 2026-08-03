import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Shield, Lock, Trash2, Edit2, Check, Sparkles, AlertTriangle, Key } from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=150&auto=format&fit=crop&q=80',
];

export const ProfileDashboard: React.FC = () => {
  const { user, updateUserProfile, deleteUserAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || AVATAR_PRESETS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const finalAvatar = customAvatar.trim() || avatarUrl;
      await updateUserProfile(displayName.trim() || undefined, finalAvatar);
      setIsEditing(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteUserAccount();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner Identity Header */}
      <div className="relative rounded-3xl glass-panel glass-panel-glow p-6 sm:p-8 overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 nebula-indigo rounded-full blur-3xl opacity-40 pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Display */}
          <div className="relative group">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-24 h-24 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl ring-2 ring-indigo-500/50">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0F1523] flex items-center justify-center" title="Identity Active">
              <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />
            </div>
          </div>

          {/* User Information */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user.displayName}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <span className="font-mono text-indigo-400 font-semibold text-sm">@{user.username}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                    PERMANENTLY RESERVED
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all self-center sm:self-auto"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Edit Identity</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Identity Initialized: {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium text-center">
            {message}
          </div>
        )}
      </div>

      {/* Edit Profile Panel */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="rounded-3xl glass-panel p-6 space-y-4 border border-indigo-500/30 animate-fade-in">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Customize Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">DISPLAY NAME</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">AVATAR PRESET OR URL</label>
              <input
                type="url"
                value={customAvatar}
                onChange={(e) => setCustomAvatar(e.target.value)}
                placeholder="Custom Image URL"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-400">CHOOSE PRESET AVATAR</label>
            <div className="flex gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(preset);
                    setCustomAvatar('');
                  }}
                  className={`w-12 h-12 rounded-xl overflow-hidden border transition-all ${
                    avatarUrl === preset && !customAvatar ? 'border-indigo-400 ring-2 ring-indigo-500/40' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Security & Cryptography Technical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Argon2id Password & Recovery Key Security */}
        <div className="rounded-3xl glass-panel p-6 space-y-3 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Argon2id Hashing Engine</h3>
              <p className="text-[11px] text-slate-400 font-mono">ENCRYPTED CREDENTIAL PROTECTION</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your password and recovery key are salted and hashed using <strong>Argon2id</strong> (winner of the Password Hashing Competition). Raw keys are never stored on disk.
          </p>
          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/5">
            <span>Memory Cost: 64MB</span>
            <span>Parallelism: 1</span>
          </div>
        </div>

        {/* Card 2: Permanent Username Reservation Rule */}
        <div className="rounded-3xl glass-panel p-6 space-y-3 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Immutable Identity Protocol</h3>
              <p className="text-[11px] text-slate-400 font-mono">NON-REUSABLE RESERVED USERNAMES</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your username <strong className="text-cyan-300">@{user.username}</strong> is permanently reserved in our tombstone database. Even if this account is deleted, your username can never be claimed by anyone else.
          </p>
          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/5">
            <span>PII Collection: ZERO</span>
            <span>Status: PERMANENT</span>
          </div>
        </div>

      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="rounded-3xl glass-panel p-6 border border-rose-500/20 bg-rose-500/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Danger Zone: Purge Account</span>
            </h3>
            <p className="text-xs text-slate-400">
              Permanently delete user profile data while maintaining username reservation.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all self-start sm:self-auto"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090E]/90 backdrop-blur-xl">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 space-y-5 border border-rose-500/30 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete your account? Your user data will be deleted.
            </p>
            
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <strong>Permanent Reservation Rule:</strong> Your username <span className="font-mono text-white font-bold">@{user.username}</span> will remain reserved forever in our tombstone database and will <strong>NEVER</strong> be available for re-registration.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30"
              >
                {isDeleting ? 'Purging Account...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
