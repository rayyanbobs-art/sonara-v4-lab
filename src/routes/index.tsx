import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Album,
  ChevronLeft,
  ChevronRight,
  Heart,
  MoreHorizontal,
  Music,
  Radio,
  SlidersHorizontal,
  Sparkle,
  User,
} from "lucide-react";
import EmptySongAlert from "@/components/custom/EmptySongAlert";
import QuickAccessCard from "@/features/home/components/QuickAccessCard";
import ArtworkTrackCard from "@/features/home/components/ArtworkTrackCard";
import useGetHomeDataQuery from "@/features/home/api/useGetHomeDataQuery";
import Loading from "@/components/custom/Loading";

export const Route = createFileRoute("/")({
  component: Index,
});

type CategoryFilter = "all" | "music" | "favorites" | "stream";

const MIX_STYLES = [
  { tag: "Rock Mix", color: "bg-amber-400" },
  { tag: "Chill Mix", color: "bg-yellow-400" },
  { tag: "Pop Mix", color: "bg-cyan-400" },
  { tag: "Electronic", color: "bg-indigo-500" },
  { tag: "Happy Mix", color: "bg-emerald-400" },
  { tag: "Indie Mix", color: "bg-rose-500" },
  { tag: "Upbeat Mix", color: "bg-teal-400" },
  { tag: "Acoustic", color: "bg-orange-400" },
];

function Index() {
  const { data, isLoading } = useGetHomeDataQuery();
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>("all");

  if (!data || isLoading) {
    return <Loading />;
  }

  if (data.recently_added_songs.length > 0) {
    // Quick access items: up to 6 recently played songs, fallback to most played or recently added
    const quickAccessSongs = (
      data.recently_played_songs.length >= 2
        ? data.recently_played_songs
        : data.most_played_songs.length > 0
          ? data.most_played_songs
          : data.recently_added_songs
    ).slice(0, 6);

    return (
      <main className="p-3 sm:p-6 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-28 sm:pb-32 w-full h-screen space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar">
        {/* Top Category Filter Chips (Figma Spotify Redesign Pattern) */}
        <section className="flex items-center justify-between gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                selectedFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter("music")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                selectedFilter === "music"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Music
            </button>
            <Link
              to="/favorites"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border flex items-center gap-1.5"
            >
              <Heart size={13} className="text-primary" />
              <span>Favorites</span>
            </Link>
            <Link
              to="/stream"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border flex items-center gap-1.5"
            >
              <Radio size={13} className="text-primary" />
              <span>Stream</span>
            </Link>
          </div>

          <div className="shrink-0 flex items-center">
            <button
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border transition-colors"
              aria-label="Filter Options"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </section>

        {/* Quick-Access Recents Grid (2-column on mobile, 4-column on desktop) */}
        {quickAccessSongs.length > 0 && selectedFilter !== "stream" && (
          <section className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {quickAccessSongs.map((song) => (
                <QuickAccessCard
                  key={`quick-${song.id}`}
                  song={song}
                  songs={quickAccessSongs}
                />
              ))}
            </div>
          </section>
        )}

        {/* Made For You Section (Figma Spotify Redesign Pattern) */}
        {data.recently_played_songs.length > 0 && selectedFilter !== "stream" && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
                Made For You
              </h2>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <button className="hidden sm:flex p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="Previous">
                  <ChevronLeft size={18} />
                </button>
                <button className="hidden sm:flex p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="Next">
                  <ChevronRight size={18} />
                </button>
                <button className="p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="More options">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden sm:grid gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {data.recently_played_songs.slice(0, 6).map((song) => (
                <ArtworkTrackCard
                  key={`cont-desk-${song.id}`}
                  song={song}
                  songs={data.recently_played_songs}
                  isStacked
                  badge="50"
                />
              ))}
            </div>

            {/* Mobile: Horizontal Carousel */}
            <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory scrollbar-none">
              {data.recently_played_songs.slice(0, 8).map((song) => (
                <div
                  key={`cont-mob-${song.id}`}
                  className="w-36 shrink-0 snap-start"
                >
                  <ArtworkTrackCard
                    song={song}
                    songs={data.recently_played_songs}
                    isStacked
                    badge="50"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Your Top Mixes Section */}
        {data.most_played_songs.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
                Your top mixes
              </h2>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <button className="hidden sm:flex p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="Previous">
                  <ChevronLeft size={18} />
                </button>
                <button className="hidden sm:flex p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="Next">
                  <ChevronRight size={18} />
                </button>
                <button className="p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="More options">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden sm:grid gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {data.most_played_songs.slice(0, 6).map((song, idx) => (
                <ArtworkTrackCard
                  key={`most-desk-${song.id}`}
                  song={song}
                  songs={data.most_played_songs}
                  isStacked
                  badge="50"
                  tag={MIX_STYLES[idx % MIX_STYLES.length].tag}
                  tagColor={MIX_STYLES[idx % MIX_STYLES.length].color}
                />
              ))}
            </div>

            {/* Mobile: Horizontal Carousel */}
            <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory scrollbar-none">
              {data.most_played_songs.slice(0, 8).map((song, idx) => (
                <div
                  key={`most-mob-${song.id}`}
                  className="w-36 shrink-0 snap-start"
                >
                  <ArtworkTrackCard
                    song={song}
                    songs={data.most_played_songs}
                    isStacked
                    badge="50"
                    tag={MIX_STYLES[idx % MIX_STYLES.length].tag}
                    tagColor={MIX_STYLES[idx % MIX_STYLES.length].color}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Added Section */}
        {data.recently_added_songs.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 font-heading text-foreground">
                <Sparkle size={18} className="text-primary fill-primary" />
                Recently Added
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  to="/songs"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  View all
                </Link>
                <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                  <button className="p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="Previous">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="p-1 rounded-full hover:bg-muted hover:text-foreground transition-colors" aria-label="Next">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden sm:grid gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {data.recently_added_songs.slice(0, 6).map((song) => (
                <ArtworkTrackCard
                  key={`recent-desk-${song.id}`}
                  song={song}
                  songs={data.recently_added_songs}
                />
              ))}
            </div>

            {/* Mobile: Horizontal Carousel */}
            <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory scrollbar-none">
              {data.recently_added_songs.slice(0, 8).map((song) => (
                <div
                  key={`recent-mob-${song.id}`}
                  className="w-36 shrink-0 snap-start"
                >
                  <ArtworkTrackCard
                    song={song}
                    songs={data.recently_added_songs}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Library Shortcuts (Figma / Spotify Bottom Chips) */}
        <section className="pt-2 pb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <Link to="/songs" className="shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <Music size={14} className="text-primary" />
                <span>{data.stats.total_songs} Songs</span>
              </div>
            </Link>
            <Link to="/artists" className="shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <User size={14} className="text-primary" />
                <span>{data.stats.total_artists} Artists</span>
              </div>
            </Link>
            <Link to="/albums" className="shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <Album size={14} className="text-primary" />
                <span>{data.stats.total_albums} Albums</span>
              </div>
            </Link>
            <Link to="/favorites" className="shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <Heart size={14} className="text-primary" />
                <span>{data.stats.total_favorites} Favorites</span>
              </div>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <EmptySongAlert />;
}
