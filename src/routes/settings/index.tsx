import { createFileRoute } from "@tanstack/react-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  ChevronLeft,
  Disc3,
  ExternalLink,
  Folder,
  Music,
  RefreshCw,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { useTheme } from "@/components/custom/ThemeProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { colorOptions, themeOptions } from "@/constants/constants";
import { checkForAppUpdates } from "@/utils/updater";
import LibraryManagement from "@/features/settings/components/LibraryManagement";
import useGetAppStatsQuery from "@/features/settings/api/useGetAppStatsQuery";
import useAppStore from "@/store/app-store";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setTheme, theme, color, setColor } = useTheme();
  const isShuffleConfig = useAppStore((state) => state.isShuffleConfig);
  const setShuffleConfig = useAppStore((state) => state.setShuffleConfig);

  const repeatModeConfig = useAppStore((state) => state.repeatModeConfig);
  const setRepeatModeConfig = useAppStore((state) => state.setRepeatModeConfig);

  const { data } = useGetAppStatsQuery();

  const handleViewOnGitHub = async () => {
    await openUrl("https://github.com/kaungset03/sonara");
  };

  return (
    <main className="p-3 sm:p-6 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-36 md:pb-28 w-full h-screen overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Back Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            aria-label="Go Back"
            className="size-9 rounded-full bg-muted/50 border border-border hover:bg-muted text-foreground"
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Profile & Settings
          </span>
        </div>

        {/* User Profile Hero Card (Figma Mobile & Desktop Matched) */}
        <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-b from-primary/15 via-card to-background border border-border shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="size-20 sm:size-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-xl flex items-center justify-center text-primary shrink-0">
              <User className="size-10 sm:size-12" />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary uppercase tracking-wider">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Active Library
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-foreground tracking-tight">
                Sonara Listener
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Personalized offline & stream audio workspace
              </p>

              {/* Quick Stat Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted/50 border border-border text-foreground">
                  <Music size={12} className="text-primary" />
                  {data?.total_songs ?? 0} Songs
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted/50 border border-border text-foreground">
                  <Disc3 size={12} className="text-primary" />
                  {data?.total_albums ?? 0} Albums
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted/50 border border-border text-foreground">
                  <User size={12} className="text-primary" />
                  {data?.total_artists ?? 0} Artists
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted/50 border border-border text-foreground">
                  <Folder size={12} className="text-primary" />
                  {data?.total_folders ?? 0} Folders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Appearance Card */}
          <Card className="border-border bg-card backdrop-blur-xs rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                Appearance
              </CardTitle>
              <CardDescription className="text-xs">
                Customize your visual theme and accent color
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Theme Selection */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                  Theme Mode
                </Label>
                <div className="flex items-center gap-4">
                  {themeOptions.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        theme === option
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option}
                        checked={theme === option}
                        onChange={() => setTheme(option)}
                        className="hidden"
                      />
                      <span className="capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Accent Color Swatches */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                  Accent Color
                </Label>
                <div className="flex items-center gap-3">
                  {colorOptions.map((c) => (
                    <button
                      key={c.name}
                      style={{ backgroundColor: c.hex }}
                      aria-label={`Select ${c.name} accent`}
                      className={`size-8 rounded-full transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                        color === c.name
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      onClick={() => setColor(c.name)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Playback Behavior */}
          <Card className="border-border bg-card backdrop-blur-xs rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                Playback Behavior
              </CardTitle>
              <CardDescription className="text-xs">
                Configure default audio playback settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-foreground">
                    Default Shuffle
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Start playback with shuffle enabled by default
                  </p>
                </div>
                <Input
                  type="checkbox"
                  className="size-5 rounded-md accent-primary cursor-pointer"
                  checked={isShuffleConfig}
                  onChange={(e) => setShuffleConfig(e.target.checked)}
                />
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center justify-between w-full">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-foreground">
                    Default Repeat Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose repeat behavior for tracks
                  </p>
                </div>
                <select
                  className="bg-muted border border-border rounded-xl px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  value={repeatModeConfig}
                  onChange={(e) =>
                    setRepeatModeConfig(e.target.value as "off" | "one" | "all")
                  }
                >
                  <option value="off">Off</option>
                  <option value="one">Repeat One</option>
                  <option value="all">Repeat All</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Library Management */}
          <LibraryManagement />

          {/* About Sonara Card */}
          <Card className="border-border bg-card backdrop-blur-xs rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">About Sonara</CardTitle>
              <CardDescription className="text-xs">
                Application details and system updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src="/128x128@2x.png"
                  alt="Sonara"
                  className="size-14 rounded-2xl border border-border shadow-lg"
                />
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">Sonara Stream</h3>
                  <p className="text-xs text-muted-foreground">
                    High-performance local & stream music player built with Tauri, Rust, and React.
                  </p>
                  <p className="text-[11px] font-mono text-primary font-semibold">
                    v{data?.app_version || "0.6.7"}
                  </p>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="text-xs rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 h-9"
                  onClick={() => checkForAppUpdates({ showNoUpdate: true })}
                >
                  <RefreshCw size={13} className="mr-1.5" />
                  Check for Updates
                </Button>
                <Button
                  variant="outline"
                  className="text-xs rounded-full border-border text-foreground hover:bg-muted px-5 h-9"
                  onClick={handleViewOnGitHub}
                >
                  <ExternalLink size={13} className="mr-1.5" />
                  View on GitHub
                </Button>
              </div>

              <Separator className="bg-border" />
              <p className="text-xs text-neutral-500 text-center">
                &copy; 2026 Sonara &bull; Crafted with Rust, Tauri, and React
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
