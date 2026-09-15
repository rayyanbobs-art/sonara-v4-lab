import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  ChevronLeft,
  Play,
  Shuffle,
  ArrowUp,
  Lock,
  Music,
} from "lucide-react";
import useAppStore from "@/store/app-store";
import useGetSongsByPlaylistQuery from "@/features/playlists/api/useGetSongsByPlaylistQuery";
import ActionsDropdown from "@/features/songs/components/ActionsDropdown";
import AddToPlaylistDialog from "@/features/playlists/components/AddToPlaylistDialog";
import EditPlaylistDialog from "@/features/playlists/components/EditPlaylistDialog";
import DeletePlaylistAlert from "@/features/playlists/components/DeletePlaylistAlert";

export const Route = createFileRoute("/playlists/$id")({
  component: RouteComponent,
});

const SAMPLE_PLAYLIST_NAMES: Record<number, { name: string; cover: string }> = {
  [-1]: {
    name: "Imported Playlist",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  },
  [-2]: {
    name: "fR3qu3n.cy",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
  },
  [-3]: {
    name: "Codnunen",
    cover: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80",
  },
  [-4]: {
    name: "Spotifeye",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  },
  [-5]: {
    name: "Drifting Glacier",
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
  },
  [-6]: {
    name: "Crimson Canyon",
    cover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
  },
  [-7]: {
    name: "Hazy Monsoon",
    cover: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
  },
  [-8]: {
    name: "Restless Cosmos",
    cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  },
  [-9]: {
    name: "Halo",
    cover: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80",
  },
};

const SAMPLE_SONGS: Song[] = [
  {
    id: -101,
    title: "pulse",
    artist_id: 11,
    artist_name: "optic core",
    album_id: 11,
    album_name: "pulse",
    album_cover_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
    album_artist_name: "optic core",
    duration: 184,
    track_number: 1,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 32,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -102,
    title: "She Was Never Real",
    artist_id: 12,
    artist_name: "Puhf",
    album_id: 12,
    album_name: "She Was Never Real",
    album_cover_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
    album_artist_name: "Puhf",
    duration: 210,
    track_number: 2,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 45,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -103,
    title: "save file 2",
    artist_id: 11,
    artist_name: "optic core",
    album_id: 11,
    album_name: "save file 2",
    album_cover_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80",
    album_artist_name: "optic core",
    duration: 198,
    track_number: 3,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 19,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -104,
    title: "HATSUMI",
    artist_id: 13,
    artist_name: "Muddyoush",
    album_id: 13,
    album_name: "HATSUMI",
    album_cover_path: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
    album_artist_name: "Muddyoush",
    duration: 175,
    track_number: 4,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 57,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -105,
    title: "save file 1",
    artist_id: 11,
    artist_name: "optic core",
    album_id: 11,
    album_name: "save file 1",
    album_cover_path: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80",
    album_artist_name: "optic core",
    duration: 220,
    track_number: 5,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 28,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -106,
    title: "The Voices Told Me To",
    artist_id: 12,
    artist_name: "Puhf",
    album_id: 12,
    album_name: "The Voices Told Me To",
    album_cover_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
    album_artist_name: "Puhf",
    duration: 164,
    track_number: 6,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 61,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -107,
    title: "idontloveyouanymore",
    artist_id: 12,
    artist_name: "Puhf",
    album_id: 12,
    album_name: "idontloveyouanymore",
    album_cover_path: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80",
    album_artist_name: "Puhf",
    duration: 240,
    track_number: 7,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 73,
    created_at: 1716000000,
    is_online: true,
  },
];

