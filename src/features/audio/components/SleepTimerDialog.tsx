import React, { useState, useEffect } from "react";
import {
  useAudioEffectsStore,
  type SleepTimerDuration,
} from "../store/useAudioEffectsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Moon, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";

interface SleepTimerDialogProps {
  trigger?: React.ReactNode;
}

export const SleepTimerDialog: React.FC<SleepTimerDialogProps> = ({ trigger }) => {
  const {
    sleepTimerType,
    sleepTimerEndsAt,
    startSleepTimer,
    cancelSleepTimer,
  } = useAudioEffectsStore();

  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    if (!sleepTimerEndsAt) {
      setRemainingSec(null);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((sleepTimerEndsAt - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    const initial = Math.max(0, Math.floor((sleepTimerEndsAt - Date.now()) / 1000));
    setRemainingSec(initial);

    return () => clearInterval(interval);
  }, [sleepTimerEndsAt]);

  const options: { type: SleepTimerDuration; label: string }[] = [
    { type: "15", label: "15 Minutes" },
    { type: "30", label: "30 Minutes" },
    { type: "45", label: "45 Minutes" },
    { type: "60", label: "1 Hour" },
    { type: "end_of_track", label: "End of Current Track" },
  ];

  const handleSelect = (type: SleepTimerDuration) => {
    startSleepTimer(type);
    toast.success(
      type === "end_of_track"
        ? "Playback will stop at the end of this track."
        : `Sleep timer set for ${type} minutes.`
    );
  };

  const handleCancel = () => {
    cancelSleepTimer();
    toast.info("Sleep timer cancelled.");
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? `0${secs}` : secs}s`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full size-9 ${
              sleepTimerType
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Sleep Timer"
          >
            <Moon className="size-4.5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl">
        <DialogHeader className="text-left space-y-1 pb-2">
          <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
            <Moon className="size-5 text-primary" />
            <span>Sleep Timer</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Gradually fade out audio when you fall asleep
          </p>
        </DialogHeader>

        {/* Active Countdown Banner */}
        {sleepTimerType && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Timer className="size-4.5 text-primary animate-pulse" />
              <div>
                <p className="text-xs font-bold text-foreground">
                  {sleepTimerType === "end_of_track"
                    ? "Stopping at track end"
                    : remainingSec !== null
                    ? `Stopping in ${formatCountdown(remainingSec)}`
                    : "Timer active"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Volume gently fades out before stopping
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-8 text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
              aria-label="Cancel Sleep Timer"
            >
              <XCircle className="size-4.5" />
            </Button>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-1.5 pt-2">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type)}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-sm font-semibold transition-all flex items-center justify-between ${
                sleepTimerType === opt.type
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-foreground"
              }`}
            >
              <span>{opt.label}</span>
              {sleepTimerType === opt.type && (
                <span className="text-xs opacity-90">&bull; Active</span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SleepTimerDialog;
