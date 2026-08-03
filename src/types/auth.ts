export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RecoverPayload {
  username: string;
  recoveryKey: string;
  newPassword: string;
}

export interface AuthResponse {
  token?: string;
  user?: User;
  recoveryKey?: string;
  newRecoveryKey?: string;
  message?: string;
  error?: string;
}
