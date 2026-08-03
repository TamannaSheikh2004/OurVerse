import React, { useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { LoginForm } from './LoginForm';
import { RecoverForm } from './RecoverForm';
import { ShieldCheck, UserPlus, LogIn, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const [tab, setTab] = useState<'register' | 'login' | 'recover'>('register');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-3xl glass-panel glass-panel-glow p-6 sm:p-8 space-y-6 shadow-2xl border border-white/10">
        
        {/* Header Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {tab === 'register' && 'Create Identity'}
                {tab === 'login' && 'Identity Authentication'}
                {tab === 'recover' && 'Password Recovery'}
              </h2>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#07090E]/60 border border-white/5">
            <button
              onClick={() => setTab('register')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>

            <button
              onClick={() => setTab('login')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => setTab('recover')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'recover'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Recover</span>
            </button>
          </div>
        </div>

        {/* Tab Form Views */}
        <div className="pt-1">
          {tab === 'register' && (
            <RegisterForm
              onSwitchToLogin={() => setTab('login')}
            />
          )}

          {tab === 'login' && (
            <LoginForm
              onSwitchToRegister={() => setTab('register')}
              onSwitchToRecover={() => setTab('recover')}
            />
          )}

          {tab === 'recover' && (
            <RecoverForm
              onSwitchToLogin={() => setTab('login')}
            />
          )}
        </div>

      </div>
    </div>
  );
};
