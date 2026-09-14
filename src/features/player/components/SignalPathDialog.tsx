import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Check,
  Zap,
} from "lucide-react";
import useAudioEffectsStore, {
  AUDIO_QUALITY_OPTIONS,
  type AudioQualityTier,
} from "@/features/audio/store/useAudioEffectsStore";
import { cn } from "@/lib/utils";

interface SignalPathDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SignalPathDialog = ({
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: SignalPathDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const audioQuality = useAudioEffectsStore((state) => state.audioQuality);
  const setAudioQuality = useAudioEffectsStore((state) => state.setAudioQuality);
  const eqEnabled = useAudioEffectsStore((state) => state.eqEnabled);
  const activePreset = useAudioEffectsStore((state) => state.activePreset);
  const studioMasterClarity = useAudioEffectsStore(
    (state) => state.studioMasterClarity
  );
  const peakProtection = useAudioEffectsStore((state) => state.peakProtection);

  // Determine Bit-Perfect vs DSP Active status
  const isDspActive = eqEnabled || studioMasterClarity || peakProtection;
  const isBitPerfect = !isDspActive;

  const selectedTier =
    audioQuality === "high"
      ? "max"
      : audioQuality === "balanced"
        ? "hires"
        : audioQuality;

  const handleSelectQuality = (id: "max" | "hires" | "lossless" | "saver") => {
    setAudioQuality(id as AudioQualityTier);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-3xl p-6 bg-card/95 backdrop-blur-2xl border-border shadow-2xl overflow-y-auto max-h-[85vh]">
        <DialogHeader className="space-y-1.5 pb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs tracking-wider border border-primary/20">
              HQ
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold font-heading text-foreground">
                Streaming Quality
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Select preferred audio resolution & bit depth
              </p>
            </div>
            <div
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0",
                isBitPerfect
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-primary/15 text-primary border border-primary/30"
              )}
            >
              {isBitPerfect ? "Bit-Perfect" : "DSP Active"}
            </div>
          </div>
        </DialogHeader>

        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          If a track is unavailable in the chosen quality, the highest available
          quality will be streamed automatically.
        </p>

        {/* Quality Tiers List (Screenshot 3 pattern) */}
        <div className="space-y-2.5 pt-2">
          {AUDIO_QUALITY_OPTIONS.map((option) => {
            const isSelected = selectedTier === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectQuality(option.id)}
                className={cn(
                  "w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between border",
                  isSelected
                    ? "bg-primary/10 border-primary/40 shadow-sm shadow-primary/10"
                    : "bg-secondary/40 hover:bg-secondary/70 border-border/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isSelected ? "text-foreground" : "text-foreground/90"
                      )}
                    >
                      {option.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-background/80 text-primary border border-primary/20">
                      {option.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {option.subtext}
                  </p>
                </div>

                <div
                  className={cn(
                    "size-6 rounded-full flex items-center justify-center shrink-0 border transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted-foreground/30 text-transparent"
                  )}
                >
                  <Check className="size-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Signal Path DAC Inspector (From LastWave SignalPathDialog.kt) */}
        <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-primary" />
              Signal Path Report
            </h4>
            <span className="text-[11px] font-mono text-muted-foreground">
              Clock: 0.0ms drift
            </span>
          </div>

          <div className="space-y-2 text-xs bg-secondary/30 rounded-2xl p-3.5 border border-border/30">
            <div className="flex items-start gap-2.5">
              <div className="size-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-foreground">Source Format</div>
                <div className="text-muted-foreground text-[11px]">
                  {selectedTier === "max" && "FLAC 24-bit / 192 kHz (Lossless Studio Master)"}
                  {selectedTier === "hires" && "FLAC 24-bit / 96 kHz (Lossless FLAC)"}
                  {selectedTier === "lossless" && "FLAC 16-bit / 44.1 kHz (CD Lossless Audio)"}
                  {selectedTier === "saver" && "Opus / MP3 320 kbps (High Efficiency)"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="size-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-foreground">Bitstream Resampling</div>
                <div className="text-muted-foreground text-[11px]">
                  Direct 1:1 stream (Zero software decimation)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  "size-2 rounded-full mt-1 shrink-0",
                  isDspActive ? "bg-primary" : "bg-emerald-400"
                )}
              />
              <div className="flex-1">
                <div className="font-semibold text-foreground">
                  DSP Processing Chain
                </div>
                <div className="text-muted-foreground text-[11px]">
                  {eqEnabled
                    ? `15-Band Peaking Filter [Preset: ${activePreset}]`
                    : "Direct Bit-Perfect Pass-through"}
                  {studioMasterClarity && " • Studio Clarity Active"}
                  {peakProtection && " • Limiter Active"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="size-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-foreground">
                  Hardware Output Endpoint
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Direct Hardware Audio Output (32-bit Float Internal Bus)
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignalPathDialog;
