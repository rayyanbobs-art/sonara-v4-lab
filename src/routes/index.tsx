import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  MoreVertical,
  Music,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import HeroStatsCard from "@/features/home/components/HeroStatsCard";
import useGetHomeDataQuery from "@/features/home/api/useGetHomeDataQuery";
import Loading from "@/components/custom/Loading";
import useAppStore from "@/store/app-store";
import ActionsDropdown from "@/features/songs/components/ActionsDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  component: Index,
});

type SortMode = "recent" | "most_played" | "last_7_days" | "last_30_days";

const CURATED_SAMPLE_TRACKS: Song[] = [
  {
    id: -1,
    title: "Odysseus",
    artist_id: 1,
    artist_name: "Ludwig Göransson",
    album_id: 1,
    album_name: "The Odyssey",
    album_cover_path: "https://i.ytimg.com/vi/Wz95LdJv9eU/maxresdefault.jpg",
    album_artist_name: "Ludwig Göransson",
    duration: 360,
    track_number: 1,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 88,
    created_at: 1716000000,
    is_online: true,
    online_id: "Wz95LdJv9eU",
  },
  {
    id: -2,
    title: "all you wanna",
    artist_id: 2,
    artist_name: "disctr4k",
    album_id: 2,
    album_name: "all you wanna",
    album_cover_path: "https://images.genius.com/02390800fa1e57c661bb0c5dd6ca78ba.1000x1000x1.jpg",
    album_artist_name: "disctr4k",
    duration: 195,
    track_number: 1,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 54,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -3,
    title: "IS THIS IT",
    artist_id: 3,
    artist_name: "femtanyl",
    album_id: 3,
    album_name: "CHASER",
    album_cover_path: "https://f4.bcbits.com/img/a2185568194_10.jpg",
    album_artist_name: "femtanyl",
    duration: 154,
    track_number: 1,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 42,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -4,
    title: "Approve Please, Genie!",
    artist_id: 4,
    artist_name: "TRAP CHICK",
    album_id: 4,
    album_name: "Approve Please",
    album_cover_path: "https://i.ytimg.com/vi/4Wz4hK3pX1M/hqdefault.jpg",
    album_artist_name: "TRAP CHICK",
    duration: 210,
    track_number: 1,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 36,
    created_at: 1716000000,
    is_online: true,
  },
  {
    id: -5,
    title: "APT.",
    artist_id: 5,
    artist_name: "ROSÉ & Bruno Mars",
    album_id: 5,
    album_name: "rosie",
    album_cover_path: "https://upload.wikimedia.org/wikipedia/en/2/23/Rose_and_Bruno_Mars_-_Apt..png",
    album_artist_name: "ROSÉ & Bruno Mars",
    duration: 170,
    track_number: 1,
    path: "",
    is_favorite: false,
    favorite_added_at: null,
    last_played_at: null,
    play_count: 30,
    created_at: 1716000000,
    is_online: true,
  },
];

function getCoverUrl(coverPath?: string | null) {
  if (!coverPath) return "";
  if (coverPath.startsWith("http://") || coverPath.startsWith("https://")) {
    return coverPath;
  }
  return convertFileSrc(coverPath);
}

