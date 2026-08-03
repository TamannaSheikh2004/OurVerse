import React, { useState } from 'react';
import { ShieldAlert, Copy, Download, Check, Key, ShieldCheck } from 'lucide-react';

interface RecoveryKeyModalProps {
  recoveryKey: string;
  onClose: () => void;
}

export const RecoveryKeyModal: React.FC<RecoveryKeyModalProps> = ({ recoveryKey, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const fileContent = `=====================================================
OURVERSE PRIVACY IDENTITY EMERGENCY RECOVERY KEY
=====================================================
Created: ${new Date().toISOString()}

RECOVERY KEY:
${recoveryKey}

IMPORTANT SECURITY NOTICE:
- Store this key in a secure location (e.g., password manager, physical safe).
- OurVerse NEVER requests email or phone numbers.
- Only the Argon2id hash of this key is saved in our database.
- If you lose your password AND this key, your account can NEVER be recovered.
=====================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ourverse-recovery-key-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090E]/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel glass-panel-glow p-6 sm:p-8 space-y-6 shadow-2xl border border-white/10">
        
        {/* Header Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0F1523] rounded-[14px] flex items-center justify-center">
              <Key className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Your Emergency Recovery Key</h2>
            <p className="text-xs text-amber-400/90 font-mono font-medium">DISPLAYED ONLY ONCE • CANNOT BE RECOVERED</p>
          </div>
        </div>

        {/* Severe Warning Callout */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>CRITICAL PRIVACY & SECURITY WARNING</span>
          </div>
          <p>
            OurVerse stores <strong>ONLY the Argon2id cryptographic hash</strong> of this key. We cannot view or send this key to you. If you lose your password, this key is your <strong>ONLY</strong> method of regaining access.
          </p>
        </div>

        {/* High Contrast Monospaced Key Display */}
        <div className="relative p-5 rounded-2xl bg-[#07090E] border border-white/10 flex flex-col items-center justify-center gap-2 shadow-inner group">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest">
            OURVERSE RECOVERY KEY
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-400 tracking-wider select-all text-center">
            {recoveryKey}
          </div>
        </div>

        {/* Action Buttons: Copy & Download */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-400" />
                <span>Copy Key</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Backup (.txt)</span>
          </button>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-slate-300 font-medium leading-tight">
            I confirm that I have safely copied or downloaded my Recovery Key. I understand it will never be shown again.
          </span>
        </label>

        {/* Proceed Button */}
        <button
          onClick={onClose}
          disabled={!confirmed}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Enter OurVerse</span>
        </button>

      </div>
    </div>
  );
};
