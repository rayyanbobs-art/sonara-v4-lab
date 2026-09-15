import { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Download,
  Heart,
  Loader2,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Disc3,
  Check,
  SquarePlus,
  User,
  Sliders,
  Moon,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WavySeekBar from "./WavySeekBar";
import SignalPathDialog from "./SignalPathDialog";
import useArtworkPalette from "../hooks/useArtworkPalette";
import { getFormattedDuration } from "@/lib/helpers";
import useAppStore from "@/store/app-store";
import PlaybackQueue from "@/features/queue/components/PlaybackQueue";
import MarqueeText from "@/components/custom/MarqueText";
import ActionsDropdown from "@/features/songs/components/ActionsDropdown";
import AddToPlaylistDialog from "@/features/playlists/components/AddToPlaylistDialog";
import LyricsSection from "@/features/lyrics/components/LyricsSection";
import EqualizerDialog from "@/features/audio/components/EqualizerDialog";
import SleepTimerDialog from "@/features/audio/components/SleepTimerDialog";
import CastButton from "./CastButton";
import { getOptimizedThumbnail } from "@/utils/thumbnail";
import useDownloadTrack from "@/features/online/hooks/useDownloadTrack";
import { isOnlineSong } from "@/lib/onlineTrack";

type OverlayPlayerProps = {
  isExpanded: boolean;
  collapse: () => void;
  song: Song;
  position: number;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: number) => void;
  toggleFavorite: () => void;
};

