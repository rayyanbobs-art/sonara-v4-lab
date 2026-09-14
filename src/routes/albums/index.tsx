import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, Disc3, Search } from "lucide-react";
import useGetAllAlbumsQuery from "@/features/albums/api/useGetAllAlbumsQuery";
import SortBySelect from "@/components/custom/SortBySelect";
import useAppStore from "@/store/app-store";
import EmptySongAlert from "@/components/custom/EmptySongAlert";
import AlbumsGridView from "@/features/albums/components/AlbumsGridView";
import Loading from "@/components/custom/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/albums/")({
  component: RouteComponent,
});

function RouteComponent() {
  const sortValue = useAppStore((state) => state.albumSortValue);
  const setSortValue = useAppStore((state) => state.setAlbumSortValue);
  const { data: albums, isLoading } = useGetAllAlbumsQuery({
    value: sortValue,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlbums = useMemo(() => {
    if (!albums) return [];
    if (!searchQuery.trim()) return albums;
    const q = searchQuery.toLowerCase();
    return albums.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.artist_name.toLowerCase().includes(q)
    );
  }, [albums, searchQuery]);

  if (!albums || isLoading) {
    return <Loading />;
  }

  if (albums.length === 0) {
    return <EmptySongAlert />;
  }

  return (
    <main className="p-3 sm:p-6 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-36 md:pb-28 w-full h-screen overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              aria-label="Go Back"
              className="size-9 rounded-full bg-card border border-border/60 hover:bg-muted text-foreground"
            >
              <ChevronLeft size={18} />
            </Button>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <Disc3 size={13} />
                Collection
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-foreground tracking-tight">
                Albums
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-3 h-9 rounded-full bg-white/5 border-white/10 text-xs focus:bg-white/10 w-full"
              />
            </div>
            <SortBySelect value={sortValue} onValueChange={setSortValue} />
          </div>
        </div>

        {/* Albums Grid */}
        {filteredAlbums.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No albums match "{searchQuery}"
          </div>
        ) : (
          <AlbumsGridView albums={filteredAlbums} />
        )}
      </div>
    </main>
  );
}
