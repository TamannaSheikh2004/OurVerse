import React, { useState, useEffect } from 'react';
import { ReceivedInvitation, SentInvitation } from '../types/universe';
import { fetchInvitations, acceptUniverseInvitation, rejectUniverseInvitation, blockUser } from '../api/universeClient';
import { Inbox, Send, Orbit, Check, X, ShieldOff, Clock, Sparkles, AlertCircle } from 'lucide-react';

interface InvitationsPageProps {
  onUniverseCreated?: (universeId: string) => void;
}

export const InvitationsPage: React.FC<InvitationsPageProps> = ({ onUniverseCreated }) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<ReceivedInvitation[]>([]);
  const [sent, setSent] = useState<SentInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchInvitations();
      setReceived(data.received);
      setSent(data.sent);
    } catch (err: any) {
      setError(err.message || 'Failed to load Universe Invitations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleAccept = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      setError(null);
      const res = await acceptUniverseInvitation(invitationId);
      setSuccessMsg('Universe created! Redirecting to Shared Universe...');
      await loadInvitations();

      if (onUniverseCreated && res.universeId) {
        setTimeout(() => onUniverseCreated(res.universeId), 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept Universe Invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      setError(null);
      await rejectUniverseInvitation(invitationId);
      setSuccessMsg('Universe Invitation declined');
      await loadInvitations();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to decline Universe Invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlock = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      setError(null);
      await blockUser(undefined, invitationId);
      setSuccessMsg('User blocked and invitation updated');
      await loadInvitations();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to block user');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingReceived = received.filter((inv) => inv.status === 'PENDING');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 nebula-purple rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MUTUAL CONSENT INVITATIONS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Universe Invitations
            </h1>
            <p className="text-xs text-slate-400">
              Manage incoming and outgoing Universe Invitations to create private Shared Universes.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#07090E]/60 border border-white/5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('received')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'received'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Received</span>
              {pendingReceived.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-400 text-[#07090E] text-[10px] font-bold">
                  {pendingReceived.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'sent'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Sent ({sent.length})</span>
            </button>
          </div>
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

      {/* Loading State */}
      {isLoading ? (
        <div className="rounded-3xl glass-panel p-12 text-center text-slate-400 space-y-3">
          <Orbit className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-mono">LOADING UNIVERSE INVITATIONS...</p>
        </div>
      ) : activeTab === 'received' ? (
        
        /* RECEIVED INVITATIONS VIEW */
        <div className="space-y-4">
          {received.length === 0 ? (
            <div className="rounded-3xl glass-panel p-12 text-center space-y-3 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Received Invitations</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When another explorer sends you a Universe Invitation, it will appear here.
              </p>
            </div>
          ) : (
            received.map((inv) => (
              <div
                key={inv.id}
                className="rounded-3xl glass-panel p-6 border border-white/10 space-y-4 hover:border-white/20 transition-all"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                    <span className="text-lg">🌌</span>
                    <span>Universe Invitation</span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      inv.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : inv.status === 'ACCEPTED'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                {/* Sender Info & Prompt Body */}
                <div className="flex items-start gap-4">
                  {inv.sender.avatar ? (
                    <img
                      src={inv.sender.avatar}
                      alt={inv.sender.displayName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                      {inv.sender.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{inv.sender.displayName}</span>
                      <span className="text-xs font-mono text-indigo-400 truncate">@{inv.sender.username}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">@{inv.sender.username}</strong> wants to create a Universe with you. Accepting this invitation will create a private Shared Universe where only the two of you can communicate.
                    </p>
                  </div>
                </div>

                {/* Action Buttons (Only for PENDING status) */}
                {inv.status === 'PENDING' && (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleBlock(inv.id)}
                      disabled={processingId === inv.id}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>Block</span>
                    </button>

                    <button
                      onClick={() => handleDecline(inv.id)}
                      disabled={processingId === inv.id}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>

                    <button
                      onClick={() => handleAccept(inv.id)}
                      disabled={processingId === inv.id}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        
        /* SENT INVITATIONS VIEW */
        <div className="space-y-4">
          {sent.length === 0 ? (
            <div className="rounded-3xl glass-panel p-12 text-center space-y-3 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Sent Invitations</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Search for an explorer and click "Create Universe" to send an invitation.
              </p>
            </div>
          ) : (
            sent.map((inv) => (
              <div
                key={inv.id}
                className="rounded-3xl glass-panel p-6 border border-white/10 flex items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {inv.receiver.avatar ? (
                    <img
                      src={inv.receiver.avatar}
                      alt={inv.receiver.displayName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                      {inv.receiver.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Universe Invitation Sent</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Waiting for <strong className="text-white">@{inv.receiver.username}</strong> to respond.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase inline-block ${
                      inv.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : inv.status === 'ACCEPTED'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    Status: {inv.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
