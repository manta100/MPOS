import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface Store {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

interface AuthState {
  user: User | null;
  store: Store | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (data: { user: User; store: Store; token: string; refreshToken: string }) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      store: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (data) => {
        set({
          user: data.user,
          store: data.store,
          token: data.token,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          store: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'mpos-auth',
    }
  )
);
