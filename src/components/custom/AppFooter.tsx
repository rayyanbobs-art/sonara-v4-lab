import useCurrentSong from "@/hooks/useCurrentSong";
import AudioPlayer from "@/features/player/components/AudioPlayer";

const AppFooter = () => {
  const currentSong = useCurrentSong();

  if (!currentSong) {
    return null;
  }

  return <AudioPlayer currentSong={currentSong} />;
};

export default AppFooter;
