import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookImage, HardDrive, Music, Radio, Search, User, X } from "lucide-react";
import SearchResultItem from "@/features/search/components/SearchResultItem";
import useSearchLibraryQuery from "@/features/search/api/useSearchLibraryQuery";
import useAppStore from "@/store/app-store";
import useDebounce from "@/hooks/useDebounce";
import OnlineSearchSection from "@/features/online/components/OnlineSearchSection";

const SearchDialog = () => {
  const [mode, setMode] = useState<"library" | "online">("library");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce({ value: search });
  const [open, setOpen] = useState(false);

  const { data } = useSearchLibraryQuery({ search: debouncedSearch });
  const navigate = useNavigate();
  const playSong = useAppStore((state) => state.playSong);

  const closeDialog = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex justify-start items-center border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground gap-2 flex-1 min-w-0 max-w-sm h-9 px-4 rounded-full overflow-hidden transition-colors"
        >
          <Search size={15} className="shrink-0 text-muted-foreground" />
          <span className="text-xs font-heading truncate">
            Search library or stream...
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle hidden>
            <span className="text-hidden">Search</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search your local library or stream music from YouTube and Spotify.
          </DialogDescription>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("library")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  mode === "library"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HardDrive className="size-3.5" />
                Offline Library
              </button>
              <button
                type="button"
                onClick={() => setMode("online")}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  mode === "online"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Radio className="size-3.5" />
                YouTube & Spotify
              </button>
            </div>

            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X size={16} />
              </Button>
            </DialogClose>
          </div>

          {mode === "library" && (
            <div className="flex items-center gap-2 pt-2">
              <Input
                autoFocus
                placeholder="Search offline songs, artists, albums..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </DialogHeader>

        {mode === "online" ? (
          <div className="max-h-[70vh] overflow-y-auto no-scrollbar py-2">
            <OnlineSearchSection />
          </div>
        ) : search.trim() === "" ? (
          <div className="py-10">
            <Music size={48} className="mx-auto text-muted-foreground" />
            <p className="text-center text-muted-foreground mt-4">
              Start typing to search your offline library...
            </p>
          </div>
        ) : data ? (
          <div className="space-y-6 w-full max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                SONGS ({data.songs.length})
              </h3>
              <div className="space-y-1">
                {data.songs.map((song) => (
                  <SearchResultItem
                    key={song.id}
                    title={song.title}
                    description={`${song.artist_name} • ${song.album_name}`}
                    icon={
                      <Music
                        size={20}
                        className="text-muted-foreground shrink-0"
                      />
                    }
                    handleClick={() => {
                      playSong(song, data.songs);
                      closeDialog();
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                ARTISTS ({data.artists.length})
              </h3>
              <div className="space-y-1">
                {data.artists.map((artist) => (
                  <SearchResultItem
                    key={artist.name}
                    title={artist.name}
                    icon={
                      <User
                        size={20}
                        className="text-muted-foreground shrink-0"
                      />
                    }
                    handleClick={() => {
                      navigate({
                        to: "/artists/$id",
                        params: { id: artist.id.toString() },
                      });
                      closeDialog();
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                ALBUMS ({data.albums.length})
              </h3>
              <div className="space-y-1">
                {data.albums.map((album) => (
                  <SearchResultItem
                    key={album.name}
                    title={album.name}
                    description={`${album.artist_name}`}
                    icon={
                      <BookImage
                        size={20}
                        className="text-muted-foreground shrink-0"
                      />
                    }
                    handleClick={() => {
                      navigate({
                        to: "/albums/$id",
                        params: { id: album.id.toString() },
                      });
                      closeDialog();
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-5 w-full h-full flex justify-center items-center">
            <div className="size-5 rounded-full border-t border-primary animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default SearchDialog;
