import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { Ellipsis, Radio } from "lucide-react";
import useAppStore from "@/store/app-store";
import EditSongInfoDialog from "@/features/songs/components/EditSongInfoDialog";
import useSmartMix from "@/features/recommend/hooks/useSmartMix";

type ActionsDropdownProps = {
  song: Song;
  children: React.ReactNode;
  className?: string;
};

const ActionsDropdown = ({ song, children, className }: ActionsDropdownProps) => {
  const addToQueue = useAppStore((state) => state.addToQueue);
  const { startSmartMix } = useSmartMix();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className || "size-4 hover:text-primary"}
        >
          <Ellipsis size={14} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {children}
        <EditSongInfoDialog
          id={song.id}
          title={song.title}
          artist_name={song.artist_name}
          album_name={song.album_name}
          album_artist={song.album_artist_name}
          track_number={song.track_number}
        />
        <DropdownMenuItem
          className="text-xs gap-2 font-medium cursor-pointer text-primary"
          onClick={(e) => {
            e.stopPropagation();
            startSmartMix(song);
          }}
        >
          <Radio size={14} className="text-primary" />
          Start Smart Mix
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs"
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(song);
          }}
        >
          Add to Queue
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" asChild>
          <Link
            onClick={(e) => e.stopPropagation()}
            to={"/artists/$id"}
            params={{ id: song.artist_id.toString() }}
          >
            View Artist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" asChild>
          <Link
            onClick={(e) => e.stopPropagation()}
            to={"/albums/$id"}
            params={{ id: song.album_id.toString() }}
          >
            View Album
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default ActionsDropdown;
