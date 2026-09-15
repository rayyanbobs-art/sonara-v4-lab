import { useRef } from "react";
import { ChevronLeft, Compass, Search, User } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform } from "@tauri-apps/plugin-os";
import { Link, useCanGoBack, useLocation, useRouter } from "@tanstack/react-router";
import SearchDialog from "@/features/search/components/SearchDialog";

const AppHeader = () => {
  const router = useRouter();
  const location = useLocation();
  const canGoBack = useCanGoBack();
  const containerRef = useRef<HTMLDivElement>(null);
  const appWindow = getCurrentWindow();
  const isHome = location.pathname === "/";

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  const currentPlatform = platform();
  const isMacOS = currentPlatform === "macos";

  const handleDrag = async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.buttons === 1) {
      if (e.detail === 2) {
        await appWindow.toggleMaximize();
      } else {
        await appWindow.startDragging();
      }
    }
  };

  return (
    <header
      ref={containerRef}
      onMouseDown={isMacOS ? handleDrag : undefined}
      data-tauri-drag-region={isMacOS}
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
      }}
      className="fixed top-0 left-0 right-0 z-30 px-4 pb-3 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b border-border/20 transition-all select-none"
    >
      {/* Left: Back Button (if not on Home) + LastWave Brand Title */}
      <div className="flex items-center gap-3">
        {!isHome && (
          <button
            onClick={handleBack}
            className="size-10 rounded-full bg-[#1b2025] hover:bg-zinc-800 text-white flex items-center justify-center border border-white/5 active:scale-95 transition shadow-xs"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <Link
          to="/"
          className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-heading hover:opacity-90 transition-opacity"
        >
          LastWave
        </Link>
      </div>

      {/* Right: Circle 1 (Compass/Stream), Circle 2 (Search), Circle 3 (Profile/Settings) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <Link
          to="/stream"
          className="size-10 rounded-full bg-[#1b2025] hover:bg-zinc-800 text-white flex items-center justify-center border border-white/5 active:scale-95 transition shadow-xs"
          aria-label="Discover & Stream"
        >
          <Compass className="size-5" />
        </Link>

        <SearchDialog
          trigger={
            <button
              type="button"
              className="size-10 rounded-full bg-[#1b2025] hover:bg-zinc-800 text-white flex items-center justify-center border border-white/5 active:scale-95 transition shadow-xs cursor-pointer"
              aria-label="Search"
            >
              <Search className="size-5" />
            </button>
          }
        />

        <Link
          to="/settings"
          className="size-10 rounded-full bg-linear-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/30 text-cyan-300 flex items-center justify-center hover:opacity-90 active:scale-95 transition shadow-xs overflow-hidden"
          aria-label="Profile & Settings"
        >
          <User className="size-5" />
        </Link>
      </div>
    </header>
  );
};

export default AppHeader;
