import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { getFormattedDuration } from "@/lib/helpers";

interface WavySeekBarProps {
  position: number; // in seconds
  duration: number; // in seconds
  isPlaying: boolean;
  onSeek: (position: number) => void;
  className?: string;
  showTimeLabels?: boolean;
  primaryColor?: string; // CSS color string or hex
  accentColor?: string;
  inactiveColor?: string;
}

function smootherstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

export const WavySeekBar: React.FC<WavySeekBarProps> = ({
  position,
  duration,
  isPlaying,
  onSeek,
  className = "",
  showTimeLabels = true,
  primaryColor,
  accentColor,
  inactiveColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1

  // Bounded values
  const boundedDuration = Math.max(0, duration);
  const currentFraction =
    boundedDuration > 0
      ? Math.max(0, Math.min(1, position / boundedDuration))
      : 0;

  const displayFraction = isDragging ? dragProgress : currentFraction;
  const displayPosition = isDragging
    ? dragProgress * boundedDuration
    : Math.min(position, boundedDuration);

  // Animated wave states
  const phaseRef = useRef(0);
  const amplitudeRef = useRef(isPlaying ? 5 : 0);
  const targetAmplitudeRef = useRef(isPlaying ? 5 : 0);
  const animFrameRef = useRef<number | null>(null);

  // Update target amplitude on play/drag state changes
  useEffect(() => {
    if (isDragging) {
      targetAmplitudeRef.current = 1.0; // minimal ripple while seeking
    } else if (isPlaying) {
      targetAmplitudeRef.current = 5.5; // active expressive wave
    } else {
      targetAmplitudeRef.current = 0; // completely smooth/straight when paused
    }
  }, [isPlaying, isDragging]);

  // Read theme colors from CSS computed style if not explicitly passed
  const resolvedColors = useMemo(() => {
    return {
      primary: primaryColor || "var(--primary, #3b82f6)",
      accent: accentColor || "var(--primary, #60a5fa)",
      inactive: inactiveColor || "rgba(128, 128, 128, 0.22)",
      thumb: primaryColor || "var(--primary, #ffffff)",
    };
  }, [primaryColor, accentColor, inactiveColor]);

  // Main rendering loop on HTML5 Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const centerY = height / 2;
    const thumbX = displayFraction * width;
    const trackThickness = 4.5;
    const halfThickness = trackThickness / 2;
    const thumbRadius = isDragging ? 8 : 6;

    // Smoothly interpolate amplitude toward target
    amplitudeRef.current +=
      (targetAmplitudeRef.current - amplitudeRef.current) * 0.12;
    const currentAmp = amplitudeRef.current;

    // 1. Draw Inactive Background Track (Full width rounded capsule)
    ctx.beginPath();
    ctx.lineWidth = trackThickness;
    ctx.lineCap = "round";
    ctx.strokeStyle = resolvedColors.inactive;
    ctx.moveTo(halfThickness, centerY);
    ctx.lineTo(width - halfThickness, centerY);
    ctx.stroke();

    // 2. Draw Active Progress Waves (when thumbX > 0)
    if (thumbX > 0) {
      const wavelength = 48; // wave frequency scale in px
      const transitionLength = 36; // smooth tapering zone before thumb
      const transStartX = Math.max(0, thumbX - transitionLength);

      // Layer 1: Ambient soft wave (shifted phase, lower amplitude)
      if (currentAmp > 0.05) {
        ctx.beginPath();
        ctx.lineWidth = trackThickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = resolvedColors.accent;
        ctx.globalAlpha = 0.45;

        for (let x = 0; x <= thumbX; x += 1.5) {
          const envelope =
            x >= transStartX
              ? 1 - smootherstep((x - transStartX) / transitionLength)
              : 1;
          const wave =
            Math.sin((x / wavelength) * (2 * Math.PI) + phaseRef.current + 1.2) *
            (currentAmp * 0.7) *
            envelope;
          const y = centerY - wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Layer 2: Main foreground luminous wave
      ctx.beginPath();
      ctx.lineWidth = trackThickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = resolvedColors.primary;
      ctx.globalAlpha = 1.0;

      for (let x = 0; x <= thumbX; x += 1.5) {
        const envelope =
          x >= transStartX
            ? 1 - smootherstep((x - transStartX) / transitionLength)
            : 1;
        const wave =
          Math.sin((x / wavelength) * (2 * Math.PI) + phaseRef.current) *
          currentAmp *
          envelope;
        const y = centerY - wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Scrubbing Thumb / Indicator
      ctx.beginPath();
      ctx.arc(thumbX, centerY, thumbRadius, 0, 2 * Math.PI);
      ctx.fillStyle = resolvedColors.thumb;
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Advance phase if playing
    if (isPlaying && !isDragging) {
      phaseRef.current = (phaseRef.current + 0.045) % (2 * Math.PI);
    }
  }, [displayFraction, isPlaying, isDragging, resolvedColors]);

  // Animation frame loop
  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      draw();
      if (
        isPlaying ||
        Math.abs(amplitudeRef.current - targetAmplitudeRef.current) > 0.01
      ) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw, isPlaying]);

  // Handle Resize & Canvas DPI
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 36 * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `36px`;
      draw();
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [draw]);

  // Scrubbing gesture handlers (Pointer Events for touch + mouse)
  const getFractionFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX;
    const offsetX = clientX - rect.left;
    return Math.max(0, Math.min(1, offsetX / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    const fraction = getFractionFromEvent(e);
    setDragProgress(fraction);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const fraction = getFractionFromEvent(e);
    setDragProgress(fraction);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    const fraction = getFractionFromEvent(e);
    const newPosition = fraction * boundedDuration;
    onSeek(newPosition);
  };

  return (
    <div className={`w-full select-none ${className}`}>
      <div
        ref={containerRef}
        className="relative h-9 w-full flex items-center cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="Playback Position"
        aria-valuemin={0}
        aria-valuemax={boundedDuration}
        aria-valuenow={displayPosition}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      {showTimeLabels && (
        <div className="flex items-center justify-between text-xs font-mono font-medium text-muted-foreground px-0.5 -mt-1">
          <span>{getFormattedDuration(displayPosition)}</span>
          <span>{getFormattedDuration(boundedDuration)}</span>
        </div>
      )}
    </div>
  );
};

export default WavySeekBar;
