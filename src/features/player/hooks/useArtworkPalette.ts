import { useState, useEffect, useRef } from "react";

export interface ArtworkPalette {
  dominant: string;
  accent: string;
  glowGradient: string;
  backdropTint: string;
  isLoaded: boolean;
}

const DEFAULT_PALETTE: ArtworkPalette = {
  dominant: "rgb(59, 130, 246)",
  accent: "rgb(96, 165, 250)",
  glowGradient:
    "radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.08) 55%, transparent 85%)",
  backdropTint: "rgba(59, 130, 246, 0.12)",
  isLoaded: false,
};

const paletteCache = new Map<string, ArtworkPalette>();

export function useArtworkPalette(imageUrl?: string | null): ArtworkPalette {
  const [palette, setPalette] = useState<ArtworkPalette>(() => {
    if (imageUrl && paletteCache.has(imageUrl)) {
      return paletteCache.get(imageUrl)!;
    }
    return DEFAULT_PALETTE;
  });

  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    if (!imageUrl) {
      setPalette(DEFAULT_PALETTE);
      return;
    }

    if (paletteCache.has(imageUrl)) {
      setPalette(paletteCache.get(imageUrl)!);
      return;
    }

    abortRef.current = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (abortRef.current) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        // Sample at small resolution (24x24) for instant, zero-lag palette analysis
        const sampleSize = 24;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;

        let maxSat = -1;
        let bestR = 59;
        let bestG = 130;
        let bestB = 246;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-black / near-white edge pixels
          if (a < 128) continue;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 20 || brightness > 245) continue;

          rSum += r;
          gSum += g;
          bSum += b;
          count++;

          // Calculate approximate saturation to find most vibrant accent
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const sat = max === 0 ? 0 : delta / max;

          if (sat > maxSat && sat > 0.15 && brightness > 35 && brightness < 225) {
            maxSat = sat;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }

        const avgR = count > 0 ? Math.round(rSum / count) : 59;
        const avgG = count > 0 ? Math.round(gSum / count) : 130;
        const avgB = count > 0 ? Math.round(bSum / count) : 246;

        const dominant = `rgb(${avgR}, ${avgG}, ${avgB})`;
        const accent = `rgb(${bestR}, ${bestG}, ${bestB})`;
        const glowGradient = `radial-gradient(circle at 50% 35%, rgba(${bestR}, ${bestG}, ${bestB}, 0.38) 0%, rgba(${avgR}, ${avgG}, ${avgB}, 0.12) 55%, transparent 85%)`;
        const backdropTint = `rgba(${avgR}, ${avgG}, ${avgB}, 0.16)`;

        const result: ArtworkPalette = {
          dominant,
          accent,
          glowGradient,
          backdropTint,
          isLoaded: true,
        };

        paletteCache.set(imageUrl, result);
        setPalette(result);
      } catch (err) {
        console.warn("Artwork palette extraction fallback:", err);
        setPalette({ ...DEFAULT_PALETTE, isLoaded: true });
      }
    };

    img.onerror = () => {
      if (!abortRef.current) {
        setPalette({ ...DEFAULT_PALETTE, isLoaded: true });
      }
    };

    img.src = imageUrl;

    return () => {
      abortRef.current = true;
    };
  }, [imageUrl]);

  return palette;
}

export default useArtworkPalette;
