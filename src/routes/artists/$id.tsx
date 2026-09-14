import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Play,
  Search,
  Shuffle,
  User,
  Check,
} from "lucide-react";
import { getFormattedDuration } from "@/lib/helpers";
import useAppStore from "@/store/app-store";
import useGetSongsByArtistQuery from "@/features/artists/api/useGetSongsByArtistQuery";
import SongsTable from "@/features/songs/components/SongsTable";
import UpdateArtistImageButton from "@/features/artists/components/UpdateArtistImageButton";
import AlbumsGridView from "@/features/albums/components/AlbumsGridView";
import Loading from "@/components/custom/Loading";

export const Route = createFileRoute("/artists/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data, isLoading } = useGetSongsByArtistQuery(parseInt(id));

  const playSong = useAppStore((state) => state.playSong);
  const isShuffle = useAppStore((state) => state.isShuffle);
  const setIsShuffle = useAppStore((state) => state.setIsShuffle);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"tracks" | "albums">("tracks");
  const [isFollowing, setIsFollowing] = useState(false);

  const songs = data?.songs ?? [];

  const totalDuration = useMemo(
    () => songs.reduce((total, song) => total + song.duration, 0),
    [songs]
  );

  const albums: Album[] = useMemo(() => {
    const map = new Map<number, Album>();
    songs.forEach((s) => {
      if (s.album_id && !map.has(s.album_id)) {
        map.set(s.album_id, {
          id: s.album_id,
          name: s.album_name || "Unknown Album",
          artist_id: s.artist_id,
          artist_name: s.artist_name,
          cover_path: s.album_cover_path,
        });
      }
    });
    return Array.from(map.values());
  }, [songs]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.album_name?.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredSongs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
    getItemKey: (index) => filteredSongs[index]?.id ?? index,
  });

  const handleSongClick = (song: Song) => {
    if (filteredSongs.length > 0) {
      playSong(song, filteredSongs);
    }
  };

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      playSong(filteredSongs[0], filteredSongs);
    }
  };

  const handleShuffle = () => {
    setIsShuffle(!isShuffle);
    if (filteredSongs.length > 0) {
      playSong(filteredSongs[0], filteredSongs);
    }
  };

  if (isLoading || !data) {
    return <Loading />;
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const visibleSongs = virtualRows.map((row) => filteredSongs[row.index]);

  return (
    <main
      ref={parentRef}
      className="p-3 sm:p-6 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-36 md:pb-28 w-full h-screen space-y-6 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back navigation button */}
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
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Artist Profile
          </span>
        </div>

        {/* Hero Card with Gradient Backdrop (Spotify / Figma Aligned) */}
        <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-b from-primary/20 via-muted/30 to-card border border-border shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            {/* Artist Avatar */}
            <div className="relative group shrink-0">
              <div className="size-36 sm:size-48 md:size-52 rounded-full overflow-hidden bg-muted border-2 border-border shadow-2xl flex items-center justify-center">
                {data.artist.image_path ? (
                  <img
                    src={convertFileSrc(data.artist.image_path)}
                    alt={data.artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-muted-foreground/60">
                    <User size={80} />
                  </div>
                )}
              </div>
              <UpdateArtistImageButton artistId={data.artist.id} />
            </div>

            {/* Artist Details */}
            <div className="flex flex-col gap-y-2 min-w-0 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <div className="size-4 rounded-full bg-sky-500 flex items-center justify-center text-white">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider">
                  Verified Artist
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-foreground drop-shadow-sm">
                {data.artist.name}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {songs.length} {songs.length === 1 ? "track" : "tracks"} •{" "}
                {getFormattedDuration(totalDuration)}
                {albums.length > 0 &&
                  ` • ${albums.length} ${albums.length === 1 ? "album" : "albums"}`}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
                <Button
                  size="icon-lg"
                  onClick={handlePlayAll}
                  aria-label="Play All"
                  className="rounded-full size-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <Play size={22} className="fill-current ml-0.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShuffle}
                  aria-label="Shuffle"
                  className={`rounded-full size-10 ${
                    isShuffle
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shuffle size={20} />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`rounded-full px-5 h-9 text-xs font-bold uppercase tracking-wider transition-colors ${
                    isFollowing
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection & Search Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("tracks")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "tracks"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-muted"
              }`}
            >
              Popular Tracks ({songs.length})
            </button>
            {albums.length > 0 && (
              <button
                onClick={() => setActiveTab("albums")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "albums"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-muted"
                }`}
              >
                Albums & Singles ({albums.length})
              </button>
            )}
          </div>

          {activeTab === "tracks" && songs.length > 5 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-3 h-8 rounded-full bg-white/5 border-white/10 text-xs focus:bg-white/10 w-full"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "tracks" ? (
          <div>
            {filteredSongs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No tracks match "{searchQuery}"
              </div>
            ) : (
              <div
                style={{
                  height: rowVirtualizer.getTotalSize(),
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    transform: `translateY(${virtualRows[0]?.start ?? 0}px)`,
                  }}
                >
                  <SongsTable
                    songs={visibleSongs}
                    handleSongClick={handleSongClick}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-2">
            <AlbumsGridView albums={albums} />
          </div>
        )}
      </div>
    </main>
  );
}
