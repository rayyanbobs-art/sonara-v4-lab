import { useScrobblerStore } from "../store/useScrobblerStore";

export const scrobbleTrack = async (
  artist: string,
  track: string,
  album?: string | null,
  timestampSec: number = Math.floor(Date.now() / 1000)
) => {
  const {
    listenBrainzEnabled,
    listenBrainzToken,
  } = useScrobblerStore.getState();

  if (listenBrainzEnabled && listenBrainzToken) {
    try {
      const payload = {
        listen_type: "single",
        payload: [
          {
            listened_at: timestampSec,
            track_metadata: {
              artist_name: artist,
              track_name: track,
              release_name: album || undefined,
            },
          },
        ],
      };

      await fetch("https://api.listenbrainz.org/1/submit-listens", {
        method: "POST",
        headers: {
          Authorization: `Token ${listenBrainzToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(`[Scrobbler] ListenBrainz scrobbled: ${artist} - ${track}`);
    } catch (err) {
      console.warn("[Scrobbler] ListenBrainz submission failed:", err);
    }
  }
};
