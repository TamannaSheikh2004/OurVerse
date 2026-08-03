import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchInvitations } from '../api/universeClient';
import { ShieldCheck, Orbit, LogOut, Search, Inbox, Sparkles, User as UserIcon } from 'lucide-react';

export type NavTab = 'dashboard' | 'search' | 'invitations' | 'profile';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function checkPending() {
      try {
        const data = await fetchInvitations();
        const pending = data.received.filter((i) => i.status === 'PENDING').length;
        setPendingCount(pending);
      } catch (err) {
        // Silent catch
      }
    }

    checkPending();
    const interval = setInterval(checkPending, 10000);
    return () => clearInterval(interval);
  }, [user, currentTab]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090E]/85 backdrop-blur-md px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div
          onClick={() => user && onSelectTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0F1523] rounded-[10px] flex items-center justify-center transition-transform group-hover:scale-95">
              <Orbit className="w-5 h-5 text-indigo-400 animate-spin-slow group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 font-sans">
                OurVerse
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.0 ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Universe Connection Engine</p>
          </div>
        </div>

        {/* Center Navigation Links for Authenticated Users */}
        {user && (
          <nav className="flex items-center gap-1 p-1 rounded-2xl bg-[#07090E]/80 border border-white/10 shadow-inner">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Universes</span>
            </button>

            <button
              onClick={() => onSelectTab('search')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'search'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Search</span>
            </button>

            <button
              onClick={() => onSelectTab('invitations')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                currentTab === 'invitations'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Invitations</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-400 text-[#07090E] text-[10px] font-bold shrink-0">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {/* User Profile & Logout Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onSelectTab('profile')}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium text-slate-200 group ${
                  currentTab === 'profile'
                    ? 'bg-white/10 border-indigo-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/20 group-hover:ring-indigo-400"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-100 leading-none">{user.displayName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
                </div>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>GUEST IDENTITY</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
