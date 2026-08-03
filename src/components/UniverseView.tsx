import React, { useState, useEffect } from 'react';
import { UniverseDetails } from '../types/universe';
import { fetchUniverseDetails } from '../api/universeClient';
import { useAuth } from '../context/AuthContext';
import { UniverseChat } from './UniverseChat';
import { ArrowLeft, Orbit, Users, ShieldCheck } from 'lucide-react';

interface UniverseViewProps {
  universeId: string;
  onBack: () => void;
}

export const UniverseView: React.FC<UniverseViewProps> = ({ universeId, onBack }) => {
  const { user: currentUser } = useAuth();
  const [details, setDetails] = useState<UniverseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchUniverseDetails(universeId);
        setDetails(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load Universe details');
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [universeId]);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 text-center space-y-3">
        <Orbit className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
        <p className="text-xs font-mono tracking-widest text-slate-400">INITIALIZING SHARED UNIVERSE...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4 pt-8">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
          {error || 'Universe not found'}
        </div>
        <button
          onClick={onBack}
          className="mx-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Universes</span>
        </button>
      </div>
    );
  }

  const peerMember = details.members.find((m) => m.username !== currentUser?.username) || details.members[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Top Navigation Back Action & Mutual Consent Badge */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>MUTUAL CONSENT VERIFIED</span>
        </div>
      </div>

      {/* Main Universe Hero Banner */}
      <div className="relative rounded-3xl glass-panel glass-panel-glow p-6 sm:p-8 overflow-hidden shadow-2xl border border-white/10 space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 nebula-cyan rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Peer Avatar */}
          {peerMember.avatar ? (
            <img
              src={peerMember.avatar}
              alt={peerMember.displayName}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-500/40 shadow-xl shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-extrabold ring-2 ring-cyan-500/40 shadow-xl shrink-0">
              {peerMember.displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Universe Header Text */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                {details.universeId}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Created: {new Date(details.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Shared Universe: <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">{peerMember.displayName}</span>
            </h1>

            <p className="text-xs text-slate-300 font-mono">
              Peer Explorer: <strong className="text-cyan-300">@{peerMember.username}</strong>
            </p>
          </div>
        </div>

        {/* Universe Members List Section */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Universe Members ({details.members.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {details.members.map((member) => (
              <div
                key={member.username}
                className="p-3.5 rounded-2xl bg-[#07090E]/60 border border-white/5 flex items-center gap-3"
              >
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.displayName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{member.displayName}</div>
                  <div className="text-[11px] font-mono text-indigo-400 truncate">@{member.username}</div>
                </div>

                {member.username === currentUser?.username && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SPRINT 4.0 REAL-TIME MESSAGING INTERFACE */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest px-1">
          REAL-TIME UNIVERSE COMMUNICATION STREAM
        </h2>
        <UniverseChat
          universeId={details.universeId}
          dbUniverseId={details.id || details.universeId}
          peerUser={peerMember}
        />
      </div>

    </div>
  );
};
