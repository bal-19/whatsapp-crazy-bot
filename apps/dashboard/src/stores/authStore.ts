import { create } from 'zustand';
import type { AuthUser, DashboardPermission } from '@whatsapp-bot/shared';
import { authService } from '@/lib/services/authService';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

const initialToken = localStorage.getItem(AUTH_TOKEN_KEY);
const initialUser = readStoredUser();

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  hasPermission: (permission: DashboardPermission) => boolean;
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken,
  user: initialUser,
  isLoading: Boolean(initialToken && !initialUser),
  setSession: (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    set({ token: null, user: null });
  },
  hydrate: async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      set({ token: null, user: null, isLoading: false });
      return;
    }

    set({ isLoading: true, token });
    try {
      const user = await authService.me();
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      set({ user });
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      set({ token: null, user: null });
    } finally {
      set({ isLoading: false });
    }
  },
  hasPermission: (permission) => {
    const permissions = get().user?.permissions ?? [];
    return permissions.includes('*') || permissions.includes(permission);
  }
}));
