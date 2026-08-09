import {
  SearchUserResult,
  InvitationsResponse,
  UniverseListItem,
  UniverseDetails,
} from '../types/universe';
import { API_BASE_URL } from './config';

const API_BASE = `${API_BASE_URL}/api`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ourverse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function searchUsers(query: string): Promise<SearchUserResult[]> {
  if (!query.trim()) return [];
  const response = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query.trim())}`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to search users');
  return data;
}

export async function sendUniverseInvitation(receiverUsername: string): Promise<{ message: string; invitationId: string }> {
  const response = await fetch(`${API_BASE}/universe/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ receiverUsername }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to send Universe Invitation');
  return data;
}

export async function acceptUniverseInvitation(invitationId: string): Promise<{ message: string; universeId: string }> {
  const response = await fetch(`${API_BASE}/universe/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ invitationId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to accept Universe Invitation');
  return data;
}

export async function rejectUniverseInvitation(invitationId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/universe/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ invitationId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to decline Universe Invitation');
  return data;
}

export async function blockUser(targetUsername?: string, invitationId?: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/universe/block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ targetUsername, invitationId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to block user');
  return data;
}

export async function fetchInvitations(): Promise<InvitationsResponse> {
  const response = await fetch(`${API_BASE}/universe/invitations`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch Universe Invitations');
  return data;
}

export async function fetchUniversesList(): Promise<UniverseListItem[]> {
  const response = await fetch(`${API_BASE}/universe/list`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch Universes list');
  return data;
}

export async function fetchUniverseDetails(universeId: string): Promise<UniverseDetails> {
  const response = await fetch(`${API_BASE}/universe/${encodeURIComponent(universeId)}`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch Universe details');
  return data;
}
