import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Radio, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import useScrobblerStore from "../store/useScrobblerStore";

interface ScrobblerDialogProps {
  trigger?: React.ReactNode;
}

export const ScrobblerDialog: React.FC<ScrobblerDialogProps> = ({ trigger }) => {
  const {
    listenBrainzEnabled,
    listenBrainzToken,
    setListenBrainzEnabled,
    setListenBrainzToken,
    lastFmEnabled,
    lastFmUsername,
    setLastFmEnabled,
    setLastFmUsername,
  } = useScrobblerStore();

  const [tokenInput, setTokenInput] = useState(listenBrainzToken);
  const [usernameInput, setUsernameInput] = useState(lastFmUsername);

  const handleSave = () => {
    setListenBrainzToken(tokenInput);
    setLastFmUsername(usernameInput);
    toast.success("Scrobbler settings saved");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Radio className="size-4 text-primary" />
            Scrobbler
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Radio className="size-5 text-primary" />
            Audio Scrobbler
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* ListenBrainz Integration */}
          <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/80">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">
                  ListenBrainz
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Open source community scrobbler by MetaBrainz
                </p>
              </div>
              <Switch
                checked={listenBrainzEnabled}
                onCheckedChange={setListenBrainzEnabled}
              />
            </div>

            {listenBrainzEnabled && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs text-muted-foreground">User Token</Label>
                <Input
                  type="password"
                  placeholder="Paste ListenBrainz user token..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
                <a
                  href="https://listenbrainz.org/profile/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <span>Get token from listenbrainz.org</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </div>

          {/* Last.fm Integration */}
          <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/80">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">
                  Last.fm Profile
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Track and display your listening history
                </p>
              </div>
              <Switch
                checked={lastFmEnabled}
                onCheckedChange={setLastFmEnabled}
              />
            </div>

            {lastFmEnabled && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs text-muted-foreground">Last.fm Username</Label>
                <Input
                  type="text"
                  placeholder="e.g. musical_listener"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
          >
            Save Scrobbler Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScrobblerDialog;
