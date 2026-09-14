import { useState, useEffect } from "react";
import RenderLyricsView from "@/features/lyrics/components/RenderLyricsView";
import { Button } from "../../../components/ui/button";
import { Loader2, RotateCw, Sparkles } from "lucide-react";
import { fetchLrclibLyrics } from "../api/lrclibService";

interface SongLyricsProps {
  audioCurrentTime: number;
  lyricsContent: string | undefined;
  handleRefetchLyrics: () => void;
  song?: Song;
  onSeek?: (timeInSeconds: number) => void;
  accentColor?: string;
}

export const SongLyrics: React.FC<SongLyricsProps> = ({
  audioCurrentTime,
  lyricsContent,
  handleRefetchLyrics,
  song,
  onSeek,
  accentColor,
}) => {
  const [onlineLyrics, setOnlineLyrics] = useState<string | null>(null);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Auto-fetch from LRCLIB if local lyricsContent is absent
  useEffect(() => {
    let active = true;

    if (lyricsContent) {
      setOnlineLyrics(null);
      setIsSearchingOnline(false);
      return;
    }

    if (!song?.title || !song?.artist_name) {
      setOnlineLyrics(null);
      return;
    }

    setIsSearchingOnline(true);
    fetchLrclibLyrics(
      song.title,
      song.artist_name,
      song.album_name || undefined,
      song.duration || undefined
    )
      .then((lyrics) => {
        if (active) {
          setOnlineLyrics(lyrics);
          setIsSearchingOnline(false);
        }
      })
      .catch((err) => {
        console.warn("Auto-fetching LRCLIB lyrics error:", err);
        if (active) {
          setIsSearchingOnline(false);
        }
      });

    return () => {
      active = false;
    };
  }, [lyricsContent, song?.title, song?.artist_name, song?.album_name, song?.duration]);

  const activeContent = lyricsContent || onlineLyrics;

  if (activeContent) {
    return (
      <div className="h-full w-full flex flex-col">
        {onlineLyrics && !lyricsContent && (
          <div className="flex items-center justify-center gap-1.5 pb-1 text-[11px] font-medium text-muted-foreground/80 select-none">
            <Sparkles className="size-3 text-primary animate-pulse" />
            <span>Synced via LRCLIB</span>
          </div>
        )}
        <RenderLyricsView
          content={activeContent}
          audioCurrentTime={audioCurrentTime}
          onSeek={onSeek}
          accentColor={accentColor}
        />
      </div>
    );
  }

  if (isSearchingOnline) {
    return (
      <div className="h-80 w-full flex flex-col justify-center items-center text-center space-y-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="font-heading font-medium text-xs text-muted-foreground">
          Fetching synced lyrics from LRCLIB...
        </p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full flex flex-col justify-center items-center text-center px-4 space-y-3">
      <p className="font-heading font-medium text-sm text-muted-foreground max-w-xs">
        No lyrics found for this track. You can search again or add your own custom .lrc file.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full gap-1.5 text-xs"
        onClick={handleRefetchLyrics}
      >
        <RotateCw className="size-3.5" />
        <span>Retry Search</span>
      </Button>
    </div>
  );
};

export default SongLyrics;
