import { describe, it, expect, beforeEach } from "vitest";
import {
  EQ_FREQUENCIES,
  EQ_PRESETS,
  AUDIO_QUALITY_OPTIONS,
  getQualityShortLabel,
  useAudioEffectsStore,
  type EqPresetName,
} from "../features/audio/store/useAudioEffectsStore";
import { useScrobblerStore } from "../features/scrobbler/store/useScrobblerStore";

describe("v4 Audio Effects Store & EQ Presets", () => {
  it("defines exactly 15 standard ISO frequencies in strictly ascending order", () => {
    expect(EQ_FREQUENCIES).toHaveLength(15);
    for (let i = 1; i < EQ_FREQUENCIES.length; i++) {
      expect(EQ_FREQUENCIES[i]).toBeGreaterThan(EQ_FREQUENCIES[i - 1]);
    }
    expect(EQ_FREQUENCIES[0]).toBe(32);
    expect(EQ_FREQUENCIES[14]).toBe(16000);
  });

  it("ensures all EQ presets have 15 values within [-12, +12] dB range", () => {
    const presetNames: Exclude<EqPresetName, "Custom">[] = [
      "Flat",
      "Bass Boost",
      "Vocal Clarity",
      "Electronic",
      "Rock",
      "Acoustic",
      "Studio Master",
    ];

    presetNames.forEach((preset) => {
      const bands = EQ_PRESETS[preset];
      expect(bands).toBeDefined();
      expect(bands).toHaveLength(15);
      bands.forEach((gain) => {
        expect(gain).toBeGreaterThanOrEqual(-12);
        expect(gain).toBeLessThanOrEqual(12);
      });
    });
  });

  it("provides 4 distinct audio quality tiers with proper short labels", () => {
    expect(AUDIO_QUALITY_OPTIONS).toHaveLength(4);
    expect(AUDIO_QUALITY_OPTIONS.map((o) => o.id)).toEqual(["max", "hires", "lossless", "saver"]);

    expect(getQualityShortLabel("max")).toBe("FLAC 24/192");
    expect(getQualityShortLabel("high")).toBe("FLAC 24/192");
    expect(getQualityShortLabel("hires")).toBe("FLAC 24/96");
    expect(getQualityShortLabel("balanced")).toBe("FLAC 24/96");
    expect(getQualityShortLabel("lossless")).toBe("FLAC 16/44.1");
    expect(getQualityShortLabel("saver")).toBe("320 kbps");
  });

  describe("useAudioEffectsStore state updates", () => {
    beforeEach(() => {
      useAudioEffectsStore.setState({
        eqEnabled: true,
        eqBands: [...EQ_PRESETS["Flat"]],
        activePreset: "Flat",
        sleepTimerType: null,
        sleepTimerEndsAt: null,
      });
    });

    it("clamps band gains to [-12, 12] and switches activePreset to Custom", () => {
      const store = useAudioEffectsStore.getState();
      store.setBandGain(0, 15);
      expect(useAudioEffectsStore.getState().eqBands[0]).toBe(12);
      expect(useAudioEffectsStore.getState().activePreset).toBe("Custom");

      store.setBandGain(1, -20);
      expect(useAudioEffectsStore.getState().eqBands[1]).toBe(-12);
    });

    it("applies a named preset correctly", () => {
      const store = useAudioEffectsStore.getState();
      store.applyPreset("Bass Boost");
      expect(useAudioEffectsStore.getState().activePreset).toBe("Bass Boost");
      expect(useAudioEffectsStore.getState().eqBands).toEqual(EQ_PRESETS["Bass Boost"]);
    });

    it("handles sleep timer calculations and cancellation", () => {
      const store = useAudioEffectsStore.getState();
      const before = Date.now();
      store.startSleepTimer("30");
      const state = useAudioEffectsStore.getState();
      expect(state.sleepTimerType).toBe("30");
      expect(state.sleepTimerEndsAt).toBeGreaterThanOrEqual(before + 30 * 60 * 1000 - 100);
      expect(state.sleepTimerEndsAt).toBeLessThanOrEqual(before + 30 * 60 * 1000 + 1000);

      store.cancelSleepTimer();
      const clearedState = useAudioEffectsStore.getState();
      expect(clearedState.sleepTimerType).toBeNull();
      expect(clearedState.sleepTimerEndsAt).toBeNull();
    });
  });
});

import { cleanTrackTitle, cleanArtistName } from "../features/lyrics/api/lrclibService";

describe("v4 Scrobbler Store", () => {
  it("updates ListenBrainz and Last.fm credentials properly", () => {
    useScrobblerStore.setState({
      listenBrainzEnabled: false,
      listenBrainzToken: "",
      lastFmEnabled: false,
      lastFmUsername: "",
    });

    const store = useScrobblerStore.getState();
    store.setListenBrainzEnabled(true);
    store.setListenBrainzToken("  test-user-token-xyz  ");
    expect(useScrobblerStore.getState().listenBrainzEnabled).toBe(true);
    expect(useScrobblerStore.getState().listenBrainzToken).toBe("test-user-token-xyz");

    store.setLastFmEnabled(true);
    store.setLastFmUsername("  audiophile_user  ");
    expect(useScrobblerStore.getState().lastFmEnabled).toBe(true);
    expect(useScrobblerStore.getState().lastFmUsername).toBe("audiophile_user");
  });
});

describe("v4 LRCLIB Title and Artist Cleaning", () => {
  it("strips noise and extracts song title when artist is embedded in title", () => {
    expect(cleanTrackTitle("Coldplay - Yellow (Official Video)", "Coldplay")).toBe("Yellow");
    expect(cleanTrackTitle("Yellow - Coldplay [Lyric Video]", "Coldplay")).toBe("Yellow");
    expect(cleanTrackTitle("01. Bohemian Rhapsody (2011 Remaster)", "Queen")).toBe("Bohemian Rhapsody");
    expect(cleanTrackTitle("Starboy (feat. Daft Punk)", "The Weeknd")).toBe("Starboy");
  });

  it("cleans artist names from topics and suffixes", () => {
    expect(cleanArtistName("Coldplay - Topic")).toBe("Coldplay");
    expect(cleanArtistName("TaylorSwiftVEVO")).toBe("TaylorSwift");
    expect(cleanArtistName("Dua Lipa feat. DaBaby")).toBe("Dua Lipa");
  });
});