function RouteComponent() {
  const { id } = Route.useParams();
  const playlistId = Number(id);
  const { data } = useGetSongsByPlaylistQuery(playlistId);

  const playSong = useAppStore((state) => state.playSong);
  const isShuffle = useAppStore((state) => state.isShuffle);
  const setIsShuffle = useAppStore((state) => state.setIsShuffle);
  const currentSong = useAppStore((state) => state.currentSong);

  const playlistInfo = useMemo(() => {
    if (data?.playlist) {
      return {
        name: data.playlist.name,
        cover: data.songs[0]?.album_cover_path
          ? data.songs[0].album_cover_path.startsWith("http")
            ? data.songs[0].album_cover_path
            : convertFileSrc(data.songs[0].album_cover_path)
          : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
      };
    }
    return (
      SAMPLE_PLAYLIST_NAMES[playlistId] || {
        name: "Hazy Monsoon",
        cover: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
      }
    );
  }, [data, playlistId]);

  const songsList = useMemo(() => {
    if (data?.songs && data.songs.length > 0) {
      return data.songs;
    }
    return SAMPLE_SONGS;
  }, [data]);

  const handlePlayAll = () => {
    if (songsList.length > 0) {
      playSong(songsList[0], songsList);
    }
  };

  const handleShufflePlay = () => {
    setIsShuffle(!isShuffle);
    if (songsList.length > 0) {
      const randomIndex = Math.floor(Math.random() * songsList.length);
      playSong(songsList[randomIndex], songsList);
    }
  };

  const handleTrackClick = (song: Song) => {
    playSong(song, songsList);
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <main className="relative w-full h-screen overflow-y-auto custom-scrollbar bg-[#0d1015] pb-36">
      {/* Dynamic Ambient Cover Background with Gradient Overlay (Screenshot 2) */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden">
        <img
          src={playlistInfo.cover}
          alt={playlistInfo.name}
          className="w-full h-full object-cover scale-105 filter blur-xs brightness-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#0d1015]" />

        {/* Top Navigation Bar: Back & Options */}
        <div className="absolute top-0 left-0 right-0 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-4 flex items-center justify-between z-10">
          <button
            onClick={handleBack}
            className="size-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
            aria-label="Go Back"
          >
            <ChevronLeft className="size-6" />
          </button>

          {data?.playlist && (
            <div className="flex items-center gap-1.5">
              <EditPlaylistDialog playlist={data.playlist} />
              <DeletePlaylistAlert playlistId={playlistId} />
            </div>
          )}
        </div>

        {/* Hero Title & Subtext (Screenshot 2) */}
        <div className="absolute bottom-4 left-0 right-0 px-4 sm:px-8 max-w-3xl mx-auto space-y-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading text-white tracking-tight drop-shadow-md">
            {playlistInfo.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium drop-shadow-xs">
            {songsList.length} songs • Aug 23, 2026
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4 pt-2">
        {/* Action Controls Bar (Screenshot 2) */}
        <div className="flex items-center gap-3">
          {/* Squircle Shuffle Button */}
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

          {/* Large Pill Play Button */}
          <button
            onClick={handlePlayAll}
            className="h-12 px-7 rounded-full bg-[#dbe4ec] hover:bg-white text-[#12171c] font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <Play className="size-4.5 fill-current" />
            <span>Play</span>
          </button>
        </div>

        {/* Order & Total Tracks Bar (Screenshot 2) */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1e252d] hover:bg-[#28323c] text-xs font-semibold text-white border border-white/5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span>Custom order</span>
            <ArrowUp className="size-3.5 text-zinc-300" />
          </button>

          <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
            <span>{songsList.length} tracks</span>
            <Lock className="size-3 text-zinc-400 ml-0.5" />
          </div>
        </div>

        {/* Songs List (Screenshot 2) */}
        <div className="space-y-1">
          {songsList.map((song, index) => {
            const isPlayingThis = currentSong?.id === song.id;
            const coverUrl = song.album_cover_path
              ? song.album_cover_path.startsWith("http")
                ? song.album_cover_path
                : convertFileSrc(song.album_cover_path)
              : "";

            return (
              <div
                key={song.id}
                onClick={() => handleTrackClick(song)}
                className={`group flex items-center justify-between py-2 px-2 rounded-2xl transition-all cursor-pointer select-none ${
                  isPlayingThis
                    ? "bg-[#1e2832]/80 border border-cyan-500/20"
                    : "hover:bg-white/5"
                }`}
              >
                {/* Track Index + Artwork + Title & Artist */}
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
                      {song.artist_name || "Unknown Artist"}
                    </p>
                  </div>
                </div>

                {/* Right Options 3-dots */}
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
