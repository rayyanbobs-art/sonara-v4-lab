import { Link, useLocation } from "@tanstack/react-router";
import { Home, ListMusic } from "lucide-react";
import ImportButton from "@/features/import/components/ImportButton";
import { cn } from "@/lib/utils";

export const BottomNavBar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isLibrary =
    location.pathname.startsWith("/songs") ||
    location.pathname.startsWith("/playlists") ||
    location.pathname.startsWith("/favorites");

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 flex items-center justify-center pointer-events-none px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#18181b]/90 dark:bg-[#121214]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/60 transition-all">
        {/* Tab 1: Home */}
        <Link
          to="/"
          className={cn(
            "flex items-center justify-center h-11 rounded-full transition-all duration-200 active:scale-95 select-none",
            isHome
              ? "bg-white/20 text-white font-bold shadow-sm px-5"
              : "px-4 text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="size-5 shrink-0" />
          {isHome && (
            <span className="ml-2 text-xs font-semibold tracking-tight whitespace-nowrap">
              Home
            </span>
          )}
        </Link>

        {/* Tab 2: Add / Import / Generator */}
        <div className="flex items-center justify-center size-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95 transition-all">
          <ImportButton />
        </div>

        {/* Tab 3: Playlists */}
        <Link
          to="/songs"
          className={cn(
            "flex items-center justify-center h-11 rounded-full transition-all duration-200 active:scale-95 select-none",
            isLibrary
              ? "bg-white/20 text-white font-bold shadow-sm px-5"
              : "px-4 text-muted-foreground hover:text-foreground"
          )}
        >
          <ListMusic className="size-5 shrink-0" />
          {isLibrary && (
            <span className="ml-2 text-xs font-semibold tracking-tight whitespace-nowrap">
              Playlists
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavBar;
