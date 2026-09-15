import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  MessageSquareText,
  Moon,
  Radio,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "@/components/custom/ThemeProvider";
import { Switch } from "@/components/ui/switch";
import { checkForAppUpdates } from "@/utils/updater";
import useGetAppStatsQuery from "@/features/settings/api/useGetAppStatsQuery";
import {
  useAudioEffectsStore,
  type AudioQualityTier,
} from "@/features/audio/store/useAudioEffectsStore";
import EqualizerDialog from "@/features/audio/components/EqualizerDialog";
import SleepTimerDialog from "@/features/audio/components/SleepTimerDialog";
import ScrobblerDialog from "@/features/scrobbler/components/ScrobblerDialog";
import SignalPathDialog from "@/features/player/components/SignalPathDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

const QUALITY_TIERS: {
  id: AudioQualityTier;
  title: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: "max",
    title: "Max Quality",
    badge: "24-BIT / 192k",
    desc: "Up to 24-bit / 192 kHz • Lossless Studio FLAC",
  },
  {
    id: "hires",
    title: "Hi-Res Audio",
    badge: "24-BIT / 96k",
    desc: "24-bit / 96 kHz • Lossless Studio FLAC",
  },
  {
    id: "lossless",
    title: "CD Lossless",
    badge: "16-BIT / 44.1k",
    desc: "16-bit / 44.1 kHz • Lossless CD FLAC",
  },
  {
    id: "saver",
    title: "Standard Quality",
    badge: "320 kbps",
    desc: "320 kbps • MP3 (Data Saver)",
  },
];

const ACCENT_PRESETS = [
  { name: "Crimson", hex: "#E03030" },
  { name: "Violet", hex: "#7C4DFF" },
  { name: "Ocean", hex: "#2196C6" },
  { name: "Sage", hex: "#6B9E6B" },
  { name: "Amber", hex: "#E0A030" },
  { name: "Rose", hex: "#E0507A" },
];

