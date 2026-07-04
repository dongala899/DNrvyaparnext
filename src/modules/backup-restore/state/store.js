import { create } from 'zustand';

export const useBackupStore = create((set, get) => ({
  backups: [],
  setBackups: (backups) => set({ backups }),
  addBackup: (backup) => set(state => ({ backups: [...state.backups, backup] })),
  removeBackup: (id) => set(state => ({ backups: state.backups.filter(b => b.id !== id) })),
  progress: { percent: 0, status: null, error: null },
  setProgress: (progress) => set({ progress: { ...get().progress, ...progress } }),
  resetProgress: () => set({ progress: { percent: 0, status: null, error: null } }),
}));