import { create } from 'zustand';

export function createSharedState() {
  return create((set, get) => ({
    currentUser: null,
    currentCompany: null,
    isLicensed: false,
    licenseInfo: null,
    appReady: false,
    theme: 'light',

    setCurrentUser: (user) => set({ currentUser: user }),
    setCurrentCompany: (company) => set({ currentCompany: company }),
    setLicensed: (licensed) => set({ isLicensed: licensed }),
    setLicenseInfo: (info) => set({ licenseInfo: info }),
    setAppReady: (ready) => set({ appReady: ready }),
    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light';
      set({ theme: next });
      document.documentElement.setAttribute('data-theme', next);
    },
    setTheme: (theme) => {
      set({ theme });
      document.documentElement.setAttribute('data-theme', theme);
    },
    clearAuth: () => set({ currentUser: null, currentCompany: null, isLicensed: false }),
  }));
}

export const sharedState = createSharedState();
export const useStore = sharedState;