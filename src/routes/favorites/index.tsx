import { useState, useMemo, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowUpDown,
  ChevronLeft,
  Heart,
  Play,
  Search,
  Shuffle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getFormattedDuration } from "@/lib/helpers";
import useAppStore from "@/store/app-store";
import useGetFavoriteSongsQuery from "@/features/songs/api/useGetFavoriteSongsQuery";
import SongsTable from "@/features/songs/components/SongsTable";
import Loading from "@/components/custom/Loading";

export const Route = createFileRoute("/favorites/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetFavoriteSongsQuery();
  const songs = data ?? [];

  const playSong = useAppStore((state) => state.playSong);
  const isShuffle = useAppStore((state) => state.isShuffle);
  const setIsShuffle = useAppStore((state) => state.setIsShuffle);

  const [searchQuery, setSearchQuery] = useState("");

  const totalDuration = useMemo(
    () => songs.reduce((total, song) => total + song.duration, 0),
    [songs]
  );

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist_name?.toLowerCase().includes(q) ||
        s.album_name?.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  const uniqueArtists = useMemo(() => {
    return Array.from(
      new Set(songs.map((s) => s.artist_name).filter(Boolean))
    ).slice(0, 5) as string[];
  }, [songs]);

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

  if (!data || isLoading) {
    return <Loading />;
  }

  if (songs.length === 0) {
    return (
      <main className="p-4 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-36 md:pb-28 w-full h-screen overflow-y-auto flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <div className="size-24 rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 flex items-center justify-center shadow-xl border border-white/10 mb-4 mx-auto">
              <Heart size={44} className="fill-white text-white drop-shadow-md" />
            </div>
            <EmptyTitle>No Favorite Songs Yet</EmptyTitle>
            <EmptyDescription>
              Songs you mark as favorite will appear here for easy offline listening and quick playback.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              className="text-xs rounded-full px-5 h-9 font-semibold"
              onClick={() => navigate({ to: "/songs" })}
            >
              Browse Library
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const visibleSongs = virtualRows.map((row) => filteredSongs[row.index]);

  return (
    <main
      ref={parentRef}
      className="p-3 sm:p-6 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-36 md:pb-28 w-full h-screen overflow-y-auto custom-scrollbar"
    >
      <div className="flex flex-col lg:flex-row gap-8 items-start max-w-7xl mx-auto">
        {/* Left Column: Header, Actions, and Songs Table */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Back Navigation */}
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
              Playlist
            </span>
          </div>

          {/* Mobile Top Search Bar & Sort (Figma mobile_playlist.png) */}
          <div className="flex sm:hidden items-center gap-2 pt-1 pb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search liked songs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 h-10 rounded-full bg-muted/50 border-border text-xs text-foreground focus:bg-muted"
              />
            </div>
            <button
              className="p-2.5 rounded-full bg-card border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Sort Playlist"
            >
              <ArrowUpDown size={15} />
            </button>
          </div>

          {/* Mobile Artwork Hero (Figma mobile_playlist.png) */}
          <div className="flex sm:hidden flex-col items-center text-center space-y-4 pt-2 pb-2">
            <div className="relative size-56 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 border border-border/60 border-b-4 border-pink-500 flex items-center justify-center">
              <Heart className="size-20 fill-white text-white drop-shadow-lg" />
              <div className="absolute bottom-3 left-3 right-3 py-1.5 px-3 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <div className="w-1 h-3.5 rounded-full bg-pink-500" />
                <span className="text-xs font-black text-white truncate">
                  Liked Songs
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
                Liked Songs
              </h1>
              <p className="text-xs text-muted-foreground">
                By You • {songs.length} {songs.length === 1 ? "song" : "songs"} •{" "}
                {getFormattedDuration(totalDuration)}
              </p>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex items-center justify-end w-full max-w-sm pt-2 px-2 gap-3">
              <button
                onClick={handleShuffle}
                className={`p-2.5 rounded-full border transition-colors ${
                  isShuffle ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground hover:text-foreground bg-muted border-border/60"
                }`}
                aria-label="Shuffle"
              >
                <Shuffle size={18} />
              </button>
              <button
                onClick={handlePlayAll}
                aria-label="Play All"
                className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
              >
                <Play size={20} className="fill-current ml-0.5" />
              </button>
            </div>
          </div>

          {/* Desktop Header (Figma desktop_playlist.png) */}
          <div className="hidden sm:flex flex-col gap-4 pb-4 border-b border-border/60">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] font-semibold text-pink-400 uppercase tracking-wider">
                <Heart size={11} className="fill-pink-400 text-pink-400" />
                Favorites Playlist
              </div>
              <h1 className="text-3xl lg:text-5xl font-black font-heading text-foreground tracking-tight">
                Liked Songs
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                By <span className="text-foreground font-semibold">You</span> &bull;{" "}
                {songs.length} {songs.length === 1 ? "song" : "songs"} &bull;{" "}
                {getFormattedDuration(totalDuration)}
              </p>
            </div>

            {/* Desktop Control Bar */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <Button
                  size="icon-lg"
                  onClick={handlePlayAll}
                  aria-label="Play All"
                  className="size-12 sm:size-13 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
                >
                  <Play size={22} className="fill-current ml-0.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShuffle}
                  aria-label="Shuffle"
                  className={`rounded-full size-10 ${
                    isShuffle ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shuffle size={20} />
                </Button>
              </div>

              {/* Desktop Search Filter */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter liked songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 pr-3 h-8 rounded-full bg-white/5 border-white/10 text-xs focus:bg-white/10 w-full"
                />
              </div>
            </div>
          </div>

          {/* Virtualized Songs Table */}
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {filteredSongs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No songs match "{searchQuery}"
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Right Column: Desktop Preview Panel (Figma desktop_playlist.png) */}
        <div className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 space-y-6 pt-1 pl-4 border-l border-white/5">
          {/* Large Square Artwork with Neon Accent Glow */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-600 border border-white/10 border-b-4 border-pink-500 flex items-center justify-center">
            <Heart className="size-24 fill-white text-white drop-shadow-xl" />
            <div className="absolute bottom-3 left-3 right-3 py-2 px-3 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-pink-500" />
              <span className="text-sm font-black text-white truncate">
                Liked Songs
              </span>
            </div>
          </div>

          {/* Vibe Tags matching Figma */}
          <div className="flex flex-wrap gap-2">
            {["Favorites", "Liked", "Offline Ready", "Top Picks"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Contributing Artists List with Circular Avatars */}
          {uniqueArtists.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Favorite Artists
              </h4>
              <div className="space-y-2.5">
                {uniqueArtists.map((artist) => (
                  <div
                    key={artist}
                    className="flex items-center gap-3 text-sm text-neutral-200 hover:text-white transition-colors"
                  >
                    <div className="size-9 rounded-full bg-linear-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {artist[0]?.toUpperCase() || <User className="size-4" />}
                    </div>
                    <span className="font-semibold truncate">{artist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
