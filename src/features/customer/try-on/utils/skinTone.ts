export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Linear-space neutral skin fallback (~ sRGB #DBAE8F).
const DEFAULT_SKIN_TONE: RgbColor = { r: 0.71, g: 0.43, b: 0.28 };

// YCbCr-based skin detection (lighting-robust) combined with an RGB sanity check.
const isLikelySkinPixel = (r: number, g: number, b: number): boolean => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const ycbcrSkin = cb >= 77 && cb <= 135 && cr >= 133 && cr <= 180;

  const rgbSkin =
    r > 70 &&
    g > 40 &&
    b > 20 &&
    r > g &&
    g >= b &&
    r - b > 12 &&
    max - min > 12;

  return ycbcrSkin && rgbSkin;
};

// sRGB -> linear (model-viewer base-color factor expects linear color space).
const srgbToLinearChannel = (value: number): number => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const rgbToHex = ({ r, g, b }: RgbColor): string => {
  const channel = (value: number) =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

export const extractSkinToneFromImage = (file: File): Promise<RgbColor> =>
  new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const finish = (color: RgbColor) => {
      URL.revokeObjectURL(objectUrl);
      resolve(color);
    };

    image.onload = () => {
      try {
        const maxSize = 256;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return finish(DEFAULT_SKIN_TONE);

        ctx.drawImage(image, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);

        // Weight pixels in the upper-center band (face/neck) where the photo
        // most reliably shows real skin, away from clothes and background.
        const faceTop = Math.floor(height * 0.08);
        const faceBottom = Math.floor(height * 0.45);
        const faceLeft = Math.floor(width * 0.25);
        const faceRight = Math.floor(width * 0.75);

        // Histogram in coarse RGB bins to pick the dominant (mode) skin color,
        // which is far more faithful than a mean that shadows/highlights skew.
        const bins = new Map<number, { r: number; g: number; b: number; n: number }>();

        const collect = (onlyFace: boolean) => {
          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              if (
                onlyFace &&
                (x < faceLeft || x > faceRight || y < faceTop || y > faceBottom)
              ) {
                continue;
              }
              const i = (y * width + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const alpha = data[i + 3];
              if (alpha < 200) continue;
              if (!isLikelySkinPixel(r, g, b)) continue;

              const key =
                ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
              const bucket = bins.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
              bucket.r += r;
              bucket.g += g;
              bucket.b += b;
              bucket.n += 1;
              bins.set(key, bucket);
            }
          }
        };

        // Prefer the face region; fall back to the whole image if too few hits.
        collect(true);
        let total = [...bins.values()].reduce((sum, bucket) => sum + bucket.n, 0);
        if (total < 30) {
          bins.clear();
          collect(false);
          total = [...bins.values()].reduce((sum, bucket) => sum + bucket.n, 0);
        }

        if (total < 20) return finish(DEFAULT_SKIN_TONE);

        // Average the densest bins (top 25% by population) for a stable tone.
        const sorted = [...bins.values()].sort((a, b) => b.n - a.n);
        const keep = Math.max(1, Math.ceil(sorted.length * 0.25));
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let n = 0;
        for (let k = 0; k < keep; k += 1) {
          sumR += sorted[k].r;
          sumG += sorted[k].g;
          sumB += sorted[k].b;
          n += sorted[k].n;
        }

        const avgR = sumR / n;
        const avgG = sumG / n;
        const avgB = sumB / n;

        finish({
          r: srgbToLinearChannel(avgR),
          g: srgbToLinearChannel(avgG),
          b: srgbToLinearChannel(avgB),
        });
      } catch {
        finish(DEFAULT_SKIN_TONE);
      }
    };

    image.onerror = () => finish(DEFAULT_SKIN_TONE);
    image.src = objectUrl;
  });

export { DEFAULT_SKIN_TONE };
