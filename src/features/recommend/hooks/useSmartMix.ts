import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import useAppStore from "@/store/app-store";
import { onlineTrackToSong } from "@/lib/onlineTrack";

export const useSmartMix = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const playSong = useAppStore((state) => state.playSong);

  const startSmartMix = async (song: Song) => {
    if (isGenerating) return;
    setIsGenerating(true);
    const toastId = toast.loading(`Curating Smart Mix based on "${song.title}"...`);

    try {
      const seedTrack: OnlineTrack = {
        id:
          song.online_id ||
          (song.path.startsWith("online://")
            ? song.path.replace(/^online:\/\/[^/]+\//, "")
            : `seed_${song.id}`),
        title: song.title,
        artist: song.artist_name || "Unknown Artist",
        duration: Math.max(1, Math.round(song.duration || 180)),
        thumbnail: song.album_cover_path || "",
        source: "youtube",
        signature: "",
      };

      const tracks = await invoke<OnlineTrack[]>("build_radio", {
        seedTrack,
        limit: 20,
      });

      if (!tracks || tracks.length === 0) {
        toast.error("Could not find matching tracks for this smart mix", { id: toastId });
        return;
      }

      const generatedSongs = tracks.map(onlineTrackToSong);
      const queueWithSeed = [song, ...generatedSongs.filter((s) => s.title !== song.title)];

      playSong(song, queueWithSeed);

      toast.success(`Smart Mix started (${tracks.length} tracks curated)`, { id: toastId });
    } catch (err) {
      console.error("Failed to generate smart mix:", err);
      toast.error("Failed to generate smart mix. Check network connection.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return { startSmartMix, isGenerating };
};

export default useSmartMix;
