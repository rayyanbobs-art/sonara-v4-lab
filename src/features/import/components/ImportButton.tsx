import { useState } from "react";
import { Plus, FolderPlus, FileAudio, HardDrive, ListPlus } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { platform } from "@tauri-apps/plugin-os";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useImportFilesMutation from "@/features/import/api/useImportFilesMutation";
import {
  useAddAudioFilesMutation,
  useScanDeviceMusicMutation,
} from "@/features/import/api/useMediaImportMutations";
import CreatePlaylistDialog from "@/features/playlists/components/CreatePlaylistDialog";
import LoadingOverlay from "@/components/custom/LoadingOverlay";

const ImportButton = () => {
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const folderMutation = useImportFilesMutation();
  const fileMutation = useAddAudioFilesMutation();
  const scanMutation = useScanDeviceMusicMutation();

  const isAndroid = platform() === "android";
  const isLoading =
    folderMutation.isPending ||
    fileMutation.isPending ||
    scanMutation.isPending;

  const handleFolderSelection = async () => {
    try {
      const path = await open({
        multiple: false,
        directory: true,
      });
      if (path && typeof path === "string") {
        folderMutation.mutate(path);
      }
    } catch (e) {
      console.warn("Folder picker error:", e);
    }
  };

  const handleFileSelection = async () => {
    try {
      const result = await open({
        multiple: true,
        directory: false,
        filters: [
          {
            name: "Audio Files",
            extensions: [
              "audio/*",
              "mp3",
              "m4a",
              "flac",
              "wav",
              "ogg",
              "opus",
              "aac",
              "webm",
            ],
          },
        ],
      });

      if (!result) return;
      const paths: string[] = Array.isArray(result) ? result : [result];
      if (paths.length > 0) {
        fileMutation.mutate(paths);
      }
    } catch (e) {
      console.error("File picker error:", e);
    }
  };

  const handleScanDevice = () => {
    scanMutation.mutate();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border border-border/60 hover:border-foreground/20 h-9 px-2.5 sm:px-3.5 flex items-center gap-1.5 shrink-0 rounded-xl bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Add Music or Playlist"
          >
            <Plus className="size-4 shrink-0 text-primary" />
            <span className="hidden sm:inline text-xs font-heading font-medium text-foreground">
              Add
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 p-1.5 rounded-2xl bg-card border border-border shadow-xl z-50"
        >
          <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
            Add to Sonara
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border my-1" />

          {/* On Android, folder picking is unsupported by the OS, so provide Select Audio Files and Scan Device Storage */}
          <DropdownMenuItem
            onClick={handleFileSelection}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-muted text-foreground"
          >
            <FileAudio className="size-4 text-primary" />
            <span>Select Audio Files</span>
          </DropdownMenuItem>

          {!isAndroid && (
            <DropdownMenuItem
              onClick={handleFolderSelection}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-muted text-foreground"
            >
              <FolderPlus className="size-4 text-primary" />
              <span>Import Music Folder</span>
            </DropdownMenuItem>
          )}

          {isAndroid && (
            <DropdownMenuItem
              onClick={handleScanDevice}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-muted text-foreground"
            >
              <HardDrive className="size-4 text-primary" />
              <span>Scan Device Storage</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-border my-1" />

          <DropdownMenuItem
            onClick={() => setPlaylistDialogOpen(true)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-muted text-foreground"
          >
            <ListPlus className="size-4 text-primary" />
            <span>New Playlist</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreatePlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        trigger={null}
      />

      <LoadingOverlay open={isLoading} />
    </>
  );
};

export default ImportButton;
