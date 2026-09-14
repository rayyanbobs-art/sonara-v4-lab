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
  Mic2,
  Disc3,
  Check,
  SquarePlus,
  User,
  Sliders,
  Moon,
} from "lucide-react";
import WavySeekBar from "./WavySeekBar";
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
        {/* Top Header Bar (Figma Spotify Style) */}
        <div
          data-tauri-drag-region={isMacOS}
          className="w-full h-14 shrink-0 flex items-center justify-between px-4 pt-1"
        >
          <Button variant="ghost" size="icon" onClick={collapse} className="rounded-full" aria-label="Collapse Player">
            <ChevronDown className="size-5" />
          </Button>

          {/* Mobile Context Title */}
          <div className="flex md:hidden flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">
              Playing from library
            </span>
            <span className="text-xs font-bold font-heading text-foreground truncate max-w-[180px]">
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
            <ActionsDropdown song={song}>
              <AddToPlaylistDialog song={song} />
            </ActionsDropdown>
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

          {/* Mobile Layout (visible on screens < md) */}
          <div className="flex md:hidden flex-col h-full overflow-hidden">
            {mobileTab === "track" ? (
              <div className="flex-1 flex flex-col justify-between py-2 max-w-sm mx-auto w-full px-4 overflow-y-auto">
                {/* Artwork */}
                <div className="flex-1 min-h-0 flex items-center justify-center py-2">
                  <div className="w-full max-w-[82vw] aspect-square rounded-2xl bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center overflow-hidden shadow-2xl border border-white/10">
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

                {/* Track Details & Favorite */}
                <div className="flex items-center justify-between py-2">
                  <div className="min-w-0 flex-1 pr-3 space-y-0.5">
                    <MarqueeText
                      text={song.title}
                      className="text-xl font-bold leading-tight font-heading truncate"
                    />
                    <MarqueeText
                      text={song.artist_name || "Unknown Artist"}
                      className="text-sm text-muted-foreground font-medium truncate"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-11 shrink-0 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                    onClick={toggleFavorite}
                    aria-label="Toggle Favorite"
                  >
                    {song.is_favorite ? (
                      <Heart className="size-6 text-primary fill-current" />
                    ) : (
                      <Heart className="size-6" />
                    )}
                  </Button>
                </div>

                {/* Dynamic Wavy Timeline Scrubber (Material 3 Expressive) */}
                <div className="pt-1 pb-2">
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

                {/* Transport Controls (5 buttons, 64px central play) */}
                <div className="flex items-center justify-between px-1 py-1">
                  <Button
                    variant={isShuffle ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-full size-10 ${isShuffle ? "bg-primary/20 text-primary hover:bg-primary/30" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setIsShuffle(!isShuffle)}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="size-[18px]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-12 text-foreground active:scale-90 transition-transform"
                    onClick={onPrevious}
                    aria-label="Previous Track"
                  >
                    <SkipBack className="size-6" />
                  </Button>
                  <Button
                    size="icon-lg"
                    className="rounded-full size-16 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 active:scale-95 transition-transform"
                    onClick={isPlaying ? onPause : onPlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="size-7 fill-current" />
                    ) : (
                      <Play className="size-7 fill-current ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-12 text-foreground active:scale-90 transition-transform"
                    onClick={onNext}
                    aria-label="Next Track"
                  >
                    <SkipForward className="size-6" />
                  </Button>
                  <Button
                    variant={repeatMode !== "off" ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-full size-10 ${repeatMode !== "off" ? "bg-primary/20 text-primary hover:bg-primary/30" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={toggleRepeatMode}
                    aria-label="Repeat Mode"
                  >
                    {repeatMode === "off" && <Repeat className="size-[18px]" />}
                    {repeatMode === "one" && <Repeat1 className="size-[18px]" />}
                    {repeatMode === "all" && <Repeat className="size-[18px]" />}
                  </Button>
                </div>

                {/* Bottom Utility Row: Download / Lyrics Switcher / Queue */}
                <div className="flex items-center justify-between pt-3 pb-2 px-2 border-t border-white/5">
                  <div className="w-10 flex items-center justify-start">
                    {isOnline ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full size-10 text-muted-foreground hover:text-foreground"
                        disabled={downloadMutation.isPending || downloadMutation.isSuccess}
                        onClick={() => downloadMutation.mutate({ song })}
                        aria-label="Download Song"
                      >
                        {downloadMutation.isPending ? (
                          <Loader2 className="size-4.5 animate-spin text-primary" />
                        ) : downloadMutation.isSuccess ? (
                          <Check className="size-4.5 text-emerald-500" />
                        ) : (
                          <Download className="size-4.5" />
                        )}
                      </Button>
                    ) : (
                      <div className="size-10" />
                    )}
                  </div>

                  <button
                    onClick={() => setMobileTab("lyrics")}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-xs font-medium text-muted-foreground hover:text-foreground border border-white/10"
                    aria-label="Open Lyrics"
                  >
                    <Mic2 className="size-3.5 text-primary" />
                    <span>Lyrics</span>
                  </button>

                  <div className="w-10 flex items-center justify-end">
                    <PlaybackQueue />
                  </div>
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
