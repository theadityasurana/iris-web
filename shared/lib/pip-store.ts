import { create } from 'zustand';

interface PipState {
  visible: boolean;
  url: string | null;
  companyName: string | null;
  isLive: boolean;
  startTime: number | null;
  appId: string | null;
  show: (url: string, companyName: string, isLive: boolean, startTime: number, appId: string) => void;
  hide: () => void;
}

export const usePipStore = create<PipState>((set) => ({
  visible: false,
  url: null,
  companyName: null,
  isLive: false,
  startTime: null,
  appId: null,
  show: (url, companyName, isLive, startTime, appId) => set({ visible: true, url, companyName, isLive, startTime, appId }),
  hide: () => set({ visible: false, url: null, companyName: null, isLive: false, startTime: null, appId: null }),
}));
