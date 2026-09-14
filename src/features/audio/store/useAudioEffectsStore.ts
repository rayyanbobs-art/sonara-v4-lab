import { create } from "zustand";
import { persist } from "zustand/middleware";

export const EQ_FREQUENCIES = [
  32, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 14000, 16000,
] as const;

export type EqFrequency = (typeof EQ_FREQUENCIES)[number];

export type EqPresetName =
  | "Flat"
  | "Bass Boost"
  | "Vocal Clarity"
  | "Electronic"
  | "Rock"
  | "Acoustic"
  | "Studio Master"
  | "Custom";

export const EQ_PRESETS: Record<Exclude<EqPresetName, "Custom">, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Bass Boost": [6.0, 5.2, 4.0, 3.0, 1.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Vocal Clarity": [-2.0, -1.5, -1.0, 0, 0.5, 1.0, 2.0, 3.5, 3.0, 2.5, 2.0, 1.0, 0.5, 0, 0],
  Electronic: [4.5, 4.0, 3.0, 1.5, 0, -1.0, -0.5, 1.0, 2.0, 3.0, 3.5, 4.0, 4.0, 3.5, 3.0],
  Rock: [4.0, 3.0, 2.0, 0.5, -0.5, -1.0, 0, 1.5, 2.5, 3.0, 3.5, 4.0, 3.5, 2.5, 2.0],
  Acoustic: [2.0, 2.0, 1.5, 1.0, 0.5, 0, 1.0, 1.5, 2.0, 2.5, 2.5, 2.0, 1.5, 1.0, 0.5],
  "Studio Master": [2.5, 2.0, 1.0, 0, 0, 0, 0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 2.5, 2.0],
};

export type SleepTimerDuration = "15" | "30" | "45" | "60" | "end_of_track" | null;

interface AudioEffectsState {
  // Equalizer
  eqEnabled: boolean;
  eqBands: number[]; // 15 bands, -12dB to +12dB
  activePreset: EqPresetName;
  setEqEnabled: (enabled: boolean) => void;
  setBandGain: (index: number, gainDb: number) => void;
  applyPreset: (preset: EqPresetName) => void;

  // DSP Enhancements
  studioMasterClarity: boolean;
  setStudioMasterClarity: (enabled: boolean) => void;
  binauralCrossfeed: boolean;
  setBinauralCrossfeed: (enabled: boolean) => void;
  peakProtection: boolean;
  setPeakProtection: (enabled: boolean) => void;

  // Crossfade
  crossfadeDuration: number; // 0 to 12 seconds (0 = off)
  setCrossfadeDuration: (seconds: number) => void;

  // Sleep Timer
  sleepTimerType: SleepTimerDuration;
  sleepTimerEndsAt: number | null; // epoch ms
  startSleepTimer: (type: SleepTimerDuration) => void;
  cancelSleepTimer: () => void;
}

export const useAudioEffectsStore = create<AudioEffectsState>()(
  persist(
    (set, get) => ({
      eqEnabled: true,
      eqBands: [...EQ_PRESETS["Studio Master"]],
      activePreset: "Studio Master",

      setEqEnabled: (enabled) => set({ eqEnabled: enabled }),

      setBandGain: (index, gainDb) => {
        const clamped = Math.max(-12, Math.min(12, gainDb));
        const newBands = [...get().eqBands];
        newBands[index] = clamped;
        set({ eqBands: newBands, activePreset: "Custom" });
      },

      applyPreset: (preset) => {
        if (preset === "Custom") {
          set({ activePreset: "Custom" });
          return;
        }
        const presetValues = EQ_PRESETS[preset];
        if (presetValues) {
          set({ eqBands: [...presetValues], activePreset: preset });
        }
      },

      studioMasterClarity: true,
      setStudioMasterClarity: (enabled) => set({ studioMasterClarity: enabled }),

      binauralCrossfeed: false,
      setBinauralCrossfeed: (enabled) => set({ binauralCrossfeed: enabled }),

      peakProtection: true,
      setPeakProtection: (enabled) => set({ peakProtection: enabled }),

      crossfadeDuration: 4, // 4s smooth crossfade by default
      setCrossfadeDuration: (seconds) =>
        set({ crossfadeDuration: Math.max(0, Math.min(12, seconds)) }),

      sleepTimerType: null,
      sleepTimerEndsAt: null,

      startSleepTimer: (type) => {
        if (!type) {
          set({ sleepTimerType: null, sleepTimerEndsAt: null });
          return;
        }
        if (type === "end_of_track") {
          set({ sleepTimerType: "end_of_track", sleepTimerEndsAt: null });
          return;
        }
        const minutes = parseInt(type, 10);
        const endsAt = Date.now() + minutes * 60 * 1000;
        set({ sleepTimerType: type, sleepTimerEndsAt: endsAt });
      },

      cancelSleepTimer: () => {
        set({ sleepTimerType: null, sleepTimerEndsAt: null });
      },
    }),
    {
      name: "sonara-audio-effects-v4",
      partialize: (state) => ({
        eqEnabled: state.eqEnabled,
        eqBands: state.eqBands,
        activePreset: state.activePreset,
        studioMasterClarity: state.studioMasterClarity,
        binauralCrossfeed: state.binauralCrossfeed,
        peakProtection: state.peakProtection,
        crossfadeDuration: state.crossfadeDuration,
      }),
    }
  )
);

export default useAudioEffectsStore;