function RouteComponent() {
  const { setTheme, theme, color, setColor } = useTheme();
  const audioQuality = useAudioEffectsStore((state) => state.audioQuality);
  const setAudioQuality = useAudioEffectsStore((state) => state.setAudioQuality);
  const liquidGlass = useAudioEffectsStore((state) => state.liquidGlass);
  const setLiquidGlass = useAudioEffectsStore((state) => state.setLiquidGlass);

  const [showQualitySheet, setShowQualitySheet] = useState(false);
  const [bitPerfectEnabled, setBitPerfectEnabled] = useState(false);
  const [lyricsAnimEnabled, setLyricsAnimEnabled] = useState(true);

  const { data } = useGetAppStatsQuery();

  const handleBack = () => {
    window.history.back();
  };

  const handleViewOnGitHub = async () => {
    await openUrl("https://github.com/kaungset03/sonara");
  };

  const qualityLabel =
    audioQuality === "max"
      ? "Max (24-bit / 192 kHz)"
      : audioQuality === "hires"
        ? "Hi-Res (24-bit / 96 kHz)"
        : audioQuality === "lossless"
          ? "CD Lossless (16-bit / 44.1 kHz)"
          : "Standard (320 kbps)";

  return (
    <main className="p-4 sm:p-6 pt-[calc(4.25rem+env(safe-area-inset-top,0px))] pb-32 sm:pb-36 w-full h-screen overflow-y-auto custom-scrollbar space-y-6 max-w-2xl mx-auto select-none">
      {/* Top Header Bar (Screenshot 3) */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={handleBack}
          className="size-11 rounded-full bg-[#1b2025] hover:bg-zinc-800 text-white flex items-center justify-center border border-white/5 active:scale-95 transition shadow-xs cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
          Settings
        </h1>
      </div>

      {/* 1. Experimental Section (Screenshot 3) */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Experimental
        </div>

        <div className="rounded-3xl bg-[#14171a] border border-white/5 overflow-hidden shadow-xl divide-y divide-white/5">
          {/* Liquid Glass */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="size-11 rounded-2xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0">
                <Layers className="size-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  Liquid Glass
                </div>
                <div className="text-xs text-zinc-400 leading-snug">
                  iOS-style translucent materials across the app
                </div>
              </div>
            </div>
            <Switch
              checked={liquidGlass}
              onCheckedChange={setLiquidGlass}
              className="shrink-0"
              aria-label="Toggle Liquid Glass"
            />
          </div>

          {/* Lyrics Animation */}
          <div
            onClick={() => setLyricsAnimEnabled(!lyricsAnimEnabled)}
            className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="size-11 rounded-2xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                <MessageSquareText className="size-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  Lyrics Animation
                </div>
                <div className="text-xs text-zinc-400 leading-snug truncate">
                  Apple Fluid • Smooth spring scaling with dynamic focal tracking
                </div>
              </div>
            </div>
            <ChevronRight className="size-5 text-zinc-500 shrink-0" />
          </div>

          {/* Equalizer Trigger */}
          <EqualizerDialog
            trigger={
              <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition cursor-pointer w-full text-left">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                    <Sliders className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm sm:text-base font-bold text-white truncate">
                      Equalizer
                    </div>
                    <div className="text-xs text-zinc-400 leading-snug">
                      Shape your sound across 15 frequencies
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 text-zinc-500 shrink-0" />
              </div>
            }
          />
        </div>
      </div>

      {/* 2. Audio & Streaming Fidelity Section */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Audio & Streaming Fidelity
        </div>

        <div className="rounded-3xl bg-[#14171a] border border-white/5 overflow-hidden shadow-xl divide-y divide-white/5">
          {/* Streaming Quality (Opens Screenshot 3 Modal) */}
          <div
            onClick={() => setShowQualitySheet(true)}
            className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="size-11 rounded-2xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0 font-bold text-xs">
                HQ
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  Streaming Quality
                </div>
                <div className="text-xs text-zinc-400 leading-snug truncate">
                  {qualityLabel} • YouTube Music fallback
                </div>
              </div>
            </div>
            <ChevronRight className="size-5 text-zinc-500 shrink-0" />
          </div>

          {/* Bit-Perfect DAC Pass-Through */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="size-11 rounded-2xl bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                <SlidersHorizontal className="size-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  Bit-Perfect DAC Mode
                </div>
                <div className="text-xs text-zinc-400 leading-snug">
                  Bypass system mixer for bit-exact hardware fidelity
                </div>
              </div>
            </div>
            <Switch
              checked={bitPerfectEnabled}
              onCheckedChange={setBitPerfectEnabled}
              className="shrink-0"
              aria-label="Toggle Bit-Perfect Mode"
            />
          </div>

          {/* Signal Path Dialog */}
          <SignalPathDialog
            trigger={
              <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition cursor-pointer w-full text-left">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="size-11 rounded-2xl bg-sky-950/60 border border-sky-500/20 flex items-center justify-center text-sky-300 shrink-0">
                    <Activity className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm sm:text-base font-bold text-white truncate">
                      Signal Path
                    </div>
                    <div className="text-xs text-zinc-400 leading-snug">
                      Inspect active audio engine, sample rate & DAC bit depth
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 text-zinc-500 shrink-0" />
              </div>
            }
          />
        </div>
      </div>

      {/* 3. Scrobblers & Integrations Section */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Scrobbler & Integrations
        </div>

        <div className="rounded-3xl bg-[#14171a] border border-white/5 overflow-hidden shadow-xl divide-y divide-white/5">
          <ScrobblerDialog
            trigger={
              <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition cursor-pointer w-full text-left">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="size-11 rounded-2xl bg-rose-950/60 border border-rose-500/20 flex items-center justify-center text-rose-300 shrink-0">
                    <Radio className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm sm:text-base font-bold text-white truncate">
                      Scrobbler Apps
                    </div>
                    <div className="text-xs text-zinc-400 leading-snug">
                      Sync listening history to Last.fm & ListenBrainz
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 text-zinc-500 shrink-0" />
              </div>
            }
          />

          <SleepTimerDialog
            trigger={
              <div className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition cursor-pointer w-full text-left">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="size-11 rounded-2xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
                    <Moon className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm sm:text-base font-bold text-white truncate">
                      Sleep Timer & Auto-Fade
                    </div>
                    <div className="text-xs text-zinc-400 leading-snug">
                      Automatically halt playback after set duration
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 text-zinc-500 shrink-0" />
              </div>
            }
          />
        </div>
      </div>

      {/* 4. Appearance & Accent Color Section */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Appearance & Accent
        </div>

        <div className="rounded-3xl bg-[#14171a] border border-white/5 overflow-hidden shadow-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm sm:text-base font-bold text-white">AMOLED Pitch Black</div>
              <div className="text-xs text-zinc-400">Pure black dark theme for battery saving</div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(val) => setTheme(val ? "dark" : "system")}
              aria-label="Toggle AMOLED Dark"
            />
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2.5">
            <div className="text-xs font-semibold text-zinc-400">Accent Presets</div>
            <div className="flex items-center gap-3">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setColor(preset.name)}
                  style={{ backgroundColor: preset.hex }}
                  className={`size-8 rounded-full transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-md ${
                    color === preset.name
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#14171a] scale-110"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  aria-label={preset.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. About Section */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">About</div>

        <div className="rounded-3xl bg-[#14171a] border border-white/5 overflow-hidden shadow-xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-13 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-xl font-heading shadow-md">
              LW
            </div>
            <div className="space-y-0.5">
              <div className="text-base font-bold text-white font-heading">LastWave Engine</div>
              <div className="text-xs text-zinc-400">
                High-performance lossless audio streaming & local playback
              </div>
              <div className="text-[11px] font-mono text-cyan-400 font-semibold">
                v{data?.app_version || "0.6.7"} (Native Engine Parity)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
            <button
              onClick={() => checkForAppUpdates({ showNoUpdate: true })}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="size-3.5 text-cyan-300" />
              <span>Check for Updates</span>
            </button>

            <button
              onClick={handleViewOnGitHub}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <ExternalLink className="size-3.5 text-cyan-300" />
              <span>Source Repository</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. STREAMING QUALITY BOTTOM SHEET (Exact 1:1 Match of Screenshot 3) */}
      <Dialog open={showQualitySheet} onOpenChange={setShowQualitySheet}>
        <DialogContent
          showCloseButton={false}
          className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 max-w-none sm:max-w-md sm:left-1/2 sm:-translate-x-1/2 rounded-t-[32px] sm:rounded-3xl bg-[#0e1114] border-t sm:border border-white/10 p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden"
        >
          {/* Sheet Handle */}
          <div className="w-10 h-1.5 bg-zinc-600/80 rounded-full mx-auto mb-1" />

          {/* Header Row */}
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-xs shrink-0 shadow-md">
                HQ
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold font-heading text-white tracking-tight">
                  Streaming Quality
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Select preferred audio resolution & bit depth
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Info Description */}
          <p className="text-xs text-zinc-400 leading-relaxed">
            If a track is unavailable in the chosen quality, the highest available quality will be
            streamed automatically.
          </p>

          {/* 4 Quality Tiers (Screenshot 3) */}
          <div className="space-y-2.5 pt-1">
            {QUALITY_TIERS.map((tier) => {
              const isSelected =
                audioQuality === tier.id ||
                (tier.id === "max" && audioQuality === "high") ||
                (tier.id === "hires" && audioQuality === "balanced");

              return (
                <div
                  key={tier.id}
                  onClick={() => {
                    setAudioQuality(tier.id);
                    setShowQualitySheet(false);
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-[#142634] border-cyan-400 shadow-md"
                      : "bg-[#161a1e] border-white/5 hover:bg-[#1c2227]"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-white">
                        {tier.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 text-cyan-300 border border-cyan-500/20">
                        {tier.badge}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 truncate">{tier.desc}</div>
                  </div>

                  {/* Circular Checkmark if selected */}
                  {isSelected && (
                    <div className="size-7 rounded-full bg-cyan-400 text-black flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="size-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default RouteComponent;
