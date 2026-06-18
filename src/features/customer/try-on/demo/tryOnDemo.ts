// Demo / mock mode for the Sam virtual try-on.
//
// When enabled, the try-on flow returns bundled sample assets instead of calling
// the paid FAL API. This lets the full UX be demoed (3D body + dressed result)
// with no credits and no network — ideal for showing the feature to others.
//
// Enable by setting VITE_TRYON_DEMO=true (or "1"), or via the in-app toggle.

const STORAGE_KEY = "wear:tryon-demo";

const envFlag = (): boolean => {
  const raw = import.meta.env.VITE_TRYON_DEMO;
  return raw === "true" || raw === "1" || raw === true;
};

export const isTryOnDemoEnabled = (): boolean => {
  if (envFlag()) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const setTryOnDemoEnabled = (enabled: boolean): void => {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors (private mode, etc.).
  }
};

// Bundled sample assets served from /public/demo.
export const DEMO_ASSETS = {
  bodyModelUrl: "/demo/body.glb",
  dressedImageUrl: "/demo/dressed.png",
} as const;

// Simulated processing delays so the demo feels like the real pipeline.
export const DEMO_BODY_DELAY_MS = 1500;
export const DEMO_DRESS_DELAY_MS = 1500;