function Index() {
  const { data, isLoading } = useGetHomeDataQuery();
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const currentSong = useAppStore((state) => state.currentSong);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const playSong = useAppStore((state) => state.playSong);

  const fallbackStats = useMemo(
    () => ({
      total_songs: 9090,
      total_albums: 6093,
      total_artists: 5415,
      total_favorites: 1420,
    }),
    []
  );

  // Active track list based on user sort selection
  const tracksList = useMemo(() => {
    if (!data) return CURATED_SAMPLE_TRACKS;

    let pool: Song[] = [];
    if (sortMode === "most_played") {
      pool = data.most_played_songs.length > 0 ? data.most_played_songs : data.recently_added_songs;
    } else if (sortMode === "last_7_days" || sortMode === "last_30_days") {
      pool = data.recently_played_songs.length > 0 ? data.recently_played_songs : data.recently_added_songs;
    } else {
      pool =
        data.recently_added_songs.length > 0
          ? data.recently_added_songs
          : data.recently_played_songs;
    }

    if (pool.length === 0) {
      return CURATED_SAMPLE_TRACKS;
    }
    return pool;
  }, [data, sortMode]);

  const sortLabel = useMemo(() => {
    switch (sortMode) {
      case "recent":
        return "Recent";
      case "most_played":
        return "Most Played";
      case "last_7_days":
        return "Last 7 Days";
      case "last_30_days":
        return "Last 30 Days";
    }
  }, [sortMode]);

  if (isLoading && !data) {
    return <Loading />;
  }

  const activeStats = data?.stats || fallbackStats;

  return (
    <main className="p-3 sm:p-5 pt-[calc(4.25rem+env(safe-area-inset-top,0px))] pb-32 sm:pb-36 w-full h-screen overflow-y-auto custom-scrollbar space-y-4 max-w-3xl mx-auto">
      {/* 1. Material 3 Expressive Hero Stats Card & Profile Capsules (Screenshot 6) */}
      <HeroStatsCard stats={activeStats} />

      {/* 2. List Container with Rounded-t-3xl Shape (Screenshot 6) */}
      <section className="rounded-t-[28px] bg-[#121417] border-t border-x border-white/5 p-3 sm:p-4 space-y-2 shadow-2xl min-h-[460px]">
        {/* List Header: "List" Title + Sort Dropdown */}
        <div className="flex items-center justify-between px-1 py-1">
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
            List
          </h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1e2328] hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-white/5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Clock className="size-3.5 text-zinc-400" />
                <span>{sortLabel}</span>
                <ChevronDown className="size-3.5 text-zinc-400 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-2xl bg-[#1a1f24] border border-white/10 p-1.5 shadow-2xl space-y-1"
            >
              <DropdownMenuItem
                onClick={() => setSortMode("recent")}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                  sortMode === "recent"
                    ? "bg-cyan-950/60 text-cyan-300"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-cyan-400" />
                  <span>Recent</span>
                </div>
                {sortMode === "recent" && <Check className="size-3.5 text-cyan-400" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setSortMode("most_played")}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                  sortMode === "most_played"
                    ? "bg-cyan-950/60 text-cyan-300"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-3.5 text-cyan-400" />
                  <span>Most Played</span>
                </div>
                {sortMode === "most_played" && <Check className="size-3.5 text-cyan-400" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setSortMode("last_7_days")}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                  sortMode === "last_7_days"
                    ? "bg-cyan-950/60 text-cyan-300"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-cyan-400" />
                  <span>Last 7 Days</span>
                </div>
                {sortMode === "last_7_days" && <Check className="size-3.5 text-cyan-400" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setSortMode("last_30_days")}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                  sortMode === "last_30_days"
                    ? "bg-cyan-950/60 text-cyan-300"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-cyan-400" />
                  <span>Last 30 Days</span>
                </div>
                {sortMode === "last_30_days" && <Check className="size-3.5 text-cyan-400" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 3. Track Rows List */}
        <div className="space-y-1 pt-1">
          {/* Pinned "Now Playing" Card (Screenshot 6 Item 1) */}
          {currentSong && (
            <div
              onClick={() => playSong(currentSong, tracksList)}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-[#173449] via-[#122736] to-[#0f1d27] border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg cursor-pointer transition-all hover:opacity-95"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Artwork with Playing Waves Indicator */}
                <div className="size-13 rounded-xl overflow-hidden bg-zinc-800 shrink-0 relative border border-white/10 shadow-xs">
                  {getCoverUrl(currentSong.album_cover_path) ? (
                    <img
                      src={getCoverUrl(currentSong.album_cover_path)}
                      alt={currentSong.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-cyan-300">
                      <Music className="size-6" />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="absolute bottom-1 right-1 flex items-end gap-0.5 p-1 bg-black/60 rounded-md">
                      <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" />
                      <span className="w-1 h-4 bg-cyan-300 rounded-full animate-bounce delay-100" />
                      <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
                    </div>
                  )}
                </div>

                {/* Title & Artist */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-sm sm:text-base font-bold text-white truncate leading-snug">
                    {currentSong.title}
                  </div>
                  <div className="text-xs text-cyan-200/80 truncate">
                    {currentSong.artist_name || "Unknown Artist"}
                  </div>
                </div>
              </div>

              {/* Now Playing Pill Badge & Menu Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-1 rounded-full bg-[#83d3e6] text-[#0d2230] font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 animate-pulse">
                  <span className="size-1.5 rounded-full bg-[#0d2230]" />
                  <span>Now Playing</span>
                </div>

                <ActionsDropdown song={currentSong}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="size-9 rounded-full bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
                    aria-label="Track options"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </ActionsDropdown>
              </div>
            </div>
          )}

          {/* Standard Song Rows */}
          {tracksList.map((track) => {
            const isCurrent = currentSong?.id === track.id;
            if (isCurrent) return null; // Already shown pinned at top

            const cover = getCoverUrl(track.album_cover_path);

            return (
              <div
                key={`home-row-${track.id}`}
                onClick={() => playSong(track, tracksList)}
                className="w-full p-2.5 rounded-2xl hover:bg-[#181d22] active:bg-[#20272e] flex items-center justify-between gap-3 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Artwork */}
                  <div className="size-13 rounded-xl overflow-hidden bg-zinc-850 shrink-0 border border-white/5">
                    {cover ? (
                      <img
                        src={cover}
                        alt={track.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                        <Music className="size-5" />
                      </div>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-sm sm:text-base font-semibold text-white truncate leading-snug group-hover:text-cyan-200 transition-colors">
                      {track.title}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {track.artist_name || "Unknown Artist"}
                    </div>
                  </div>
                </div>

                {/* 3-Dots Menu Button */}
                <ActionsDropdown song={track}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="size-9 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                    aria-label="Options"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </ActionsDropdown>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Index;
