import { useEffect, useRef, useState, useMemo } from "react";
import { parseLRC } from "@/lib/helpers";

export type LyricsMotionStyle =
  | "apple_fluid"
  | "karaoke_pulse"
  | "kinetic_slide"
  | "cinematic_blur";

interface RenderLyricsViewProps {
  content: string;
  audioCurrentTime: number;
  onSeek?: (timeInSeconds: number) => void;
  accentColor?: string;
}

const MOTION_STYLES: { id: LyricsMotionStyle; label: string }[] = [
  { id: "apple_fluid", label: "Fluid" },
  { id: "karaoke_pulse", label: "Pulse" },
  { id: "kinetic_slide", label: "Slide" },
  { id: "cinematic_blur", label: "Cinematic" },
];

export const RenderLyricsView: React.FC<RenderLyricsViewProps> = ({
  content,
  audioCurrentTime,
  onSeek,
  accentColor = "var(--primary)",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [motionStyle, setMotionStyle] = useState<LyricsMotionStyle>("apple_fluid");

  const lyricsLines = useMemo(() => {
    return parseLRC(content);
  }, [content]);

  const lastIndexRef = useRef(-1);

  // Track active line according to audioCurrentTime
  useEffect(() => {
    if (!lyricsLines?.length) return;

    let currentLineIndex = -1;
    for (let i = 0; i < lyricsLines.length; i++) {
      if (audioCurrentTime >= lyricsLines[i].time) {
        currentLineIndex = i;
      } else {
        break;
      }
    }

    if (currentLineIndex !== lastIndexRef.current) {
      lastIndexRef.current = currentLineIndex;
      setActiveIndex(currentLineIndex);
    }
  }, [audioCurrentTime, lyricsLines]);

  // Smooth scroll into focus
  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeIndex]);

  // Compute CSS styling based on active state and chosen motion style
  const getLineStyle = (index: number, isActive: boolean) => {
    const isPast = index < activeIndex;

    switch (motionStyle) {
      case "karaoke_pulse":
        return isActive
          ? "scale-110 font-bold opacity-100 shadow-xs animate-pulse"
          : "opacity-35 scale-95 font-medium";

      case "kinetic_slide":
        return isActive
          ? "translate-x-3 scale-105 font-bold opacity-100"
          : "translate-x-0 opacity-30 font-medium";

      case "cinematic_blur":
        return isActive
          ? "scale-110 font-bold opacity-100 blur-none"
          : `opacity-30 scale-95 font-medium ${isPast ? "blur-[1.5px]" : "blur-[1.2px]"}`;

      case "apple_fluid":
      default:
        return isActive
          ? "scale-110 font-bold opacity-100 drop-shadow-md"
          : "opacity-35 scale-95 font-medium";
    }
  };

  if (!lyricsLines || lyricsLines.length === 0) {
    // If lyrics content is plain text without LRC timestamps
    return (
      <div className="h-full w-full overflow-y-auto px-6 py-6 text-center text-sm font-medium text-muted-foreground whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col justify-between overflow-hidden">
      {/* Motion Style Switcher Pill Bar (Material 3 Expressive) */}
      <div className="flex items-center justify-center gap-1.5 py-1 px-4 mb-2 shrink-0 select-none">
        {MOTION_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => setMotionStyle(style.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
              motionStyle === style.id
                ? "bg-primary text-primary-foreground shadow-xs scale-105"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Synchronized Lyrics Container with Click-to-Seek */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto space-y-7 text-center px-6 py-12 scrollbar-none mask-fade-y select-none"
      >
        {lyricsLines.map((line, index) => {
          const isActive = index === activeIndex;
          return (
            <p
              key={`${line.time}-${line.text}-${index}`}
              onClick={() => onSeek && onSeek(line.time)}
              style={{
                color: isActive ? accentColor : undefined,
              }}
              className={`text-lg md:text-xl font-heading transition-all duration-300 ease-out cursor-pointer hover:opacity-90 active:scale-95 ${getLineStyle(
                index,
                isActive
              )}`}
              title="Click to seek"
            >
              {line.text || "• • •"}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default RenderLyricsView;
