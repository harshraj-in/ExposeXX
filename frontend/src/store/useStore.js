import { create } from 'zustand';
import { getCurrentUser, setCurrentUser, clearCurrentUser } from '../storage';

const useStore = create((set) => ({
  // ── Auth ─────────────────────────────────────────────────────
  user: getCurrentUser(), // Read session from localStorage on load
  setUser: (user) => {
    setCurrentUser(user);
    set({ user });
  },
  logout: () => {
    clearCurrentUser();
    set({ user: null });
  },

  // ── Theme ────────────────────────────────────────────────────
  theme: localStorage.getItem('ex_theme') || 'light',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('ex_theme', next);
      return { theme: next };
    }),
}));

export default useStore;
