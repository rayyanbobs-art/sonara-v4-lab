import useGetSongLyricsQuery from "@/features/lyrics/api/useGetSongLyricsQuery";
import SongLyrics from "@/features/lyrics/components/SongLyrics";
import UpdateSongLyrics from "@/features/lyrics/components/UpdateSongLyrics";

interface LyricsSectionProps {
  song: Song;
  position: number;
  onSeek?: (seconds: number) => void;
  accentColor?: string;
}

const LyricsSection: React.FC<LyricsSectionProps> = ({
  song,
  position,
  onSeek,
  accentColor,
}) => {
  const {
    data: lyricsContent,
    refetch,
    isFetching,
    isRefetching,
  } = useGetSongLyricsQuery({ songId: song.id });

  const isLoading = isFetching || isRefetching;
  const handleRefetchLyrics = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex justify-center items-center text-center">
        <p className="font-heading font-medium text-xs text-muted-foreground animate-pulse">
          Searching for lyrics...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-2 flex flex-col justify-between items-center gap-y-4 overflow-hidden">
      <div className="w-full flex-1 overflow-hidden flex flex-col items-center">
        <SongLyrics
          song={song}
          audioCurrentTime={position}
          lyricsContent={lyricsContent}
          handleRefetchLyrics={handleRefetchLyrics}
          onSeek={onSeek}
          accentColor={accentColor}
        />
      </div>

      <div className="shrink-0 pt-2 opacity-60 hover:opacity-100 transition-opacity">
        <UpdateSongLyrics
          song_id={song.id}
          song_title={song.title}
          song_artist={song.artist_name}
          initialContent={lyricsContent || ""}
        />
      </div>
    </div>
  );
};

export default LyricsSection;
