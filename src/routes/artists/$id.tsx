import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  ChevronLeft,
  Play,
  Shuffle,
  FolderHeart,
  BadgeCheck,
  Music,
} from "lucide-react";
import useAppStore from "@/store/app-store";
import useGetSongsByArtistQuery from "@/features/artists/api/useGetSongsByArtistQuery";
import ActionsDropdown from "@/features/songs/components/ActionsDropdown";
import AddToPlaylistDialog from "@/features/playlists/components/AddToPlaylistDialog";
import Loading from "@/components/custom/Loading";

export const Route = createFileRoute("/artists/$id")({
  component: RouteComponent,
});

const SAMPLE_GENRES = ["new age", "ambient", "chillout", "ethnic", "world"];

function RouteComponent() {
  const { id } = Route.useParams();
  const { data, isLoading } = useGetSongsByArtistQuery(parseInt(id));

  const playSong = useAppStore((state) => state.playSong);
  const isShuffle = useAppStore((state) => state.isShuffle);
  const setIsShuffle = useAppStore((state) => state.setIsShuffle);
  const currentSong = useAppStore((state) => state.currentSong);

  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const songs = data?.songs ?? [];

  const artistImage = useMemo(() => {
    if (data?.artist.image_path) {
      return convertFileSrc(data.artist.image_path);
    }
    if (songs.length > 0 && songs[0].album_cover_path) {
      return songs[0].album_cover_path.startsWith("http")
        ? songs[0].album_cover_path
        : convertFileSrc(songs[0].album_cover_path);
    }
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80";
  }, [data, songs]);

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

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <main className="relative w-full h-screen overflow-y-auto custom-scrollbar bg-[#0d1015] pb-36 px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Back Button (Screenshot 1) */}
        <button
          onClick={() => window.history.back()}
          className="size-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
          aria-label="Go Back"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Hero Card with Giant Cover & Verified Badge (Screenshot 1) */}
        <div className="relative w-full aspect-[4/3] max-h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-[#14181c]">
          <img
            src={artistImage}
            alt={data.artist.name}
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1015]/90 via-transparent to-black/20" />

          {/* Bottom Left Artist Name & Follower Pill */}
          <div className="absolute bottom-5 left-5 right-5 space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight drop-shadow-md">
                {data.artist.name}
              </h1>
              <BadgeCheck className="size-6 text-amber-200 fill-amber-300 drop-shadow-md shrink-0" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-semibold text-zinc-200 shadow-sm">
              70.8K
            </div>
          </div>
        </div>

        {/* Action Controls Bar (Screenshot 1) */}
        <div className="flex items-center justify-between pt-1">
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
              className="size-12 rounded-2xl bg-[#1e252d] border border-white/5 text-white flex items-center justify-center hover:bg-[#28323c] active:scale-95 transition-all shadow-md cursor-pointer"
              aria-label="Save to Library"
            >
              <FolderHeart className="size-5" />
            </button>
          </div>

          <button
            onClick={handlePlayAll}
            className="size-14 rounded-full bg-[#dbe4ec] hover:bg-white text-[#12171c] flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer"
            aria-label="Play Artist"
          >
            <Play className="size-6 fill-current translate-x-0.5" />
          </button>
        </div>

        {/* Genre Tags Row (Screenshot 1) */}
        <div className="flex flex-wrap gap-2 pt-1">
          {SAMPLE_GENRES.map((genre) => (
            <span
              key={genre}
              className="px-4 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* About Section (Screenshot 1) */}
        <div className="space-y-1.5 pt-2">
          <h2 className="text-lg font-bold text-white tracking-tight">About</h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {data.artist.name} is a new age/ambient musician known for expansive soundscapes and melodic depth.
            Their music features rich atmospheric harmonies, cultural instrumentation, and emotive textures.
            {!isBioExpanded && (
              <button
                onClick={() => setIsBioExpanded(true)}
                className="ml-1 text-white font-semibold hover:underline cursor-pointer"
              >
                ... Read more
              </button>
            )}
            {isBioExpanded && (
              <span className="text-zinc-400">
                {" "}Widely streamed across continents, crafting transcendent listening journeys tailored for deep focus, meditation, and sonic relaxation.
              </span>
            )}
          </p>
        </div>

        {/* Songs Section (Screenshot 1) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Songs</h2>
            <span className="text-xs text-zinc-400 font-medium">
              {songs.length} tracks
            </span>
          </div>

          <div className="space-y-1">
            {songs.map((song) => {
              const isPlayingThis = currentSong?.id === song.id;
              const coverUrl = song.album_cover_path
                ? song.album_cover_path.startsWith("http")
                  ? song.album_cover_path
                  : convertFileSrc(song.album_cover_path)
                : "";

              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, songs)}
                  className={`group flex items-center justify-between py-2 px-2.5 rounded-2xl transition-all cursor-pointer select-none ${
                    isPlayingThis
                      ? "bg-[#1e2832]/80 border border-cyan-500/20"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                        {song.artist_name || data.artist.name}
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
      </div>
    </main>
  );
}

