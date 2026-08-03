import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { BackgroundStars } from './components/BackgroundStars';
import { Navbar, NavTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { RecoveryKeyModal } from './components/RecoveryKeyModal';
import { ProfileDashboard } from './components/ProfileDashboard';
import { UniversesDashboard } from './components/UniversesDashboard';
import { SearchPage } from './components/SearchPage';
import { InvitationsPage } from './components/InvitationsPage';
import { UniverseView } from './components/UniverseView';
import { Orbit, ShieldCheck, Lock, Sparkles, KeyRound } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, isLoading, recoveryKey, clearRecoveryKey } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);

  const handleOpenUniverse = (universeId: string) => {
    setSelectedUniverseId(universeId);
  };

  const handleBackToDashboard = () => {
    setSelectedUniverseId(null);
    setCurrentTab('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center text-slate-300">
        <BackgroundStars />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Orbit className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-xs font-mono tracking-widest text-slate-400">INITIALIZING OURVERSE ENGINE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col relative">
      <BackgroundStars />
      <Navbar
        currentTab={selectedUniverseId ? 'dashboard' : currentTab}
        onSelectTab={(tab) => {
          setSelectedUniverseId(null);
          setCurrentTab(tab);
        }}
      />

      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col justify-start">
        
        {/* Recovery Key Display Modal when newly generated */}
        {recoveryKey && (
          <RecoveryKeyModal
            recoveryKey={recoveryKey}
            onClose={() => clearRecoveryKey()}
          />
        )}

        {user ? (
          // Authenticated User View Router
          <div className="w-full">
            {selectedUniverseId ? (
              <UniverseView
                universeId={selectedUniverseId}
                onBack={handleBackToDashboard}
              />
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <UniversesDashboard
                    onEnterUniverse={handleOpenUniverse}
                    onGoToSearch={() => setCurrentTab('search')}
                  />
                )}

                {currentTab === 'search' && (
                  <SearchPage
                    onEnterUniverse={handleOpenUniverse}
                    onInvitationSent={() => setCurrentTab('invitations')}
                  />
                )}

                {currentTab === 'invitations' && (
                  <InvitationsPage
                    onUniverseCreated={handleOpenUniverse}
                  />
                )}

                {currentTab === 'profile' && (
                  <ProfileDashboard />
                )}
              </>
            )}
          </div>
        ) : (
          // Unauthenticated Hero & Auth Container
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-6 sm:py-12">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>OURVERSE UNIVERSE CONNECTION ENGINE</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Privacy-First Communication. <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                  Shared Universes. Mutual Consent.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Connect using only a reserved username. Search for explorers, send Universe Invitations, and enter private Shared Universes built on mutual consent.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
                <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Zero PII Required</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    No email or phone requested. Total anonymity.
                  </p>
                </div>

                <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Mutual Consent</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Universes exist only when both users agree.
                  </p>
                </div>

                <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Argon2id Security</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    State-of-the-art key derivation & transaction safety.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Auth Card Column */}
            <div className="lg:col-span-5 w-full">
              <AuthModal />
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 py-6 px-4 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OURVERSE PROTOCOL • UNIVERSE CONNECTION ENGINE</span>
          <span className="text-indigo-400/80">ARGON2ID • PRISMA • REACT • TAILWIND</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return <AppContent />;
}

export default App;
