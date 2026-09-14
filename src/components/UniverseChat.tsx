import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../api/socketClient';
import { fetchMessages, markMessagesRead, fetchUserPresence, MessageData } from '../api/messageClient';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Smile,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  CheckCheck,
  Loader2,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface UniverseChatProps {
  universeId: string; // Database ID or custom universeId
  dbUniverseId: string;
  peerUser: {
    id?: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
}

const COMMON_EMOJIS = ['❤️', '😂', '🌌', '👍', '😮', '🔥', '🎉', '🙏'];

export const UniverseChat: React.FC<UniverseChatProps> = ({ universeId, dbUniverseId, peerUser }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Presence & Typing State
  const [peerPresence, setPeerPresence] = useState<{ isOnline: boolean; lastSeen: string | null }>({
    isOnline: false,
    lastSeen: null,
  });
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active editing / reaction state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load Message History
  useEffect(() => {
    async function loadInitialMessages() {
      try {
        setIsLoadingHistory(true);
        setError(null);
        const data = await fetchMessages(dbUniverseId, { limit: 40 });
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);

        // Mark unread messages as read
        if (data.messages.length > 0) {
          markMessagesRead(dbUniverseId).catch(() => {});
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setIsLoadingHistory(false);
      }
    }

    if (dbUniverseId) {
      loadInitialMessages();
    }
  }, [dbUniverseId]);

  // 2. Fetch Peer Presence Status
  useEffect(() => {
    async function checkPresence() {
      if (peerUser.id && dbUniverseId) {
        try {
          const pres = await fetchUserPresence(dbUniverseId, peerUser.id);
          setPeerPresence({ isOnline: pres.isOnline, lastSeen: pres.lastSeen });
        } catch (err) {
          // Ignore presence fetch error
        }
      }
    }
    checkPresence();
  }, [dbUniverseId, peerUser.id]);

  const peerUserId = peerUser.id;
  const peerUsername = peerUser.username;
  const currentUserId = user?.id;

  // 3. Socket.IO Real-Time Connection & Event Handling
  useEffect(() => {
    if (!token || !dbUniverseId) return;

    const socket = getSocket(token);

    // Join Universe Room
    socket.emit('join_universe', { universeId: dbUniverseId });

    // Listen for Real-Time Created Messages
    const handleMessageCreated = (newMsg: MessageData) => {
      if (newMsg.universeId === dbUniverseId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // If message is from peer, mark read immediately
        if (currentUserId && newMsg.senderId !== currentUserId) {
          socket.emit('mark_read', { universeId: dbUniverseId, messageIds: [newMsg.id] });
        }
      }
    };

    // Listen for Real-Time Updated Messages
    const handleMessageUpdated = (updatedMsg: MessageData) => {
      if (updatedMsg.universeId === dbUniverseId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
        );
      }
    };

    // Listen for Real-Time Deleted Messages
    const handleMessageDeleted = (deletedMsg: MessageData) => {
      if (deletedMsg.universeId === dbUniverseId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === deletedMsg.id ? { ...m, ...deletedMsg } : m))
        );
      }
    };

    // Listen for Read Receipts
    const handleMessageRead = (data: { universeId: string; userId: string; messageIds: string[]; readAt: string }) => {
      if (data.universeId === dbUniverseId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (data.messageIds.includes(m.id)) {
              return {
                ...m,
                status: 'READ',
                readReceipts: [
                  ...(m.readReceipts || []).filter((r) => r.userId !== data.userId),
                  { userId: data.userId, readAt: data.readAt },
                ],
              };
            }
            return m;
          })
        );
      }
    };

    // Listen for Presence Updates
    const handleUserOnline = (data: { userId: string; universeId: string }) => {
      if (data.universeId === dbUniverseId && data.userId === peerUserId) {
        setPeerPresence({ isOnline: true, lastSeen: new Date().toISOString() });
      }
    };

    const handleUserOffline = (data: { userId: string; universeId: string; lastSeen: string | null }) => {
      if (data.universeId === dbUniverseId && data.userId === peerUserId) {
        setPeerPresence({ isOnline: false, lastSeen: data.lastSeen });
      }
    };

    // Listen for Typing Indicators
    const handleTypingStarted = (data: { universeId: string; username: string }) => {
      if (data.universeId === dbUniverseId && data.username === peerUsername) {
        setIsPeerTyping(true);
      }
    };

    const handleTypingStopped = (data: { universeId: string; username: string }) => {
      if (data.universeId === dbUniverseId && data.username === peerUsername) {
        setIsPeerTyping(false);
      }
    };

    // Listen for Reactions
    const handleReactionAdded = (data: { messageId: string; reaction: any; universeId: string }) => {
      if (data.universeId === dbUniverseId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.messageId) {
              const existing = m.reactions || [];
              const filtered = existing.filter((r) => r.userId !== data.reaction.userId);
              return { ...m, reactions: [...filtered, data.reaction] };
            }
            return m;
          })
        );
      }
    };

    const handleReactionRemoved = (data: { messageId: string; userId: string; universeId: string }) => {
      if (data.universeId === dbUniverseId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.messageId) {
              return {
                ...m,
                reactions: (m.reactions || []).filter((r) => r.userId !== data.userId),
              };
            }
            return m;
          })
        );
      }
    };

    socket.on('message_created', handleMessageCreated);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_read', handleMessageRead);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('typing_started', handleTypingStarted);
    socket.on('typing_stopped', handleTypingStopped);
    socket.on('reaction_added', handleReactionAdded);
    socket.on('reaction_removed', handleReactionRemoved);

    return () => {
      socket.emit('leave_universe', { universeId: dbUniverseId });
      socket.off('message_created', handleMessageCreated);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_read', handleMessageRead);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('typing_started', handleTypingStarted);
      socket.off('typing_stopped', handleTypingStopped);
      socket.off('reaction_added', handleReactionAdded);
      socket.off('reaction_removed', handleReactionRemoved);
    };
  }, [token, dbUniverseId, peerUserId, peerUsername, currentUserId]);

  // Auto Scroll to bottom on new message
  useEffect(() => {
    if (!isLoadingHistory && !isSearching) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingHistory, isSearching]);

  // Load More Older Messages
  const handleLoadMore = async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const data = await fetchMessages(dbUniverseId, { cursor: nextCursor, limit: 30 });
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err: any) {
      // Ignore load more error
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle Input Typing Event Trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    if (!token || !dbUniverseId) return;

    const socket = getSocket(token);
    socket.emit('typing_start', { universeId: dbUniverseId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { universeId: dbUniverseId });
    }, 2000);
  };

  // Send Message Trigger
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputContent.trim();
    if (!trimmed || !token || !dbUniverseId) return;

    const socket = getSocket(token);
    socket.emit('typing_stop', { universeId: dbUniverseId });

    socket.emit('send_message', {
      universeId: dbUniverseId,
      content: trimmed,
      type: 'TEXT',
      metadata: {},
    });

    setInputContent('');
  };

  // Save Edited Message
  const handleSaveEdit = (messageId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed || !token) return;

    const socket = getSocket(token);
    socket.emit('edit_message', { messageId, newContent: trimmed });
    setEditingMessageId(null);
    setEditContent('');
  };

  // Delete Message
  const handleDeleteMessage = (messageId: string) => {
    if (!token) return;
    const socket = getSocket(token);
    socket.emit('delete_message', { messageId });
  };

  // Add / Remove Emoji Reaction
  const handleToggleEmoji = (messageId: string, emoji: string) => {
    if (!token) return;
    const socket = getSocket(token);
    const targetMsg = messages.find((m) => m.id === messageId);
    const existingReaction = targetMsg?.reactions?.find(
      (r) => r.userId === user?.id && r.emoji === emoji
    );

    if (existingReaction) {
      socket.emit('remove_reaction', { messageId });
    } else {
      socket.emit('add_reaction', { messageId, emoji });
    }
    setActiveEmojiPickerId(null);
  };

  // Filter messages by search query if search active
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="w-full flex flex-col h-[700px] rounded-3xl glass-panel glass-panel-glow border border-white/10 overflow-hidden shadow-2xl relative">
      
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Peer Avatar */}
          <div className="relative">
            {peerUser.avatar ? (
              <img
                src={peerUser.avatar}
                alt={peerUser.displayName}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-500/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-1 ring-cyan-500/40">
                {peerUser.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Presence Badge */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#07090E] ${
                peerPresence.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{peerUser.displayName}</h3>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">@{peerUser.username}</span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              {isPeerTyping ? (
                <span className="text-indigo-400 font-semibold animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> is typing...
                </span>
              ) : peerPresence.isOnline ? (
                <span className="text-emerald-400 font-semibold">Online in Universe</span>
              ) : peerPresence.lastSeen ? (
                <span>Last seen {new Date(peerPresence.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              ) : (
                <span>Offline</span>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar & Action Toggle */}
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-48 sm:w-64 px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-cyan-500/30 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="absolute right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearching(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Search Messages"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold">
            {universeId}
          </div>
        </div>
      </div>

      {/* Message Chat Body Stream */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2 mx-auto transition-all"
            >
              {isLoadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Load Older Messages</span>
            </button>
          </div>
        )}

        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs font-mono text-slate-400">CONNECTING TO UNIVERSE STREAM...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-sm font-bold text-white">Your Shared Universe is Quiet</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {searchQuery ? 'No matching messages found.' : 'Send a message to initiate your real-time conversation.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const isDeleted = msg.status === 'DELETED';
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble Container */}
                <div className="relative max-w-[85%] sm:max-w-[70%]">
                  
                  {/* Action Bar Hover Menu (Edit / Delete / Reaction) */}
                  {!isDeleted && !isEditing && (
                    <div
                      className={`absolute top-0 -translate-y-full mb-1 hidden group-hover:flex items-center gap-1 p-1 rounded-xl bg-[#0F1420] border border-white/10 shadow-xl z-20 ${
                        isMe ? 'right-0' : 'left-0'
                      }`}
                    >
                      <button
                        onClick={() => setActiveEmojiPickerId(activeEmojiPickerId === msg.id ? null : msg.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition-colors"
                        title="Add Reaction"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {isMe && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditContent(msg.content);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-indigo-300 transition-colors"
                            title="Edit Message"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-rose-400 transition-colors"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Emoji Quick Picker Dropdown */}
                  {activeEmojiPickerId === msg.id && (
                    <div className="absolute top-0 -translate-y-full mb-2 p-2 rounded-2xl bg-[#0F1420] border border-white/20 shadow-2xl flex items-center gap-1.5 z-30 animate-fade-in">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleEmoji(msg.id, emoji)}
                          className="hover:scale-125 transition-transform text-base p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Content Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed space-y-1.5 shadow-lg border ${
                      isDeleted
                        ? 'bg-white/5 border-white/5 text-slate-500 italic'
                        : isMe
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border-indigo-500/30'
                        : 'bg-[#0F1420]/90 text-slate-100 border-white/10'
                    }`}
                  >
                    {/* Inline Edit Input Mode */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-white text-xs focus:outline-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-[10px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white font-bold text-[10px]"
                          >
                            Save Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Display Message Content */}
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                        {/* Footer Info: Custom Readable messageId, Edited Tag, Timestamp & Status */}
                        <div className={`flex items-center justify-end gap-2 mt-1.5 text-[10px] font-mono ${isMe ? 'text-indigo-200/80' : 'text-slate-400'}`}>
                          <span className="text-[9px] opacity-60 font-semibold">{msg.messageId}</span>

                          {msg.editedAt && !isDeleted && (
                            <span className="italic text-[9px] opacity-75">(Edited v{msg.version})</span>
                          )}

                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {/* Read Receipts Icon Status */}
                          {isMe && !isDeleted && (
                            <span>
                              {msg.status === 'READ' ? (
                                <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-cyan-300" /></span>
                              ) : msg.status === 'DELIVERED' ? (
                                <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-slate-300" /></span>
                              ) : (
                                <span title="Sent"><Check className="w-3.5 h-3.5 text-slate-400" /></span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reaction Badges */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {msg.reactions.map((react) => (
                        <button
                          key={react.id}
                          onClick={() => handleToggleEmoji(msg.id, react.emoji)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1 transition-all ${
                            react.userId === user?.id
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          <span>{react.emoji}</span>
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-white/10 bg-[#07090E]/90 backdrop-blur-xl flex items-center gap-3 z-10"
      >
        <input
          type="text"
          value={inputContent}
          onChange={handleInputChange}
          placeholder={`Message @${peerUser.username} in Shared Universe...`}
          className="flex-1 px-4 py-3 text-xs rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
        />

        <button
          type="submit"
          disabled={!inputContent.trim()}
          className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
