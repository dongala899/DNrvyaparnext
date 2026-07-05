import { create } from 'zustand';

const STORAGE_KEY = 'dnr_vyapar_state';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

export function createSharedState() {
  const persisted = loadPersistedState();
  return create((set, get) => ({
    currentUser: persisted.currentUser || null,
    currentCompany: persisted.currentCompany || null,
    isLicensed: persisted.isLicensed || false,
    licenseInfo: persisted.licenseInfo || null,
    appReady: false,
    theme: 'light',

    setCurrentUser: (user) => {
      set({ currentUser: user });
      persistState(get());
    },
    setCurrentCompany: (company) => {
      set({ currentCompany: company });
      persistState(get());
    },
    setLicensed: (licensed) => {
      set({ isLicensed: licensed });
      persistState(get());
    },
    setLicenseInfo: (info) => {
      set({ licenseInfo: info });
      persistState(get());
    },
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
    clearAuth: () => {
      set({ currentUser: null, currentCompany: null, isLicensed: false, licenseInfo: null });
      persistState(get());
    },
  }));
}

function persistState(state) {
  try {
    const toSave = {
      currentUser: state.currentUser,
      currentCompany: state.currentCompany,
      isLicensed: state.isLicensed,
      licenseInfo: state.licenseInfo,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {}
}

export const sharedState = createSharedState();
export const useStore = sharedState;