const OverlayPlayer = ({
  isExpanded,
  collapse,
  song,
  position,
  duration,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  toggleFavorite,
}: OverlayPlayerProps) => {
  const [mobileTab, setMobileTab] = useState<"track" | "lyrics">("track");
  const [desktopTab, setDesktopTab] = useState<"lyrics" | "credits">("lyrics");
  const downloadMutation = useDownloadTrack();
  const isOnline = isOnlineSong(song);

  const isShuffle = useAppStore((state) => state.isShuffle);
  const setIsShuffle = useAppStore((state) => state.setIsShuffle);

  const repeatMode = useAppStore((state) => state.repeatMode);
  const toggleRepeatMode = useAppStore((state) => state.toggleRepeatMode);

  const currentPlatform = platform();
  const isMacOS = currentPlatform === "macos";

  const rawCover = song.album_cover_path
    ? song.album_cover_path.startsWith("http://") ||
      song.album_cover_path.startsWith("https://")
      ? song.album_cover_path
      : convertFileSrc(song.album_cover_path)
    : "";

  const coverSrc = rawCover.startsWith("http")
    ? getOptimizedThumbnail(rawCover, "full")
    : rawCover;

  const palette = useArtworkPalette(coverSrc);

  return (
    <section className="fixed inset-0 z-50 pointer-events-none">
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${
          isExpanded ? "opacity-100" : "opacity-0"
        }`}
        onClick={collapse}
      >
        {/* Safe ambient color glow (mobile & desktop) using dynamic album art palette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-55 transition-all duration-700 pointer-events-none"
          style={{ background: palette.glowGradient }}
        />
        {/* Solid overlay */}
        <div className="absolute inset-0 bg-background/85 md:bg-background/90 backdrop-blur-md md:backdrop-blur-2xl" />
      </div>
      <div
        className={`absolute inset-0 w-full h-full flex flex-col ${
          isExpanded ? "translate-y-0" : "translate-y-full"
        } transition-transform duration-300 ease-out pointer-events-auto overflow-hidden safe-top safe-bottom will-change-transform`}
      >
        {/* Top Header Bar (Material 3 Expressive Style matching LastWave Screenshot 5) */}
        <div
          data-tauri-drag-region={isMacOS}
          className="w-full h-14 shrink-0 flex items-center justify-between px-4 pt-1"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={collapse}
            className="size-10 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground border border-white/5 shadow-xs"
            aria-label="Collapse Player"
          >
            <ChevronDown className="size-5" />
          </Button>

          {/* Mobile Context Title */}
          <div className="flex md:hidden flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground/80">
              NOW PLAYING
            </span>
            <span className="text-xs font-bold font-heading text-foreground truncate max-w-[190px]">
              {song.album_name || "Sonara Stream"}
            </span>
          </div>

          <div className="flex items-center gap-x-1.5">
            {isOnline && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex rounded-full"
                disabled={downloadMutation.isPending || downloadMutation.isSuccess}
                onClick={() => downloadMutation.mutate({ song })}
              >
                {downloadMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : downloadMutation.isSuccess ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
            )}
            <SignalPathDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex rounded-full size-9 text-muted-foreground hover:text-foreground active:scale-90 transition-transform font-bold text-[10px]"
                  aria-label="Streaming Quality & Signal Path"
                >
                  HQ
                </Button>
              }
            />
            <EqualizerDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full size-9 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                  aria-label="Equalizer"
                >
                  <Sliders className="size-4.5" />
                </Button>
              }
            />
            <SleepTimerDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full size-9 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                  aria-label="Sleep Timer"
                >
                  <Moon className="size-4.5" />
                </Button>
              }
            />
            <CastButton />
            <ActionsDropdown song={song}>
              <AddToPlaylistDialog song={song} />
            </ActionsDropdown>
            <div className="hidden md:block">
              <PlaybackQueue />
            </div>
          </div>
        </div>

        {/* Content Container: Dual-column on desktop, Tab-switched on mobile */}
        <div className="flex-1 w-full max-w-6xl mx-auto overflow-hidden px-4 pb-6">
          {/* Desktop Layout Matching Figma desktop_song.png (>= md) */}
          <div className="hidden md:flex flex-col h-full overflow-y-auto custom-scrollbar gap-6 pr-2 pb-12">
            {/* Upper Hero Section */}
            <div className="flex items-start gap-8 lg:gap-10 pt-4">
              {/* Hero Artwork */}
              <div className="size-60 lg:size-72 xl:size-80 rounded-2xl bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center overflow-hidden shadow-2xl border border-white/10 shrink-0">
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt={song.title}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <Music className="size-24 text-primary/70" />
                )}
              </div>

              {/* Song Information & Actions */}
              <div className="flex-1 min-w-0 space-y-4 pt-1">
                <div className="space-y-2">
                  <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black font-heading tracking-tight text-foreground leading-tight">
                    {song.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <User className="size-3.5 text-primary" />
                      <span>{song.artist_name || "Unknown Artist"}</span>
                    </div>
                    {song.album_name && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <Disc3 className="size-3.5 text-muted-foreground" />
                          <span>{song.album_name}</span>
                        </div>
                      </>
                    )}
                    <span>•</span>
                    <span className="font-mono">{getFormattedDuration(duration)}</span>
                  </div>
                </div>

                {/* Primary Action Button Row (Figma Style) */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    size="icon-lg"
                    className="rounded-full size-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                    onClick={isPlaying ? onPause : onPlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current ml-0.5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-10 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                    onClick={toggleFavorite}
                    aria-label="Toggle Favorite"
                  >
                    {song.is_favorite ? (
                      <Heart className="size-5 text-primary fill-current" />
                    ) : (
                      <Heart className="size-5" />
                    )}
                  </Button>

                  <AddToPlaylistDialog
                    song={song}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full size-10 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                        aria-label="Add to Playlist"
                      >
                        <SquarePlus className="size-5" />
                      </Button>
                    }
                  />

                  {isOnline && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-10 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                      disabled={downloadMutation.isPending || downloadMutation.isSuccess}
                      onClick={() => downloadMutation.mutate({ song })}
                      aria-label="Download Track"
                    >
                      {downloadMutation.isPending ? (
                        <Loader2 className="size-5 animate-spin text-primary" />
                      ) : downloadMutation.isSuccess ? (
                        <Check className="size-5 text-emerald-400" />
                      ) : (
                        <Download className="size-5" />
                      )}
                    </Button>
                  )}

                  <ActionsDropdown song={song}>
                    <AddToPlaylistDialog song={song} />
                  </ActionsDropdown>
                </div>

                {/* Genre Tags (Figma desktop_song.png) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Electronic", "Pop", "Streaming", "Favorites"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold bg-muted border border-border text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Artist Credits Card */}
                <div className="flex items-center gap-3 pt-3 border-t border-border/60 max-w-md">
                  <div className="size-10 rounded-full bg-linear-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    <User className="size-4.5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-bold text-foreground truncate">
                      {song.artist_name || "Unknown Artist"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Main artist &bull; Composer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lower Section: Tabs & Synced Lyrics */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              {/* Tabs matching Figma */}
              <div className="flex items-center gap-6 border-b border-border/60 pb-2">
                <button
                  onClick={() => setDesktopTab("lyrics")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    desktopTab === "lyrics" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Lyrics
                  {desktopTab === "lyrics" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setDesktopTab("credits")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    desktopTab === "credits" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Credits
                  {desktopTab === "credits" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {desktopTab === "lyrics" ? (
                <div className="w-full min-h-[260px] flex flex-col justify-center">
                  <LyricsSection
                    song={song}
                    position={position}
                    onSeek={onSeek}
                    accentColor={palette.accent}
                  />
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-card border border-border max-w-xl space-y-3">
                  <h3 className="text-base font-bold text-foreground">Track Credits</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p><span className="text-foreground font-semibold">Title:</span> {song.title}</p>
                    <p><span className="text-foreground font-semibold">Artist:</span> {song.artist_name || "Unknown"}</p>
                    <p><span className="text-foreground font-semibold">Album:</span> {song.album_name || "Unknown"}</p>
                    <p><span className="text-foreground font-semibold">Duration:</span> {getFormattedDuration(duration)}</p>
                    <p><span className="text-foreground font-semibold">Source:</span> {isOnline ? "Online Stream" : "Local Audio"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout (Material 3 Expressive matching LastWave Screenshot 5) */}
          <div className="flex md:hidden flex-col h-full overflow-hidden">
            {mobileTab === "track" ? (
              <div className="flex-1 flex flex-col justify-between py-2 max-w-sm mx-auto w-full px-4 overflow-y-auto">
                {/* Large Rounded Artwork (Screenshot 5: rounded-3xl) */}
                <div className="flex-1 min-h-0 flex items-center justify-center py-2">
                  <div className="w-full max-w-[84vw] aspect-square rounded-3xl bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center overflow-hidden shadow-2xl border border-white/10">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={song.title}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <Music className="size-20 text-primary/70" />
                    )}
                  </div>
                </div>

                {/* Track Details, Artist Capsule Chip & Lyrics Toggle (Screenshot 5) */}
                <div className="flex items-center justify-between py-2 gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <MarqueeText
                      text={song.title}
                      className="text-2xl font-bold leading-tight font-heading truncate text-foreground"
                    />
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1 rounded-full bg-secondary/80 border border-border/40 text-xs font-semibold text-foreground truncate max-w-[210px] shadow-xs">
                        {song.artist_name || "Unknown Artist"}
                      </span>
                      <button
                        onClick={toggleFavorite}
                        className="p-1 text-muted-foreground hover:text-foreground active:scale-90 transition-transform shrink-0"
                        aria-label="Toggle Favorite"
                      >
                        {song.is_favorite ? (
                          <Heart className="size-4 text-primary fill-current" />
                        ) : (
                          <Heart className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setMobileTab("lyrics")}
                    className="size-11 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground border border-white/5 shadow-xs flex items-center justify-center active:scale-95 transition-all shrink-0"
                    aria-label="Open Lyrics"
                  >
                    <MessageSquareText className="size-5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                {/* Dynamic Wavy Timeline Scrubber (Material 3 Expressive) */}
                <div className="pt-1 pb-1">
                  <WavySeekBar
                    position={position}
                    duration={duration}
                    isPlaying={isPlaying}
                    onSeek={onSeek}
                    primaryColor={palette.accent}
                    accentColor={palette.dominant}
                    showTimeLabels={true}
                  />
                </div>

                {/* Transport Controls Cluster (Screenshot 5: circular previous/next, soft cream squircle play/pause) */}
                <div className="flex items-center justify-center gap-5 px-1 py-3">
                  <button
                    onClick={onPrevious}
                    className="rounded-full size-15 bg-[#1b2229] hover:bg-[#252e37] text-white flex items-center justify-center border border-white/5 shadow-md active:scale-90 transition-transform"
                    aria-label="Previous Track"
                  >
                    <SkipBack className="size-6 fill-current" />
                  </button>
                  <button
                    onClick={isPlaying ? onPause : onPlay}
                    className="rounded-[28px] size-20 bg-[#dbe4ec] text-[#12171c] hover:bg-white shadow-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="size-8 fill-current" />
                    ) : (
                      <Play className="size-8 fill-current ml-1" />
                    )}
                  </button>
                  <button
                    onClick={onNext}
                    className="rounded-full size-15 bg-[#1b2229] hover:bg-[#252e37] text-white flex items-center justify-center border border-white/5 shadow-md active:scale-90 transition-transform"
                    aria-label="Next Track"
                  >
                    <SkipForward className="size-6 fill-current" />
                  </button>
                </div>

                {/* Bottom Action Row (Screenshot 5: Shuffle, Audio Quality Pill [HQ FLAC 24/96], Repeat) */}
                <div className="flex items-center justify-between gap-3 pt-3 pb-2 px-1 border-t border-white/5">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={cn(
                      "rounded-2xl h-14 flex-1 flex items-center justify-center border transition-all active:scale-95 shadow-xs cursor-pointer",
                      isShuffle
                        ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/30"
                        : "bg-[#14191e] hover:bg-[#1c2228] text-white border-white/5"
                    )}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="size-5" />
                  </button>

                  <SignalPathDialog
                    trigger={
                      <button
                        className="rounded-2xl h-14 px-5 bg-[#14191e] hover:bg-[#1c2228] border border-white/5 flex items-center justify-center gap-2 text-xs font-bold text-white active:scale-95 transition-all shrink-0 shadow-xs cursor-pointer"
                        aria-label="Audio Quality and Signal Path"
                      >
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 border border-cyan-500/30">
                          HQ
                        </span>
                        <span className="tracking-wide">
                          FLAC 24/96
                        </span>
                      </button>
                    }
                  />

                  <button
                    onClick={toggleRepeatMode}
                    className={cn(
                      "rounded-2xl h-14 flex-1 flex items-center justify-center border transition-all active:scale-95 shadow-xs cursor-pointer",
                      repeatMode !== "off"
                        ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/30"
                        : "bg-[#14191e] hover:bg-[#1c2228] text-white border-white/5"
                    )}
                    aria-label="Repeat Mode"
                  >
                    {repeatMode === "off" && <Repeat className="size-5" />}
                    {repeatMode === "one" && <Repeat1 className="size-5" />}
                    {repeatMode === "all" && <Repeat className="size-5" />}
                  </button>
                </div>
              </div>
            ) : (
              /* Mobile Lyrics View */
              <div className="flex-1 flex flex-col justify-between py-2 max-w-sm mx-auto w-full px-4 overflow-hidden">
                <div className="flex-1 overflow-hidden py-2">
                  <LyricsSection
                    song={song}
                    position={position}
                    onSeek={onSeek}
                    accentColor={palette.accent}
                  />
                </div>

                <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Button
                      size="icon"
                      className="rounded-full size-10 bg-primary text-primary-foreground shadow-md shadow-primary/25 shrink-0"
                      onClick={isPlaying ? onPause : onPlay}
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <Pause className="size-5 fill-current" />
                      ) : (
                        <Play className="size-5 fill-current ml-0.5" />
                      )}
                    </Button>
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate text-foreground">{song.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{song.artist_name || "Unknown"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMobileTab("track")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-xs active:scale-95 transition-transform"
                      aria-label="Back to Track View"
                    >
                      <Disc3 className="size-3.5" />
                      <span>Track</span>
                    </button>
                    <PlaybackQueue />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OverlayPlayer;
