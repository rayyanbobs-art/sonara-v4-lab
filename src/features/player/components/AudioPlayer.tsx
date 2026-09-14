import {
  ChevronUp,
  Heart,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SquarePlus,
  Volume2,
  VolumeOff,
  Sliders,
  Moon,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import WavySeekBar from "./WavySeekBar";
import useArtworkPalette from "../hooks/useArtworkPalette";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import useAppStore from "@/store/app-store";
import useToggleFavoriteMutation from "@/features/songs/api/useToggleFavoriteMutation";
import PlaybackQueue from "@/features/queue/components/PlaybackQueue";
import OverlayPlayer from "@/features/player/components/OverlayPlayer";
import AddToPlaylistDialog from "@/features/playlists/components/AddToPlaylistDialog";
import webAudioEngine from "@/features/audio/services/webAudioEngine";
import useAudioEffectsStore from "@/features/audio/store/useAudioEffectsStore";
import EqualizerDialog from "@/features/audio/components/EqualizerDialog";
import SleepTimerDialog from "@/features/audio/components/SleepTimerDialog";
import useMediaSession from "@/hooks/useMediaSession";
import MarqueeText from "@/components/custom/MarqueText";
import { isOnlineSong, getOnlineVideoId } from "@/lib/onlineTrack";
import { getOptimizedThumbnail } from "@/utils/thumbnail";
import { toast } from "sonner";
import {
  isAndroidPlatform,
  androidLoadTrack,
  androidPlay,
  androidPause,
  androidSeek,
  androidSetVolume,
  androidStop,
} from "@/services/androidPlayback";

const getAudioMimeType = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "m4a":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    case "flac":
      return "audio/flac";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "opus":
      return "audio/opus";
    case "aac":
      return "audio/aac";
    case "webm":
      return "audio/webm";
    default:
      return "audio/mp4";
  }
};

type AudioPlayerProps = {
  currentSong: Song;
};

interface WindowWithAndroidMedia extends Window {
  AndroidMedia?: {
    stopPlayback?: () => void;
    updateTrackMetadata?: (metadataJson: string) => void;
    updatePlaybackState?: (isPlaying: boolean, position: number, duration: number) => void;
  };
}

