import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, Loader2, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OnlineTrackCard from "./OnlineTrackCard";
import BrowseCategoryCard, {
  DISCOVER_CATEGORIES,
  GENRE_CATEGORIES,
} from "./BrowseCategoryCard";
import useAppStore from "@/store/app-store";
import useCurrentSong from "@/hooks/useCurrentSong";

const QUICK_CHIPS = [
  "Lofi Beats",
  "Acoustic Pop",
  "Rock Classics",
  "Synthwave",
  "Bollywood Hits",
  "Chillhop",
  "Jazz & Blues",
];

export const OnlineSearchSection = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OnlineTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);
  const prefetchSetRef = useRef<Set<string>>(new Set());

  const playOnlineTrack = useAppStore((state) => state.playOnlineTrack);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const currentSong = useCurrentSong();

  // Prefetch audio stream on hover
  const handlePrefetch = useCallback((track: OnlineTrack) => {
    if (prefetchSetRef.current.has(track.id)) return;
    prefetchSetRef.current.add(track.id);
    invoke("get_stream_url", { id: track.id }).catch(() => {});
  }, []);

  // Close suggestions on outside click/touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Real-time suggestions fetching
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      invoke<string[]>("get_search_suggestions", { query: trimmed })
        .then((items) => {
          setSuggestions(items || []);
          setShowSuggestions((items || []).length > 0);
          setActiveSuggestionIdx(-1);
        })
        .catch(() => {
          setSuggestions([]);
          setShowSuggestions(false);
        });
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  // Execute Search
  const performSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setShowSuggestions(false);
    setLoading(true);
    setError(null);

    // Spotify URL detection
    if (trimmed.includes("open.spotify.com/track/")) {
      try {
        const resolvedTrack = await invoke<OnlineTrack>("resolve_spotify_track", {
          url: trimmed,
        });
        if (resolvedTrack) {
          setResults([resolvedTrack]);
          playOnlineTrack(resolvedTrack, [resolvedTrack]);
        }
      } catch {
        setError("Failed to resolve Spotify track. Please verify the URL.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // YouTube Search
    try {
      const items = await invoke<OnlineTrack[]>("search_youtube", { query: trimmed });
      setResults(items || []);
      if (!items || items.length === 0) {
        setError("No online tracks found. Try different search terms.");
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to search online music.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIdx >= 0 && activeSuggestionIdx < suggestions.length) {
        const selected = suggestions[activeSuggestionIdx];
        setQuery(selected);
        performSearch(selected);
      } else {
        performSearch(query);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Search Input Bar (Figma Spotify Redesign Pill) */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="What do you want to listen to?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="pl-11 pr-10 h-12 text-sm rounded-full border-white/10 bg-white/5 focus-visible:ring-primary focus-visible:bg-white/10 transition-colors shadow-inner font-medium placeholder:text-muted-foreground/70"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button
            onClick={() => performSearch(query)}
            disabled={loading || !query.trim()}
            className="h-12 px-6 rounded-full font-heading font-semibold shadow-md shadow-primary/20"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsBoxRef}
            className="absolute top-full left-0 right-16 mt-2 py-1.5 rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, idx) => (
              <div
                key={suggestion}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setQuery(suggestion);
                  performSearch(suggestion);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-2.5 transition-colors ${
                  idx === activeSuggestionIdx
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-white/5 text-foreground"
                }`}
              >
                <Search className="size-3.5 opacity-60 shrink-0" />
                <span className="truncate">{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Vibe Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-heading font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
          <Sparkles className="size-3.5 text-primary" />
          Explore:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setQuery(chip);
              performSearch(chip);
            }}
            className="px-3.5 py-1 text-xs rounded-full border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all cursor-pointer font-heading font-medium"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Searching YouTube & Spotify streams...
          </p>
        </div>
      )}

      {/* Results List */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <h3 className="text-sm font-bold tracking-tight text-foreground font-heading">
              Top Results ({results.length})
            </h3>
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setError(null);
              }}
              className="text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              Clear & Browse all
            </button>
          </div>
          <div className="space-y-1.5">
            {results.map((track) => {
              const isCurrent = currentSong?.online_id === track.id || currentSong?.path.includes(track.id);
              return (
                <OnlineTrackCard
                  key={track.id}
                  track={track}
                  isCurrent={isCurrent}
                  isPlaying={isPlaying && isCurrent}
                  onPlay={() => playOnlineTrack(track, results)}
                  onPrefetch={() => handlePrefetch(track)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Figma "Browse All" Category Cards (shown when not searching) */}
      {!loading && results.length === 0 && !error && (
        <div className="space-y-8 pt-2">
          {/* Section 1: Discover */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight">
                Discover
              </h2>
              <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
                <button className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors" aria-label="Previous">
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors" aria-label="Next">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3.5">
              {DISCOVER_CATEGORIES.map((category) => (
                <BrowseCategoryCard
                  key={category.id}
                  category={category}
                  onClick={(searchQuery) => {
                    setQuery(searchQuery);
                    performSearch(searchQuery);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Section 2: Genres */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight">
                Genres
              </h2>
              <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
                <button className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors" aria-label="Previous">
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors" aria-label="Next">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3.5">
              {GENRE_CATEGORIES.map((category) => (
                <BrowseCategoryCard
                  key={category.id}
                  category={category}
                  onClick={(searchQuery) => {
                    setQuery(searchQuery);
                    performSearch(searchQuery);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineSearchSection;
