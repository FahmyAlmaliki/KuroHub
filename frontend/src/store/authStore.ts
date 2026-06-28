import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  setTokens: (accessToken, refreshToken) => {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },
  setAccessToken: (accessToken) => {
    sessionStorage.setItem('accessToken', accessToken);
    set({ accessToken });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const savedToken = sessionStorage.getItem('accessToken');
    const savedUser = sessionStorage.getItem('user');

    if (savedToken) {
      set({
        accessToken: savedToken,
        user: savedUser ? JSON.parse(savedUser) : null,
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }

    // Coba refresh dari saved token atau httpOnly cookie
    try {
      const rt = sessionStorage.getItem('refreshToken');
      const { default: axios } = await import('axios');
      const body = rt ? { refreshToken: rt } : {};
      const res = await axios.post('/api/auth/refresh', body);
      if (res.data?.success && res.data?.data?.accessToken) {
        const token = res.data.data.accessToken;
        sessionStorage.setItem('accessToken', token);
        if (res.data.data.refreshToken) {
          sessionStorage.setItem('refreshToken', res.data.data.refreshToken);
        }
        set({ accessToken: token, isAuthenticated: true });
      }
    } catch {
      // No session, tetap di login
    }
    set({ isLoading: false });
  },
}));
