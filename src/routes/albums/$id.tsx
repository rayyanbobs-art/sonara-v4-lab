import { createFileRoute } from "@tanstack/react-router";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  ChevronLeft,
  Play,
  Shuffle,
  Music,
} from "lucide-react";
import useAppStore from "@/store/app-store";
import useGetSongsByAlbumQuery from "@/features/albums/api/useGetSongsByAlbumQuery";
import ActionsDropdown from "@/features/songs/components/ActionsDropdown";
import AddToPlaylistDialog from "@/features/playlists/components/AddToPlaylistDialog";
import Loading from "@/components/custom/Loading";

export const Route = createFileRoute("/albums/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data, isLoading } = useGetSongsByAlbumQuery(parseInt(id));

  const playSong = useAppStore((state) => state.playSong);
  const isShuffle = useAppStore((state) => state.isShuffle);
  const setIsShuffle = useAppStore((state) => state.setIsShuffle);
  const currentSong = useAppStore((state) => state.currentSong);

  if (isLoading || !data) {
    return <Loading />;
  }

  const songs = data.songs ?? [];
  const albumCover = data.album.cover_path
    ? convertFileSrc(data.album.cover_path)
    : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80";

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const handleShufflePlay = () => {
    setIsShuffle(!isShuffle);
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      playSong(songs[randomIndex], songs);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <main className="relative w-full h-screen overflow-y-auto custom-scrollbar bg-[#0d1015] pb-36">
      {/* Dynamic Ambient Cover Background with Gradient Overlay (Screenshot 2 style) */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden">
        <img
          src={albumCover}
          alt={data.album.name}
          className="w-full h-full object-cover scale-105 filter blur-xs brightness-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#0d1015]" />

        {/* Top Navigation Bar: Back */}
        <div className="absolute top-0 left-0 right-0 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-4 flex items-center justify-between z-10">
          <button
            onClick={handleBack}
            className="size-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
            aria-label="Go Back"
          >
            <ChevronLeft className="size-6" />
          </button>
        </div>

        {/* Hero Title & Subtext */}
        <div className="absolute bottom-4 left-0 right-0 px-4 sm:px-8 max-w-3xl mx-auto space-y-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading text-white tracking-tight drop-shadow-md">
            {data.album.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium drop-shadow-xs">
            {data.album.artist_name} • {songs.length} {songs.length === 1 ? "track" : "tracks"}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4 pt-2">
        {/* Action Controls Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShufflePlay}
            className={`size-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer shadow-md ${
              isShuffle
                ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                : "bg-[#1e252d] border-white/5 text-white hover:bg-[#28323c]"
            }`}
            aria-label="Shuffle"
          >
            <Shuffle className="size-5" />
          </button>

          <button
            onClick={handlePlayAll}
            className="h-12 px-7 rounded-full bg-[#dbe4ec] hover:bg-white text-[#12171c] font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <Play className="size-4.5 fill-current" />
            <span>Play</span>
          </button>
        </div>

        {/* Songs List */}
        <div className="space-y-1">
          {songs.map((song, index) => {
            const isPlayingThis = currentSong?.id === song.id;
            const coverUrl = song.album_cover_path
              ? convertFileSrc(song.album_cover_path)
              : albumCover;

            return (
              <div
                key={song.id}
                onClick={() => playSong(song, songs)}
                className={`group flex items-center justify-between py-2 px-2 rounded-2xl transition-all cursor-pointer select-none ${
                  isPlayingThis
                    ? "bg-[#1e2832]/80 border border-cyan-500/20"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-5 text-center text-xs font-bold text-zinc-500 group-hover:text-zinc-300">
                    {index + 1}
                  </span>

                  <div className="size-11 rounded-xl overflow-hidden bg-[#1f262e] shrink-0 border border-white/5 shadow-xs">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="size-5 text-zinc-500" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4
                      className={`text-sm font-bold truncate ${
                        isPlayingThis ? "text-cyan-400" : "text-white"
                      }`}
                    >
                      {song.title}
                    </h4>
                    <p className="text-xs text-zinc-400 font-medium truncate">
                      {song.artist_name || data.album.artist_name}
                    </p>
                  </div>
                </div>

                <div
                  className="shrink-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionsDropdown song={song}>
                    <AddToPlaylistDialog song={song} />
                  </ActionsDropdown>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

