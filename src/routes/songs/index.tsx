import { useState, useMemo, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import useGetAllSongsQuery from "@/features/songs/api/useGetAllSongsQuery";
import useAppStore from "@/store/app-store";
import SongsTable from "@/features/songs/components/SongsTable";
import EmptySongAlert from "@/components/custom/EmptySongAlert";
import Loading from "@/components/custom/Loading";
import { Search, ChevronRight, Disc3, Heart, User } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/songs/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useGetAllSongsQuery();
  const playSong = useAppStore((state) => state.playSong);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSongs = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist_name?.toLowerCase().includes(q) ||
        s.album_name?.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredSongs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
    getItemKey: (index) => filteredSongs[index]?.id ?? index,
  });

  const handleSongSelect = (song: Song) => {
    if (filteredSongs.length > 0) {
      playSong(song, filteredSongs);
    }
  };

  if (!data || isLoading) {
    return <Loading />;
  }

  if (data.length === 0) {
    return <EmptySongAlert />;
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const visibleSongs = virtualRows.map((row) => filteredSongs[row.index]);

  return (
    <main
      className="p-3 sm:p-6 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-36 md:pb-28 w-full h-screen overflow-y-auto custom-scrollbar"
      ref={parentRef}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header & Search Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
              Your Library
            </h1>
            <p className="text-xs text-muted-foreground">
              {filteredSongs.length} {filteredSongs.length === 1 ? "track" : "tracks"}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 h-10 rounded-full bg-muted/50 border-border text-xs text-foreground focus:bg-muted"
            />
          </div>
        </div>

        {/* Mobile Fast Category Shortcuts (Figma mobile_library.png) */}
        {!searchQuery && (
          <div className="grid sm:hidden grid-cols-3 gap-2 pb-2">
            <Link
              to="/favorites"
              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Heart size={15} className="text-primary fill-primary" />
                <span className="text-xs font-semibold text-foreground">Favorites</span>
              </div>
              <ChevronRight size={13} className="text-muted-foreground" />
            </Link>

            <Link
              to="/albums"
              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Disc3 size={15} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Albums</span>
              </div>
              <ChevronRight size={13} className="text-muted-foreground" />
            </Link>

            <Link
              to="/artists"
              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <User size={15} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Artists</span>
              </div>
              <ChevronRight size={13} className="text-muted-foreground" />
            </Link>
          </div>
        )}

        {/* Songs List */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {filteredSongs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No songs matching "{searchQuery}"
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                width: "100%",
                transform: `translateY(${virtualRows[0]?.start ?? 0}px)`,
              }}
            >
              <SongsTable songs={visibleSongs} handleSongClick={handleSongSelect} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
