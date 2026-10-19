'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '@/lib/auth-api';
import type { LoginInput, RegisterInput, User } from '@/lib/types';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: User };

type AuthContextValue = AuthState & {
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  useEffect(() => {
    let ignore = false;

    authApi.getMe().then(
      (user) => {
        if (!ignore) {
          setState({ status: 'authenticated', user });
        }
      },
      () => {
        if (!ignore) {
          setState({ status: 'anonymous', user: null });
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  async function login(input: LoginInput) {
    const user = await authApi.login(input);
    setState({ status: 'authenticated', user });
  }

  async function register(input: RegisterInput) {
    const user = await authApi.register(input);
    setState({ status: 'authenticated', user });
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setState({ status: 'anonymous', user: null });
    }
  }

  return <AuthContext value={{ ...state, login, register, logout }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
