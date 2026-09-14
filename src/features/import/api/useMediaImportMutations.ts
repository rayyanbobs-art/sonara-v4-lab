import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export const useAddAudioFilesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paths: string[]) => {
      const result = await invoke<string>("add_audio_files", { paths });
      return result;
    },
    onSuccess: (msg) => {
      queryClient.refetchQueries({ queryKey: ["importedFolders"] });
      queryClient.refetchQueries({ queryKey: ["homeData"] });
      toast.success(msg);
    },
    onError: (error) => {
      toast.error("Failed to import audio files.");
      console.error("Audio files import error:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["songs", "albums", "artists"],
        exact: false,
      });
    },
  });
};

export const useScanDeviceMusicMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await invoke<string>("scan_device_music");
      return result;
    },
    onSuccess: (msg) => {
      queryClient.refetchQueries({ queryKey: ["importedFolders"] });
      queryClient.refetchQueries({ queryKey: ["homeData"] });
      toast.success(msg);
    },
    onError: (error) => {
      toast.error("Failed to scan device storage.");
      console.error("Device scan error:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["songs", "albums", "artists"],
        exact: false,
      });
    },
  });
};
