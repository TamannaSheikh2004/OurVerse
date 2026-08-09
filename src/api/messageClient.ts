import { API_BASE_URL } from './config';

const API_BASE = `${API_BASE_URL}/api/messages`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('ourverse_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface MessageData {
  id: string;
  messageId: string;
  universeId: string;
  senderId: string;
  type: string;
  content: string;
  metadata: string | Record<string, any>;
  replyToMessageId: string | null;
  version: number;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'DELETED';
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: {
      id: string;
      username: string;
      displayName: string | null;
    };
  }>;
  readReceipts: Array<{
    userId: string;
    readAt: string;
  }>;
}

export interface FetchMessagesResponse {
  messages: MessageData[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchMessages(
  universeId: string,
  params?: { cursor?: string; limit?: number; q?: string; direction?: 'before' | 'after' }
): Promise<FetchMessagesResponse> {
  const query = new URLSearchParams();
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.q) query.set('q', params.q);
  if (params?.direction) query.set('direction', params.direction);

  const res = await fetch(`${API_BASE}/${universeId}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch messages');
  }
  return data;
}

export async function markMessagesRead(universeId: string, messageIds?: string[]): Promise<any> {
  const res = await fetch(`${API_BASE}/${universeId}/read`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ messageIds }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark messages as read');
  }
  return data;
}

export async function fetchUserPresence(universeId: string, targetUserId: string): Promise<{ userId: string; isOnline: boolean; lastSeen: string | null }> {
  const res = await fetch(`${API_BASE}/${universeId}/presence/${targetUserId}`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch user presence');
  }
  return data;
}
