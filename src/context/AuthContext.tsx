import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterPayload, LoginPayload, RecoverPayload } from '../types/auth';
import * as api from '../api/authClient';
import { disconnectSocket } from '../api/socketClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  recoveryKey: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string | undefined>;
  recover: (payload: RecoverPayload) => Promise<string | undefined>;
  updateUserProfile: (displayName?: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  deleteUserAccount: () => Promise<void>;
  clearRecoveryKey: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ourverse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { user } = await api.fetchCurrentUser();
        setUser(user);
      } catch (err) {
        console.error('Session expired or invalid token');
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (payload: LoginPayload) => {
    const data = await api.loginUser(payload);
    if (data.token && data.user) {
      localStorage.setItem('ourverse_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
  };

  const register = async (payload: RegisterPayload): Promise<string | undefined> => {
    const data = await api.registerUser(payload);
    if (data.token && data.user) {
      localStorage.setItem('ourverse_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    if (data.recoveryKey) {
      setRecoveryKey(data.recoveryKey);
      return data.recoveryKey;
    }
    return undefined;
  };

  const recover = async (payload: RecoverPayload): Promise<string | undefined> => {
    const data = await api.recoverPassword(payload);
    if (data.newRecoveryKey) {
      setRecoveryKey(data.newRecoveryKey);
      return data.newRecoveryKey;
    }
    return undefined;
  };

  const updateUserProfile = async (displayName?: string, avatarUrl?: string) => {
    const data = await api.updateProfile(displayName, avatarUrl);
    setUser(data.user);
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem('ourverse_token');
    setToken(null);
    setUser(null);
    setRecoveryKey(null);
  };

  const deleteUserAccount = async () => {
    await api.deleteAccount();
    logout();
  };

  const clearRecoveryKey = () => {
    setRecoveryKey(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        recoveryKey,
        login,
        register,
        recover,
        updateUserProfile,
        logout,
        deleteUserAccount,
        clearRecoveryKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
