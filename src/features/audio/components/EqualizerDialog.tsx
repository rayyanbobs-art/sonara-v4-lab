import React from "react";
import {
  EQ_FREQUENCIES,
  type EqPresetName,
  useAudioEffectsStore,
} from "../store/useAudioEffectsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sliders, Sparkles, Headphones, ShieldCheck } from "lucide-react";

interface EqualizerDialogProps {
  trigger?: React.ReactNode;
}

export const EqualizerDialog: React.FC<EqualizerDialogProps> = ({ trigger }) => {
  const {
    eqEnabled,
    setEqEnabled,
    eqBands,
    setBandGain,
    activePreset,
    applyPreset,
    studioMasterClarity,
    setStudioMasterClarity,
    binauralCrossfeed,
    setBinauralCrossfeed,
    peakProtection,
    setPeakProtection,
  } = useAudioEffectsStore();

  const presetList: EqPresetName[] = [
    "Studio Master",
    "Bass Boost",
    "Vocal Clarity",
    "Electronic",
    "Rock",
    "Acoustic",
    "Flat",
  ];

  const formatFreq = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1)}k`;
    }
    return `${freq}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-9 text-muted-foreground hover:text-foreground"
            aria-label="Audio Equalizer"
          >
            <Sliders className="size-4.5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/60">
          <div className="space-y-0.5 text-left">
            <DialogTitle className="text-xl font-bold font-heading flex items-center gap-2">
              <Sliders className="size-5 text-primary" />
              <span>15-Band Studio Equalizer</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Hardware-accelerated audiophile DSP and parametric filters
            </p>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <span className="text-xs font-semibold text-muted-foreground">
              {eqEnabled ? "Enabled" : "Bypassed"}
            </span>
            <Switch
              checked={eqEnabled}
              onCheckedChange={setEqEnabled}
              aria-label="Toggle Equalizer"
            />
          </div>
        </DialogHeader>

        {/* Preset Selector Chips */}
        <div className="space-y-2 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Acoustic Presets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presetList.map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activePreset === preset
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 15 Vertical Sliders */}
        <div
          className={`py-4 transition-opacity duration-300 ${
            eqEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
          }`}
        >
          <div className="grid grid-cols-15 gap-1.5 items-end justify-items-center h-48 px-1">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = eqBands[idx] ?? 0;
              return (
                <div
                  key={freq}
                  className="flex flex-col items-center justify-end h-full gap-1 w-full"
                >
                  <span className="text-[9px] font-mono font-medium text-primary">
                    {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                  </span>
                  <div className="relative flex-1 flex items-center justify-center w-full">
                    {/* Zero center indicator line */}
                    <div className="absolute w-full h-[1px] bg-border/80 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      onChange={(e) => setBandGain(idx, parseFloat(e.target.value))}
                      className="slider-vertical h-36 w-3 accent-primary cursor-pointer"
                      style={{
                        writingMode: "vertical-lr",
                        direction: "rtl",
                      }}
                      aria-label={`${freq} Hz gain`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {formatFreq(freq)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground px-2 pt-2 border-t border-border/40">
            <span>-12 dB (Cut)</span>
            <span className="text-foreground/70">0 dB (Unity)</span>
            <span>+12 dB (Boost)</span>
          </div>
        </div>

        {/* DSP Enhancements (LastWave Port) */}
        <div className="pt-3 border-t border-border/60 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            DSP Enhancements
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Studio Master Clarity */}
            <div
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                studioMasterClarity
                  ? "bg-primary/10 border-primary/40 text-foreground"
                  : "bg-muted/40 border-border/60 text-muted-foreground"
              }`}
              onClick={() => setStudioMasterClarity(!studioMasterClarity)}
            >
              <div className="flex items-center justify-between">
                <Sparkles className="size-4 text-primary" />
                <Switch
                  checked={studioMasterClarity}
                  onCheckedChange={setStudioMasterClarity}
                />
              </div>
              <div>
                <p className="text-xs font-bold">Studio Master Clarity</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Enhances sub-bass depth & airy highs
                </p>
              </div>
            </div>

            {/* Binaural Crossfeed */}
            <div
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                binauralCrossfeed
                  ? "bg-primary/10 border-primary/40 text-foreground"
                  : "bg-muted/40 border-border/60 text-muted-foreground"
              }`}
              onClick={() => setBinauralCrossfeed(!binauralCrossfeed)}
            >
              <div className="flex items-center justify-between">
                <Headphones className="size-4 text-primary" />
                <Switch
                  checked={binauralCrossfeed}
                  onCheckedChange={setBinauralCrossfeed}
                />
              </div>
              <div>
                <p className="text-xs font-bold">Binaural Crossfeed</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Reduces stereo ear fatigue on headphones
                </p>
              </div>
            </div>

            {/* Peak Protection Limiter */}
            <div
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                peakProtection
                  ? "bg-primary/10 border-primary/40 text-foreground"
                  : "bg-muted/40 border-border/60 text-muted-foreground"
              }`}
              onClick={() => setPeakProtection(!peakProtection)}
            >
              <div className="flex items-center justify-between">
                <ShieldCheck className="size-4 text-primary" />
                <Switch
                  checked={peakProtection}
                  onCheckedChange={setPeakProtection}
                />
              </div>
              <div>
                <p className="text-xs font-bold">Peak Protection</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Prevents clipping distortion on heavy bass
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EqualizerDialog;
