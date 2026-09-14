import { useRef } from "react";
import { ChevronLeft, Home, Settings, Sparkles, User } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform } from "@tauri-apps/plugin-os";
import { Button } from "@/components/ui/button";
import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import SearchDialog from "@/features/search/components/SearchDialog";
import ImportButton from "@/features/import/components/ImportButton";

const AppHeader = () => {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const containerRef = useRef<HTMLDivElement>(null);
  const appWindow = getCurrentWindow();

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  const currentPlatform = platform();
  const isMacOS = currentPlatform === "macos";

  const handler = async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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
      onMouseDown={isMacOS ? handler : undefined}
      data-tauri-drag-region={isMacOS}
      style={{
        top: "max(0.5rem, env(safe-area-inset-top, 0px))",
      }}
      className="h-14 px-2.5 sm:px-4 py-2 fixed right-2 left-2 md:left-64 rounded-2xl md:rounded-3xl shadow-xl border border-border/60 bg-card/85 backdrop-blur-2xl z-20 flex items-center justify-between gap-3 overflow-hidden"
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Button
          variant="outline"
          className="border border-border/60 shrink-0 size-9 rounded-xl bg-muted/50 text-foreground hover:bg-muted"
          size="icon"
          onClick={handleBack}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Desktop Navigation Pills (Figma Desktop Top Nav) */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            activeProps={{
              className: "bg-primary/15 text-primary font-bold",
            }}
          >
            <Home className="size-4" />
            <span>Home</span>
          </Link>

          <Link
            to="/stream"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            activeProps={{
              className: "bg-primary/15 text-primary font-bold",
            }}
          >
            <Sparkles className="size-4" />
            <span>Discover</span>
          </Link>
        </div>

        {/* Search Bar / Dialog */}
        <div className="flex-1 max-w-md">
          <SearchDialog />
        </div>
      </div>

      {/* Right Utility Group */}
      <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
        <ImportButton />
        <Link
          to="/settings"
          className="hidden md:flex items-center justify-center size-9 rounded-full bg-muted/50 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </Link>
        <Link
          to="/settings"
          className="flex items-center justify-center size-8 sm:size-9 rounded-full bg-linear-to-br from-primary/30 to-primary/10 border border-primary/20 text-primary hover:opacity-90 transition-opacity"
          aria-label="User Profile"
        >
          <User className="size-4 sm:size-4.5" />
        </Link>
      </div>
    </header>
  );
};
export default AppHeader;
