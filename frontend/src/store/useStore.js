import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      user: null, // Holds { _id, name, email, role, token }
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      
      // Store current report context if needed temporarily across flows
      currentReportDraft: null,
      setCurrentReportDraft: (draft) => set({ currentReportDraft: draft }),
      clearReportDraft: () => set({ currentReportDraft: null }),

      submittedReports: [],
      addSubmittedReport: (id) => set((state) => {
        if (!state.submittedReports.includes(id)) {
            return { submittedReports: [...state.submittedReports, id] };
        }
        return state;
      }),
    }),
    {
      name: 'ex-storage', // local storage key
    }
  )
);

export default useStore;
