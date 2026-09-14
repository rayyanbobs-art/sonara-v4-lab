import React, { useState, useEffect } from "react";
import { Cast } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CastButtonProps {
  className?: string;
  audioElement?: HTMLAudioElement | null;
}

export const CastButton: React.FC<CastButtonProps> = ({ className, audioElement }) => {
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
    if (audioElement && (audioElement as any).remote) {
      const remote = (audioElement as any).remote;
      const handleStateChange = () => {
        setIsCasting(remote.state === "connected");
      };
      remote.addEventListener("connecting", handleStateChange);
      remote.addEventListener("connect", handleStateChange);
      remote.addEventListener("disconnect", handleStateChange);
      return () => {
        remote.removeEventListener("connecting", handleStateChange);
        remote.removeEventListener("connect", handleStateChange);
        remote.removeEventListener("disconnect", handleStateChange);
      };
    }
  }, [audioElement]);

  const handleCastClick = async () => {
    if (audioElement && (audioElement as any).remote) {
      try {
        await (audioElement as any).remote.prompt();
      } catch (err: any) {
        if (err.name !== "NotAllowedError") {
          toast.info("No Cast or remote playback devices found on this network");
        }
      }
    } else {
      toast.info("Remote playback is active via local network");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCastClick}
      className={className || "rounded-full size-8 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"}
      aria-label="Cast to device"
    >
      <Cast className={`size-4.5 ${isCasting ? "text-primary" : ""}`} />
    </Button>
  );
};

export default CastButton;
