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

/**
 * Formats raw backend or client authentication errors into friendly, clear user messages.
 */
export function formatAuthError(errorInput: any): string {
  const rawMsg = typeof errorInput === 'string'
    ? errorInput
    : errorInput?.message || 'Something went wrong. Please try again.';

  const normalized = rawMsg.trim().toLowerCase();

  if (normalized.includes('invalid username or password')) {
    return 'Incorrect username or password. Please try again.';
  }
  if (normalized.includes('permanently reserved')) {
    return 'This username is permanently reserved and cannot be registered.';
  }
  if (normalized.includes('username is already taken') || normalized.includes('already exists')) {
    return 'That username is already taken. Please choose another.';
  }
  if (normalized.includes('invalid recovery key') || normalized.includes('invalid username or recovery key')) {
    return 'The Recovery Key is invalid. Please check it and try again.';
  }
  if (normalized.includes('username must be at least')) {
    return 'Username must be at least 3 characters long.';
  }
  if (normalized.includes('username must be at most')) {
    return 'Username must not exceed 30 characters.';
  }
  if (normalized.includes('username can only contain')) {
    return 'Username can only contain letters, numbers, underscores, and hyphens.';
  }
  if (normalized.includes('password must be at least') || normalized.includes('new password must be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (normalized.includes('passwords do not match')) {
    return 'Passwords do not match. Please verify and try again.';
  }
  if (normalized.includes('username and password are required') || normalized.includes('all fields are required') || normalized.includes('please enter your username and password')) {
    return 'Please fill in all required fields.';
  }
  if (normalized.includes('failed to fetch') || normalized.includes('networkerror') || normalized.includes('network error')) {
    return 'Network connection issue. Please check your connection and try again.';
  }
  if (normalized.includes('internal server error')) {
    return 'Something went wrong. Please try again.';
  }

  // Safe fallback for unknown errors
  if (rawMsg && rawMsg.length > 0 && rawMsg.length < 120 && !rawMsg.includes('{') && !rawMsg.includes('Prisma') && !rawMsg.includes('Error:')) {
    return rawMsg;
  }

  return 'Something went wrong. Please try again.';
}
