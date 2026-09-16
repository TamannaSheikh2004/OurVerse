import React, { useState, useEffect } from 'react';
import { SearchUserResult } from '../types/universe';
import { searchUsers, sendUniverseInvitation } from '../api/universeClient';
import { Search, Sparkles, Orbit, Clock, ShieldOff, Check, X, ArrowRight, UserCheck } from 'lucide-react';

interface SearchPageProps {
  onEnterUniverse?: (universeId: string) => void;
  onInvitationSent?: () => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onEnterUniverse, onInvitationSent }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        setIsSearching(true);
        setError(null);
        const data = await searchUsers(query);
        setResults(data);
      } catch (err: any) {
        setError(err.message || 'Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSendInvitation = async () => {
    if (!selectedUser) return;
    try {
      setIsSending(true);
      setError(null);
      await sendUniverseInvitation(selectedUser.username);
      setSuccessMsg(`Universe Invitation sent to @${selectedUser.username}`);
      setSelectedUser(null);
      
      // Refresh search results
      const updated = await searchUsers(query);
      setResults(updated);
      if (onInvitationSent) onInvitationSent();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to send Universe Invitation');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 nebula-cyan rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
              <Orbit className="w-3.5 h-3.5" />
              <span>UNIVERSE CONNECTION ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Discover Explorers
            </h1>
            <p className="text-xs text-slate-400">
              Search by reserved username to send a Universe Invitation and create a private Shared Universe.
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative pt-2">
          <div className="absolute inset-y-0 left-0 pt-2 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="search-users-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reserved username (e.g. starlight_explorer)..."
            aria-label="Search by reserved username"
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input text-sm font-mono placeholder:text-slate-400 shadow-lg"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pt-2 pr-4 flex items-center">
              <Orbit className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Results Section */}
      {query.trim() && (
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase px-1">
            Search Results ({results.length})
          </h2>

          {results.length === 0 && !isSearching ? (
            <div className="rounded-3xl glass-panel p-12 text-center space-y-3 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Explorers Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No user matching <span className="font-mono text-indigo-400">@{query}</span> was found in the OurVerse registry.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((user) => (
                <div
                  key={user.username}
                  className="rounded-2xl glass-panel p-5 border border-white/10 flex items-center justify-between gap-4 transition-all hover:border-white/20"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-base font-bold shrink-0">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{user.displayName}</h3>
                      <p className="text-xs font-mono text-indigo-400 truncate">@{user.username}</p>
                    </div>
                  </div>

                  {/* Dynamic Action Button States */}
                  <div>
                    {user.relationshipStatus === 'NONE' && (
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Create Universe</span>
                      </button>
                    )}

                    {(user.relationshipStatus === 'INVITATION_SENT' || user.relationshipStatus === 'INVITATION_RECEIVED') && (
                      <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Pending</span>
                      </div>
                    )}

                    {user.relationshipStatus === 'CONNECTED' && (
                      <button
                        onClick={() => onEnterUniverse && onEnterUniverse(user.username)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Enter Universe</span>
                      </button>
                    )}

                    {user.relationshipStatus === 'BLOCKED' && (
                      <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-medium flex items-center gap-1.5 shrink-0">
                        <ShieldOff className="w-3.5 h-3.5" />
                        <span>Blocked</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE UNIVERSE CONFIRMATION DIALOG MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090E]/90 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel glass-panel-glow p-6 sm:p-8 space-y-6 shadow-2xl border border-white/10">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Create a Shared Universe</h3>
                  <p className="text-[11px] text-indigo-400 font-mono">MUTUAL CONSENT PROTOCOL</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Card */}
            <div className="p-4 rounded-2xl bg-[#07090E]/60 border border-white/5 flex items-center gap-3">
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.displayName}
                  className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-white">{selectedUser.displayName}</div>
                <div className="text-xs font-mono text-indigo-400">@{selectedUser.username}</div>
              </div>
            </div>

            {/* Required Message Text */}
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to send a Universe Invitation to <strong className="text-white">@{selectedUser.username}</strong>.
              <br /><br />
              If they accept, a new private Shared Universe will be created where only the two of you can communicate.
            </p>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSending}
                onClick={handleSendInvitation}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <span>Sending Invitation...</span>
                ) : (
                  <>
                    <span>Send Universe Invitation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
