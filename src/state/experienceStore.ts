import { create } from 'zustand';

export type Quality = 'auto' | 'high' | 'low';
export type RendererStatus = 'loading' | 'ready' | 'fallback';
export type ExperienceState = 'idle' | 'input' | 'processing' | 'ready' | 'error';

interface Preferences {
  reducedMotion: boolean;
  quality: Quality;
  rendererStatus: RendererStatus;
  setReducedMotion: (enabled: boolean) => void;
  setQuality: (quality: Quality) => void;
  setRendererStatus: (status: RendererStatus) => void;
}

function storedPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const storedQuality = storedPreference('brain-quality');

export const useExperienceStore = create<Preferences>((set) => ({
  reducedMotion,
  quality: storedQuality === 'high' || storedQuality === 'low' ? storedQuality : 'auto',
  rendererStatus: 'loading',
  setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
  setQuality: (quality) => {
    try { localStorage.setItem('brain-quality', quality); } catch { /* optional preference */ }
    set({ quality });
  },
  setRendererStatus: (rendererStatus) => set({ rendererStatus }),
}));
