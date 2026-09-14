import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ScrobblerState {
  // ListenBrainz
  listenBrainzEnabled: boolean;
  listenBrainzToken: string;
  setListenBrainzEnabled: (enabled: boolean) => void;
  setListenBrainzToken: (token: string) => void;

  // Last.fm
  lastFmEnabled: boolean;
  lastFmUsername: string;
  setLastFmEnabled: (enabled: boolean) => void;
  setLastFmUsername: (name: string) => void;
}

export const useScrobblerStore = create<ScrobblerState>()(
  persist(
    (set) => ({
      listenBrainzEnabled: false,
      listenBrainzToken: "",
      setListenBrainzEnabled: (enabled) => set({ listenBrainzEnabled: enabled }),
      setListenBrainzToken: (token) => set({ listenBrainzToken: token.trim() }),

      lastFmEnabled: false,
      lastFmUsername: "",
      setLastFmEnabled: (enabled) => set({ lastFmEnabled: enabled }),
      setLastFmUsername: (name) => set({ lastFmUsername: name.trim() }),
    }),
    {
      name: "sonara-scrobbler-settings",
    }
  )
);

export default useScrobblerStore;