const AudioPlayer = ({ currentSong }: AudioPlayerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const playerRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  const hasCountedPlayRef = useRef(false);
  const lastSongIdRef = useRef<number | null>(null);
  const localRetryCountRef = useRef(0);

  const next = useAppStore((state) => state.next);
  const previous = useAppStore((state) => state.previous);
  const stopPlayback = useAppStore((state) => state.stopPlayback);

  const isPlaying = useAppStore((state) => state.isPlaying);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);

  const isShuffle = useAppStore((state) => state.isShuffle);
  const setIsShuffle = useAppStore((state) => state.setIsShuffle);

  const muted = useAppStore((state) => state.muted);
  const setMuted = useAppStore((state) => state.setMuted);
  const volume = useAppStore((state) => state.volume);
  const setVolume = useAppStore((state) => state.setVolume);

  const repeatMode = useAppStore((state) => state.repeatMode);
  const toggleRepeatMode = useAppStore((state) => state.toggleRepeatMode);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Swipe to dismiss/stop states
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const { mutate } = useToggleFavoriteMutation();

  const [isResolvingStream, setIsResolvingStream] = useState(false);
  const activeRequestIdRef = useRef<string | null>(null);

  const collapse = () => {
    setIsExpanded(false);
  };

  // Initialize WebAudio DSP chain (15-band EQ + peak limiter + crossfeed) on desktop
  useEffect(() => {
    if (playerRef.current && !isAndroidPlatform()) {
      webAudioEngine.init(playerRef.current);
    }
  }, []);

  // Sleep Timer watcher
  const sleepTimerEndsAt = useAudioEffectsStore((state) => state.sleepTimerEndsAt);
  const sleepTimerType = useAudioEffectsStore((state) => state.sleepTimerType);
  const cancelSleepTimer = useAudioEffectsStore((state) => state.cancelSleepTimer);

  useEffect(() => {
    if (!sleepTimerEndsAt) return;
    const checkTimer = () => {
      const now = Date.now();
      if (now >= sleepTimerEndsAt) {
        if (playerRef.current) {
          webAudioEngine.fadeOutAndPause(playerRef.current, 1500);
        } else if (isAndroidPlatform()) {
          androidPause();
        }
        setIsPlaying(false);
        cancelSleepTimer();
        toast.info("Sleep timer ended. Playback paused.");
      }
    };
    const timer = setInterval(checkTimer, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerEndsAt, cancelSleepTimer, setIsPlaying]);

  const handleStopAndDismiss = () => {
    if (isAndroidPlatform()) {
      androidStop();
    } else if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.currentTime = 0;
      playerRef.current.src = "";
    }
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    if (activeRequestIdRef.current) {
      invoke("cancel_stream_request", { videoId: activeRequestIdRef.current }).catch(() => {});
      activeRequestIdRef.current = null;
    }
    if (typeof window !== "undefined") {
      const androidWindow = window as unknown as WindowWithAndroidMedia;
      if (typeof androidWindow.AndroidMedia?.stopPlayback === "function") {
        try {
          androidWindow.AndroidMedia.stopPlayback();
        } catch (err) {
          console.warn("AndroidMedia.stopPlayback error:", err);
        }
      }
    }
    setIsPlaying(false);
    stopPlayback();
    toast.info("Playback stopped", { duration: 1200 });
  };

  const handleFavoriteToggle = () => {
    if (currentSong) {
      mutate({ song: currentSong, isFavorite: !currentSong.is_favorite });
    }
  };

  const playAudio = () => {
    if (isAndroidPlatform()) {
      androidPlay();
      setIsPlaying(true);
    } else if (playerRef.current) {
      playerRef.current.play();
    }
  };

  const pauseAudio = () => {
    if (isAndroidPlatform()) {
      androidPause();
      setIsPlaying(false);
    } else if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const handleNext = () => {
    next();
  };

  const handlePrevious = () => {
    previous();
  };

  const handleEnded = () => {
    if (currentSong.id <= 0) {
      invoke("record_play_event", {
        track: {
          id: currentSong.online_id || String(currentSong.id),
          title: currentSong.title,
          artist: currentSong.artist_name,
          duration: Math.round(duration || 0),
          thumbnail: currentSong.album_cover_path || "",
          source: currentSong.online_id ? "youtube" : "local",
          signature: "",
        },
        completed: true,
        skipped_before_seconds: null,
      }).catch(() => {});
    }

    if (sleepTimerType === "end_of_track") {
      cancelSleepTimer();
      setIsPlaying(false);
      toast.info("Playback ended (Sleep Timer).");
      return;
    }

    if (repeatMode === "one") {
      if (playerRef.current) {
        playerRef.current.currentTime = 0;
        playerRef.current.play();
      }
    } else {
      next();
    }
  };

  const handleAudioError = () => {
    const player = playerRef.current;
    if (!player) return;

    const resumePosition = player.currentTime || currentTime || 0;

    if (isOnlineSong(currentSong)) {
      const videoId = getOnlineVideoId(currentSong);
      if (!videoId) return;
      console.warn("Audio element error on online track, retrying with bypassCache at position:", resumePosition);
      invoke<string>("get_stream_url", { id: videoId, bypassCache: true })
        .then((streamUrl) => {
          if (playerRef.current && activeRequestIdRef.current === videoId) {
            playerRef.current.src = streamUrl;
            if (resumePosition > 0) {
              playerRef.current.currentTime = resumePosition;
            }
            playerRef.current.play().catch(() => {});
          }
        })
        .catch((err) => console.error("Stream retry failed:", err));
    } else if (currentSong?.path) {
      if (localRetryCountRef.current >= 2) {
        console.error("Local playback error persisted after max retries:", currentSong.path);
        toast.error("Playback stopped: unable to decode audio track");
        setIsPlaying(false);
        return;
      }
      localRetryCountRef.current += 1;

      console.warn("Attempting local audio recovery via read_audio_file binary IPC at position:", resumePosition);
      invoke<ArrayBuffer>("read_audio_file", { path: currentSong.path })
        .then((fileBuffer) => {
          if (!playerRef.current || !fileBuffer || fileBuffer.byteLength === 0) return;
          if (activeBlobUrlRef.current) {
            URL.revokeObjectURL(activeBlobUrlRef.current);
            activeBlobUrlRef.current = null;
          }
          const mimeType = getAudioMimeType(currentSong.path);
          const blob = new Blob([fileBuffer], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          activeBlobUrlRef.current = blobUrl;
          playerRef.current.src = blobUrl;
          if (resumePosition > 0) {
            playerRef.current.currentTime = resumePosition;
          }
          playerRef.current.play().catch(() => {});
        })
        .catch((readErr) => {
          console.error("read_audio_file recovery failed, attempting alternate protocol:", readErr);
          const assetSrc = convertFileSrc(currentSong.path);
          if (playerRef.current) {
            playerRef.current.src = assetSrc;
            if (resumePosition > 0) {
              playerRef.current.currentTime = resumePosition;
            }
            playerRef.current.play().catch(() => {
              toast.error("Playback stopped: unable to decode audio track");
              setIsPlaying(false);
            });
          }
        });
    }
  };

  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
    }
    if (lastSongIdRef.current !== currentSong.id) {
      lastSongIdRef.current = currentSong.id;
      return;
    }

    if (currentTime < 1) return;

    if (!hasCountedPlayRef.current && duration > 0) {
      const playThreshold = Math.min(30, duration * 0.5);

      if (currentTime >= playThreshold) {
        hasCountedPlayRef.current = true;

        if (currentSong.id > 0) {
          invoke("record_song_play", { songId: currentSong.id })
            .then(() => console.log("Recorded song play:", currentSong.id))
            .catch((err) => console.error(err));
        } else {
          invoke("record_play_event", {
            track: {
              id: currentSong.online_id || String(currentSong.id),
              title: currentSong.title,
              artist: currentSong.artist_name,
              duration: Math.round(duration || 0),
              thumbnail: currentSong.album_cover_path || "",
              source: currentSong.online_id ? "youtube" : "local",
              signature: "",
            },
            completed: false,
            skipped_before_seconds: null,
          }).catch((err) => console.warn("Failed to log play event:", err));
        }
      }
    }
  };

  const handleSeek = (value: number) => {
    if (isAndroidPlatform()) {
      androidSeek(value);
      setCurrentTime(value);
    } else if (playerRef.current) {
      playerRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleOnLoadedMetadata = () => {
    if (playerRef.current) {
      setDuration(playerRef.current.duration);
      setCurrentTime(playerRef.current.currentTime);
    }
  };

  const handleMuteToggle = () => {
    setMuted(!muted);
  };

  useEffect(() => {
    if (isAndroidPlatform()) {
      androidSetVolume(muted ? 0 : volume / 100);
    } else {
      const player = playerRef.current;
      if (!player) return;
      player.volume = volume / 100;
      player.muted = muted;
    }
  }, [muted, volume, currentSong.id]);

  // Synchronize store isPlaying state with the HTMLAudioElement (desktop only)
  useEffect(() => {
    if (isAndroidPlatform()) return;
    const player = playerRef.current;
    if (!player || !player.src) return;

    if (isPlaying && player.paused) {
      const playPromise = player.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== "AbortError") {
            console.warn("Player play sync failed:", err);
            setIsPlaying(false);
          }
        });
      }
    } else if (!isPlaying && !player.paused) {
      player.pause();
    }
  }, [isPlaying, setIsPlaying]);

  useMediaSession({
    song: currentSong!,
    position: currentTime,
    duration,
    isPlaying,
    onPlay: playAudio,
    onPause: pauseAudio,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onSeek: handleSeek,
  });

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isExpanded]);

  useEffect(() => {
    hasCountedPlayRef.current = false;
    localRetryCountRef.current = 0;
  }, [currentSong.id]);

  // Clean up any existing blob url and stop native playback on unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      if (isAndroidPlatform()) {
        androidStop();
      }
    };
  }, []);

  // Song switching
  useEffect(() => {
    const isAndroid = isAndroidPlatform();
    const player = playerRef.current;
    if (!isAndroid && !player) return;

    if (isOnlineSong(currentSong)) {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      const videoId = getOnlineVideoId(currentSong);
      if (!videoId) return;

      activeRequestIdRef.current = videoId;
      setIsResolvingStream(true);

      invoke<string>("get_stream_url", { id: videoId })
        .then((streamUrl) => {
          if (activeRequestIdRef.current !== videoId) return;

          if (isAndroid) {
            androidLoadTrack(
              streamUrl,
              false,
              currentSong.id,
              currentSong.title,
              currentSong.artist_name,
              currentSong.album_cover_path || null,
              currentSong.duration || 0
            );
          } else if (playerRef.current) {
            playerRef.current.src = streamUrl;
            const playPromise = playerRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                if (err.name !== "AbortError") {
                  console.error("Online audio play failed:", err);
                }
              });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to resolve stream URL:", err);
        })
        .finally(() => {
          if (activeRequestIdRef.current === videoId) {
            setIsResolvingStream(false);
          }
        });

      return () => {
        invoke("cancel_stream_request", { videoId }).catch(() => {});
      };
    } else {
      activeRequestIdRef.current = null;
      setIsResolvingStream(false);

      if (isAndroid) {
        androidLoadTrack(
          currentSong.path,
          true,
          currentSong.id,
          currentSong.title,
          currentSong.artist_name,
          currentSong.album_cover_path || null,
          currentSong.duration || 0
        );
        return;
      }

      let isCancelled = false;
      const loadAndPlayLocal = async () => {
        try {
          if (activeBlobUrlRef.current) {
            URL.revokeObjectURL(activeBlobUrlRef.current);
            activeBlobUrlRef.current = null;
          }

          let loadedUrl: string | null = null;

          // 1. Direct Binary IPC (In-Memory Blob): 100% offline-resilient, zero network required, immune to Android NuPlayer crashes
          try {
            const fileBuffer = await invoke<ArrayBuffer>("read_audio_file", {
              path: currentSong.path,
            });
            if (!isCancelled && playerRef.current && fileBuffer && fileBuffer.byteLength > 0) {
              const mimeType = getAudioMimeType(currentSong.path);
              const blob = new Blob([fileBuffer], { type: mimeType });
              const blobUrl = URL.createObjectURL(blob);
              activeBlobUrlRef.current = blobUrl;
              loadedUrl = blobUrl;
            }
          } catch (readErr) {
            console.warn("read_audio_file failed, falling back to local server:", readErr);
          }

          // 2. Local HTTP 206 streaming server fallback (for large files or if binary IPC fails)
          if (!loadedUrl && !isCancelled && playerRef.current) {
            try {
              const localUrl = await invoke<string>("get_local_audio_url", {
                path: currentSong.path,
              });
              if (localUrl && (localUrl.startsWith("http://") || localUrl.startsWith("https://"))) {
                loadedUrl = localUrl;
              }
            } catch (serverErr) {
              console.warn("get_local_audio_url error:", serverErr);
            }
          }

          // 3. Final asset protocol fallback
          if (!loadedUrl) {
            loadedUrl = convertFileSrc(currentSong.path);
          }

          if (isCancelled || !playerRef.current) return;

          playerRef.current.src = loadedUrl;
          const playPromise = playerRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              if (err.name !== "AbortError") {
                console.error("Audio play failed:", err);
              }
            });
          }
        } catch (err) {
          console.warn("loadAndPlayLocal error:", err);
        }
      };

      loadAndPlayLocal();

      return () => {
        isCancelled = true;
      };
    }
  }, [currentSong.id, currentSong.path, playerRef]);

  // Android Native Playback Event Listeners
  useEffect(() => {
    if (!isAndroidPlatform()) return;

    const handlePlaybackState = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;

      if (typeof detail.position === "number") {
        setCurrentTime(detail.position);
      }
      if (typeof detail.duration === "number" && detail.duration > 0) {
        setDuration(detail.duration);
      }
      if (typeof detail.isPlaying === "boolean") {
        setIsPlaying(detail.isPlaying);
      }
    };

    const handlePlaybackEnded = () => {
      handleEnded();
    };

    const handlePlaybackError = () => {
      handleAudioError();
    };

    window.addEventListener("sonara-playback-state", handlePlaybackState);
    window.addEventListener("sonara-playback-ended", handlePlaybackEnded);
    window.addEventListener("sonara-playback-error", handlePlaybackError);

    return () => {
      window.removeEventListener("sonara-playback-state", handlePlaybackState);
      window.removeEventListener("sonara-playback-ended", handlePlaybackEnded);
      window.removeEventListener("sonara-playback-error", handlePlaybackError);
    };
  }, [currentSong.id, duration]);

  // Android Native Play Count Logging
  useEffect(() => {
    if (!isAndroidPlatform()) return;
    if (currentTime < 1 || hasCountedPlayRef.current || duration <= 0) return;

    const playThreshold = Math.min(30, duration * 0.5);
    if (currentTime >= playThreshold) {
      hasCountedPlayRef.current = true;
      if (currentSong.id > 0) {
        invoke("record_song_play", { songId: currentSong.id })
          .then(() => console.log("Recorded song play:", currentSong.id))
          .catch((err) => console.error(err));
      } else {
        invoke("record_play_event", {
          track: {
            id: currentSong.online_id || String(currentSong.id),
            title: currentSong.title,
            artist: currentSong.artist_name,
            duration: Math.round(duration || 0),
            thumbnail: currentSong.album_cover_path || "",
            source: currentSong.online_id ? "youtube" : "local",
            signature: "",
          },
          completed: false,
          skipped_before_seconds: null,
        }).catch((err) => console.warn("Failed to log play event:", err));
      }
    }
  }, [currentTime, duration, currentSong.id]);

  const isCoverUrl =
    currentSong.album_cover_path?.startsWith("http://") ||
    currentSong.album_cover_path?.startsWith("https://");
  const rawCoverSrc = currentSong.album_cover_path
    ? isCoverUrl
      ? currentSong.album_cover_path
      : convertFileSrc(currentSong.album_cover_path)
    : null;
  const coverSrc =
    rawCoverSrc && isCoverUrl
      ? getOptimizedThumbnail(rawCoverSrc, "card")
      : rawCoverSrc;

  const palette = useArtworkPalette(coverSrc);

  return (
    <>
      <footer
        className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:bottom-2 left-2 right-2 rounded-2xl md:rounded-3xl p-2 md:p-4 shadow-2xl border border-border/60 bg-card/95 md:bg-card/85 dark:bg-sidebar/95 md:dark:bg-sidebar/50 backdrop-blur-2xl z-30 transition-all overflow-hidden"
        style={{
          boxShadow: palette.isLoaded
            ? `0 12px 36px -8px ${palette.backdropTint}, 0 4px 12px rgba(0,0,0,0.1)`
            : undefined,
        }}
      >
        <audio
          ref={playerRef}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleOnLoadedMetadata}
          onError={handleAudioError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          muted={muted}
        />

        {/* Mobile Mini Player (< md) - Horizontal Swipe to Stop / Dismiss */}
        <section
          className={`flex md:hidden flex-col select-none touch-pan-y ${isSwiping ? "" : "transition-all duration-200"}`}
          style={{
            transform: `translateX(${dragX}px)`,
            opacity: isSwiping ? Math.max(0.15, 1 - Math.abs(dragX) / 250) : 1,
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
            setIsSwiping(true);
          }}
          onTouchMove={(e) => {
            if (!touchStartRef.current) return;
            const deltaX = e.touches[0].clientX - touchStartRef.current.x;
            const deltaY = e.touches[0].clientY - touchStartRef.current.y;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              setDragX(deltaX);
            }
          }}
          onTouchEnd={(e) => {
            if (!touchStartRef.current) return;
            const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;
            const currentDrag = dragX;
            setIsSwiping(false);
            touchStartRef.current = null;

            // Swipe left or right past 75px -> Immediately stop playback and remove song
            if (Math.abs(currentDrag) > 75) {
              setDragX(currentDrag > 0 ? 450 : -450);
              setTimeout(() => {
                handleStopAndDismiss();
              }, 120);
            } else {
              // Swipe up to expand player
              if (deltaY > 40 && Math.abs(currentDrag) < 20) {
                setIsExpanded(true);
              }
              setDragX(0);
            }
          }}
        >
          <div className="flex items-center justify-between gap-3 px-1 py-0.5">
            <div
              onClick={() => {
                if (Math.abs(dragX) < 10) {
                  setIsExpanded(true);
                }
              }}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
            >
              <div className="size-12 rounded-xl bg-linear-to-br from-primary/30 to-primary/10 shrink-0 flex items-center justify-center overflow-hidden shadow-sm border border-border/60">
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="size-5 text-primary" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5 flex-1 pr-1">
                <MarqueeText
                  text={currentSong.title}
                  className="text-sm font-semibold font-heading truncate text-foreground"
                />
                <p className="text-xs text-muted-foreground truncate font-medium">
                  {currentSong.artist_name || "Unknown Artist"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <AddToPlaylistDialog
                song={currentSong}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-9 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Add to Playlist"
                  >
                    <SquarePlus className="size-5" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-9 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                onClick={handleFavoriteToggle}
                aria-label="Toggle Favorite"
              >
                {currentSong.is_favorite ? (
                  <Heart className="size-4.5 text-primary fill-current" />
                ) : (
                  <Heart className="size-4.5" />
                )}
              </Button>
              {isResolvingStream ? (
                <Button variant="ghost" size="icon" className="rounded-full size-10" disabled>
                  <Loader2 className="size-5 animate-spin text-primary" />
                </Button>
              ) : isPlaying ? (
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full size-10 shadow-md shadow-primary/20 active:scale-95 transition-transform"
                  onClick={pauseAudio}
                  aria-label="Pause"
                >
                  <Pause className="size-5 fill-current" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full size-10 shadow-md shadow-primary/20 active:scale-95 transition-transform"
                  onClick={playAudio}
                  aria-label="Play"
                >
                  <Play className="size-5 fill-current ml-0.5" />
                </Button>
              )}
            </div>
          </div>
          {/* Integrated progress bar with dynamic album accent color */}
          <div className="w-full h-[2.5px] bg-muted/80 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-linear"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                backgroundColor: palette.accent || "var(--primary)",
              }}
            />
          </div>
        </section>

        {/* Desktop Full Player (>= md) - Figma 3-Zone Architecture */}
        <section className="hidden md:flex w-full h-full items-center justify-between gap-4 lg:gap-6 px-2">
          {/* Zone 1: Left - Transport Controls */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <Button
              variant={isShuffle ? "default" : "ghost"}
              size="icon"
              className={`rounded-full size-9 transition-colors ${
                isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setIsShuffle(!isShuffle)}
              aria-label="Shuffle"
            >
              <Shuffle className="size-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-9 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
              onClick={handlePrevious}
              aria-label="Previous Song"
            >
              <SkipBack className="size-5" />
            </Button>
            {isResolvingStream ? (
              <Button
                variant="default"
                size="icon"
                className="rounded-full size-11 bg-primary text-black shadow-lg shadow-primary/25"
                disabled
              >
                <Loader2 className="size-5 animate-spin text-black" />
              </Button>
            ) : isPlaying ? (
              <Button
                variant="default"
                size="icon"
                className="rounded-full size-11 bg-primary text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/25"
                onClick={pauseAudio}
                aria-label="Pause"
              >
                <Pause className="size-5 fill-current" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                className="rounded-full size-11 bg-primary text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/25"
                onClick={playAudio}
                aria-label="Play"
              >
                <Play className="size-5 fill-current ml-0.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-9 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
              onClick={handleNext}
              aria-label="Next Song"
            >
              <SkipForward className="size-5" />
            </Button>
            <Button
              variant={repeatMode !== "off" ? "default" : "ghost"}
              size="icon"
              className={`rounded-full size-9 transition-colors ${
                repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={toggleRepeatMode}
              aria-label="Repeat Mode"
            >
              {repeatMode === "off" && <Repeat className="size-4.5" />}
              {repeatMode === "one" && <Repeat1 className="size-4.5" />}
              {repeatMode === "all" && <Repeat className="size-4.5" />}
            </Button>
          </div>

          {/* Zone 2: Center - Dynamic Wavy Timeline Scrubber & Volume Slider */}
          <div className="flex-1 max-w-2xl flex items-center gap-3 min-w-0">
            <WavySeekBar
              position={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={handleSeek}
              primaryColor={palette.accent}
              accentColor={palette.dominant}
              showTimeLabels={true}
              className="flex-1"
            />

            {/* Inline Volume Controls */}
            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-border/60">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-8 text-muted-foreground hover:text-foreground"
                onClick={handleMuteToggle}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <VolumeOff className="size-4 text-destructive" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Slider
                min={0}
                max={100}
                value={[muted ? 0 : volume]}
                onValueChange={(val) => {
                  if (muted) setMuted(false);
                  setVolume(val[0]);
                }}
                className="w-20 lg:w-24 cursor-pointer"
              />
            </div>
          </div>

          {/* Zone 3: Right - Current Track Details & Quick Actions */}
          <div className="flex items-center gap-2.5 lg:gap-3 shrink-0 max-w-[280px] lg:max-w-[340px]">
            <div
              className="size-11 rounded-xl bg-linear-to-br from-primary/30 to-primary/10 shrink-0 flex items-center justify-center overflow-hidden shadow-sm border border-border/60 cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="size-5 text-primary" />
              )}
            </div>

            <div
              className="min-w-0 max-w-[130px] lg:max-w-[170px] space-y-0.5 cursor-pointer select-none"
              onClick={() => setIsExpanded(true)}
            >
              <MarqueeText
                text={currentSong.title}
                className="text-sm font-semibold font-heading text-foreground truncate"
              />
              <p className="text-xs text-muted-foreground truncate">
                {currentSong.artist_name || "Unknown Artist"}
                {currentSong.album_name ? ` • ${currentSong.album_name}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-8 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                onClick={handleFavoriteToggle}
                aria-label="Toggle Favorite"
              >
                {currentSong.is_favorite ? (
                  <Heart className="size-4.5 text-primary fill-current" />
                ) : (
                  <Heart className="size-4.5" />
                )}
              </Button>

              <AddToPlaylistDialog
                song={currentSong}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-8 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                    aria-label="Add to Playlist"
                  >
                    <SquarePlus className="size-4.5" />
                  </Button>
                }
              />

              <EqualizerDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full size-8 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
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
                    className="rounded-full size-8 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                    aria-label="Sleep Timer"
                  >
                    <Moon className="size-4.5" />
                  </Button>
                }
              />

              <PlaybackQueue />

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-8 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                onClick={() => setIsExpanded(true)}
                aria-label="Open Now Playing"
              >
                <ChevronUp className="size-4.5" />
              </Button>
            </div>
          </div>
        </section>
      </footer>

      <OverlayPlayer
        isExpanded={isExpanded}
        collapse={collapse}
        song={currentSong}
        position={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlay={playAudio}
        onPause={pauseAudio}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        toggleFavorite={handleFavoriteToggle}
      />
    </>
  );
};
export default AudioPlayer;
