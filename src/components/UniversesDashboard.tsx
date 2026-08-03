import React, { useState, useEffect } from 'react';
import { UniverseListItem } from '../types/universe';
import { fetchUniversesList } from '../api/universeClient';
import { Orbit, Sparkles, ArrowRight, UserCheck, Calendar } from 'lucide-react';

interface UniversesDashboardProps {
  onEnterUniverse: (universeId: string) => void;
  onGoToSearch: () => void;
}

export const UniversesDashboard: React.FC<UniversesDashboardProps> = ({ onEnterUniverse, onGoToSearch }) => {
  const [universes, setUniverses] = useState<UniverseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUniverses() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchUniversesList();
        setUniverses(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch Universes');
      } finally {
        setIsLoading(false);
      }
    }
    loadUniverses();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 nebula-indigo rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACTIVE SHARED UNIVERSES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Your Universes
            </h1>
            <p className="text-xs text-slate-400">
              Private 1-on-1 Universes created through mutual consent.
            </p>
          </div>

          <button
            onClick={onGoToSearch}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Find Explorers</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Universes Grid & Empty State */}
      {isLoading ? (
        <div className="rounded-3xl glass-panel p-12 text-center text-slate-400 space-y-3">
          <Orbit className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-mono">SYNCHRONIZING SHARED UNIVERSES...</p>
        </div>
      ) : universes.length === 0 ? (
        
        /* REQUIRED EMPTY STATE */
        <div className="rounded-3xl glass-panel p-12 sm:p-16 text-center space-y-4 border border-white/5 animate-fade-in">
          <div className="text-6xl animate-bounce">🌌</div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight">No Universes Yet</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Search for someone and create your first Shared Universe.
            </p>
          </div>

          <button
            onClick={onGoToSearch}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/25 inline-flex items-center gap-2 transition-all mt-2"
          >
            <span>Search Explorers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      ) : (

        /* UNIVERSES CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {universes.map((item) => (
            <div
              key={item.universeId}
              className="rounded-3xl glass-panel glass-panel-glow p-6 space-y-5 border border-white/10 hover:border-indigo-500/30 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                    {item.universeId}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Peer Explorer Info */}
                <div className="flex items-center gap-3.5">
                  {item.peerUser.avatar ? (
                    <img
                      src={item.peerUser.avatar}
                      alt={item.peerUser.displayName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-md group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold ring-2 ring-indigo-500/40 shadow-md group-hover:scale-105 transition-transform">
                      {item.peerUser.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {item.peerUser.displayName}
                    </h3>
                    <p className="text-xs font-mono text-indigo-400 truncate">@{item.peerUser.username}</p>
                    <p className="text-[11px] text-slate-400 font-mono pt-0.5">Shared Universe Active</p>
                  </div>
                </div>
              </div>

              {/* Enter Universe Button */}
              <button
                onClick={() => onEnterUniverse(item.universeId)}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 text-slate-200 hover:text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-4"
              >
                <UserCheck className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
                <span>Enter Universe</span>
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
