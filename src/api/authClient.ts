import { RegisterPayload, LoginPayload, RecoverPayload, AuthResponse, User } from '../types/auth';
import { API_BASE_URL } from './config';

const API_BASE = `${API_BASE_URL}/api/auth`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ourverse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function recoverPassword(payload: RecoverPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Password recovery failed');
  return data;
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch user');
  return data;
}

export async function updateProfile(displayName?: string, avatarUrl?: string): Promise<{ user: User }> {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ displayName, avatarUrl }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
}

export async function deleteAccount(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/account`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete account');
  return data;
}
