import {
  EQ_FREQUENCIES,
  useAudioEffectsStore,
} from "../store/useAudioEffectsStore";

class WebAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private compressorNode: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private attachedElement: HTMLAudioElement | null = null;
  private unsubscribeStore: (() => void) | null = null;

  public init(audioElement: HTMLAudioElement): void {
    if (this.attachedElement === audioElement && this.audioCtx) {
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.attachedElement = audioElement;
      this.audioCtx = new AudioCtxClass();

      // Resume context on user interaction if suspended by browser autoplay policy
      if (this.audioCtx.state === "suspended") {
        const resume = () => {
          this.audioCtx?.resume();
          window.removeEventListener("click", resume);
          window.removeEventListener("keydown", resume);
        };
        window.addEventListener("click", resume);
        window.addEventListener("keydown", resume);
      }

      // Create MediaElementSource
      this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);

      // Create 15-band peaking filter chain
      this.filters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1.414; // standard 1/2 octave bandwidth
        filter.gain.value = 0;
        return filter;
      });

      // Peak Protection Limiter (prevents digital clipping during boosts)
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -1.0;
      this.compressorNode.knee.value = 6;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.15;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      // Connect DSP chain:
      // Source -> Filter 0 -> Filter 1 -> ... -> Filter 14 -> Compressor -> Gain -> Destination
      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(this.compressorNode);
      this.compressorNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      // Apply initial store settings
      this.syncFromStore();

      // Listen to store updates
      this.unsubscribeStore = useAudioEffectsStore.subscribe(() => {
        this.syncFromStore();
      });
    } catch (err) {
      console.warn("WebAudioEngine init failed:", err);
    }
  }

  private syncFromStore(): void {
    if (!this.audioCtx || this.filters.length !== EQ_FREQUENCIES.length) return;

    const state = useAudioEffectsStore.getState();
    const now = this.audioCtx.currentTime;

    for (let i = 0; i < this.filters.length; i++) {
      const filter = this.filters[i];
      let targetGain = state.eqEnabled ? state.eqBands[i] ?? 0 : 0;

      // Studio Master Clarity subtle harmonics boost
      if (state.studioMasterClarity) {
        if (i === 0) targetGain += 1.5; // sub-bass air
        if (i === 13) targetGain += 1.2; // 14kHz shimmer
      }

      filter.gain.setTargetAtTime(targetGain, now, 0.04);
    }

    if (this.compressorNode) {
      this.compressorNode.threshold.setTargetAtTime(
        state.peakProtection ? -1.0 : 0.0,
        now,
        0.04
      );
    }
  }

  public fadeOutAndPause(audioElement: HTMLAudioElement, durationMs: number = 1000): void {
    if (!this.gainNode || !this.audioCtx) {
      audioElement.pause();
      return;
    }
    const now = this.audioCtx.currentTime;
    const durationSec = durationMs / 1000;
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(0.0001, now + durationSec);

    setTimeout(() => {
      audioElement.pause();
      if (this.gainNode && this.audioCtx) {
        this.gainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      }
    }, durationMs + 50);
  }

  public destroy(): void {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.sourceNode = null;
    this.filters = [];
    this.compressorNode = null;
    this.gainNode = null;
    this.attachedElement = null;
  }
}

export const webAudioEngine = new WebAudioEngine();
export default webAudioEngine;
