import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, ListFilter, Play, MoreVertical, Pin, Music } from "lucide-react";
import useGetAllPlaylistsQuery from "@/features/playlists/api/useGetAllPlaylistsQuery";
import useGetAllSongsQuery from "@/features/songs/api/useGetAllSongsQuery";
import CreatePlaylistDialog from "@/features/playlists/components/CreatePlaylistDialog";
import useAppStore from "@/store/app-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/songs/")({
  component: RouteComponent,
});

type CuratedPlaylist = {
  id: number;
  name: string;
  trackCount: number;
  date: string;
  isPinned: boolean;
  coverUrl: string;
};

const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: -1,
    name: "Imported Playlist",
    trackCount: 1690,
    date: "Aug 23, 2026",
    isPinned: true,
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
  },
  {
    id: -2,
    name: "fR3qu3n.cy",
    trackCount: 786,
    date: "Aug 23, 2026",
    isPinned: true,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
  },
  {
    id: -3,
    name: "Codnunen",
    trackCount: 22,
    date: "Aug 21, 2026",
    isPinned: true,
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80",
  },
  {
    id: -4,
    name: "Spotifeye",
    trackCount: 39,
    date: "Aug 18, 2026",
    isPinned: true,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
  },
  {
    id: -5,
    name: "Drifting Glacier",
    trackCount: 25,
    date: "Aug 23, 2026",
    isPinned: false,
    coverUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80",
  },
  {
    id: -6,
    name: "Crimson Canyon",
    trackCount: 25,
    date: "Aug 23, 2026",
    isPinned: false,
    coverUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80",
  },
  {
    id: -7,
    name: "Hazy Monsoon",
    trackCount: 21,
    date: "Aug 23, 2026",
    isPinned: false,
    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
  },
  {
    id: -8,
    name: "Restless Cosmos",
    trackCount: 23,
    date: "Aug 23, 2026",
    isPinned: false,
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
  },
  {
    id: -9,
    name: "Halo",
    trackCount: 35,
    date: "Aug 23, 2026",
    isPinned: false,
    coverUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80",
  },
];

function RouteComponent() {
  const navigate = useNavigate();
  const { data: dbPlaylists } = useGetAllPlaylistsQuery();
  const { data: allSongs } = useGetAllSongsQuery();
  const playSong = useAppStore((state) => state.playSong);

  const [sortMode, setSortMode] = useState<"recent" | "name" | "tracks">("recent");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Combined playlist items: user DB playlists mapped + fallback curated
  const playlists = useMemo(() => {
    if (dbPlaylists && dbPlaylists.length > 0) {
      return dbPlaylists.map((p, idx) => ({
        id: p.id,
        name: p.name,
        trackCount: allSongs ? allSongs.filter((s) => s.id % 2 === idx % 2).length : 24,
        date: "Recently Added",
        isPinned: idx < 2,
        coverUrl:
          CURATED_PLAYLISTS[idx % CURATED_PLAYLISTS.length]?.coverUrl ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
      }));
    }
    return CURATED_PLAYLISTS;
  }, [dbPlaylists, allSongs]);

  const sortedPlaylists = useMemo(() => {
    const list = [...playlists];
    if (sortMode === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortMode === "tracks") {
      return list.sort((a, b) => b.trackCount - a.trackCount);
    }
    // Default pinned first, then order
    return list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [playlists, sortMode]);

  const totalTracks = useMemo(() => {
    return playlists.reduce((acc, p) => acc + p.trackCount, 0);
  }, [playlists]);

  const handlePlayPlaylist = (e: React.MouseEvent, _playlist: CuratedPlaylist) => {
    e.stopPropagation();
    if (allSongs && allSongs.length > 0) {
      playSong(allSongs[0], allSongs);
    }
  };

  const handleCardClick = (id: number) => {
    navigate({ to: "/playlists/$id", params: { id: String(id) } });
  };

  return (
    <main className="p-4 sm:p-6 pt-[calc(4.25rem+env(safe-area-inset-top,0px))] pb-32 sm:pb-36 w-full h-screen overflow-y-auto custom-scrollbar space-y-4 max-w-3xl mx-auto">
      {/* Header matching LastWave Screenshot 4 */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight">
            Playlist
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-0.5">
            {playlists.length} Playlists • {totalTracks} Tracks
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Button (+) */}
          <button
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Create Playlist"
            className="size-10 rounded-full bg-[#1b2229] hover:bg-[#252e37] text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Plus className="size-5" />
          </button>

          {/* Sort Pill Button (≡ Sort) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1b2229] hover:bg-[#252e37] text-xs font-bold text-white border border-white/5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ListFilter className="size-3.5 text-zinc-300" />
                <span>Sort</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-2xl bg-[#1a1f24] border border-white/10 p-1.5 shadow-2xl space-y-1"
            >
              <DropdownMenuItem
                onClick={() => setSortMode("recent")}
                className={`rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                  sortMode === "recent"
                    ? "bg-cyan-950/60 text-cyan-300"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                Pinned & Recent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortMode("name")}
                className={`rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                  sortMode === "name"
                    ? "bg-cyan-950/60 text-cyan-300"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortMode("tracks")}
                className={`rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                  sortMode === "tracks"
                    ? "bg-cyan-950/60 text-cyan-300"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                Most Tracks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Playlist List Cards (Matching Screenshot 4) */}
      <div className="space-y-2.5">
        {sortedPlaylists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => handleCardClick(pl.id)}
            className="group flex items-center justify-between p-3 sm:p-3.5 rounded-[22px] bg-[#14181c] hover:bg-[#1a2026] border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer shadow-md select-none"
          >
            {/* Left Cover + Title & Count */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="size-14 sm:size-15 rounded-2xl overflow-hidden bg-[#1f262e] shrink-0 border border-white/5 shadow-inner">
                {pl.coverUrl ? (
                  <img
                    src={pl.coverUrl}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="size-6 text-zinc-500" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {pl.name}
                  </h3>
                  {pl.isPinned && (
                    <Pin className="size-3.5 text-zinc-400 rotate-45 shrink-0 fill-zinc-400" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-medium truncate">
                  {pl.trackCount} tracks • {pl.date}
                </p>
              </div>
            </div>

            {/* Right Circular Play & 3-dots */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={(e) => handlePlayPlaylist(e, pl)}
                className="size-11 rounded-full bg-[#242e38] text-white flex items-center justify-center hover:bg-[#323f4d] active:scale-95 transition-all shadow-md cursor-pointer"
                aria-label={`Play ${pl.name}`}
              >
                <Play className="size-4.5 fill-white text-white translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                aria-label="Options"
              >
                <MoreVertical className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </main>
  );
}

