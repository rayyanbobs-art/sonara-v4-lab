import {
  Music,
  Pause,
  Play,
  SkipForward,
  Loader2,
} from "lucide-react";
import useArtworkPalette from "../hooks/useArtworkPalette";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import useAppStore from "@/store/app-store";
import useToggleFavoriteMutation from "@/features/songs/api/useToggleFavoriteMutation";
import OverlayPlayer from "@/features/player/components/OverlayPlayer";
import webAudioEngine from "@/features/audio/services/webAudioEngine";
import useAudioEffectsStore from "@/features/audio/store/useAudioEffectsStore";
import { scrobbleTrack } from "@/features/scrobbler/services/scrobblerService";
import useMediaSession from "@/hooks/useMediaSession";
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

const AudioPlayer = ({ currentSong }: AudioPlayerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const playerRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  const hasCountedPlayRef = useRef(false);
  const lastSongIdRef = useRef<number | null>(null);
  const localRetryCountRef = useRef(0);

  const next = useAppStore((state) => state.next);
  const previous = useAppStore((state) => state.previous);
  const repeatMode = useAppStore((state) => state.repeatMode);

  const isPlaying = useAppStore((state) => state.isPlaying);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);

  const muted = useAppStore((state) => state.muted);
  const volume = useAppStore((state) => state.volume);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { mutate } = useToggleFavoriteMutation();

  const [isResolvingStream, setIsResolvingStream] = useState(false);
  const activeRequestIdRef = useRef<string | null>(null);

  const collapse = () => {
    setIsExpanded(false);
  };

  // Synchronize volume and mute to HTML5 Audio element and native player directly
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume = Math.max(0, Math.min(1, volume / 100));
      playerRef.current.muted = muted;
    }
    if (isAndroidPlatform()) {
      androidSetVolume(muted ? 0 : volume / 100);
    }
  }, [volume, muted]);

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
      if (playerRef.current.volume === 0 && !muted) {
        playerRef.current.volume = Math.max(0.1, Math.min(1, volume / 100)) || 0.5;
      }
      playerRef.current.play().catch((err) => {
        console.error("Desktop playAudio failed:", err);
      });
      setIsPlaying(true);
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

        scrobbleTrack(
          currentSong.artist_name || "Unknown Artist",
          currentSong.title,
          currentSong.album_name
        );
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
      {/* LastWave Floating Mini-Player (Screenshot 6) - Desktop and Mobile */}
      <footer className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-22 left-0 right-0 z-30 flex items-center justify-center px-4 pointer-events-none">
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

        <div
          onClick={() => setIsExpanded(true)}
          className="pointer-events-auto w-full max-w-lg rounded-[24px] bg-[#1a2128]/95 border border-white/10 backdrop-blur-2xl shadow-2xl p-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-all hover:bg-[#20272e] active:scale-[0.99] relative overflow-hidden group"
          style={{
            boxShadow: palette.isLoaded
              ? `0 12px 36px -8px ${palette.backdropTint}, 0 4px 12px rgba(0,0,0,0.4)`
              : undefined,
          }}
        >
          {/* Left: Artwork */}
          <div className="size-12 rounded-xl bg-zinc-800 shrink-0 flex items-center justify-center overflow-hidden border border-white/10 relative shadow-sm">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="size-5 text-cyan-300" />
            )}
          </div>

          {/* Middle: Title & Artist */}
          <div className="min-w-0 flex-1 space-y-0.5 pr-2">
            <div className="text-sm font-bold text-white truncate group-hover:text-cyan-200 transition-colors">
              {currentSong.title}
            </div>
            <p className="text-xs text-zinc-400 truncate">
              {currentSong.artist_name || "Unknown Artist"}
            </p>
          </div>

          {/* Right: Circular Play/Pause + Circular Next (Screenshot 6) */}
          <div className="flex items-center gap-2 shrink-0">
            {isResolvingStream ? (
              <button
                type="button"
                className="size-11 rounded-full bg-[#dbe4ec] text-[#12171c] flex items-center justify-center shadow-md"
                disabled
              >
                <Loader2 className="size-5 animate-spin" />
              </button>
            ) : isPlaying ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pauseAudio();
                }}
                className="size-11 rounded-full bg-[#dbe4ec] hover:bg-white text-[#12171c] flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
                aria-label="Pause"
              >
                <Pause className="size-5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className="size-11 rounded-full bg-[#dbe4ec] hover:bg-white text-[#12171c] flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
                aria-label="Play"
              >
                <Play className="size-5 fill-current ml-0.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="size-10 rounded-full bg-[#242e38] hover:bg-[#303c49] text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              aria-label="Next"
            >
              <SkipForward className="size-4.5" />
            </button>
          </div>

          {/* Bottom Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/5 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-[width] duration-300 ease-linear"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
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
