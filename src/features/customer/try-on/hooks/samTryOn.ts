import { useCallback, useEffect, useRef, useState } from "react";
import {
  falFileUrl,
  fileToDataUri,
  samFalAiApi,
  toPersistentImageUrl,
  toPersistentModelUrl,
  type FashnTryOnResult,
  type SamBodyResult,
  type TryOnGarmentCategory,
} from "@/features/customer/try-on/api/samFalAi.api";
import {
  extractSkinToneFromImage,
  type RgbColor,
} from "@/features/customer/try-on/utils/skinTone";
import {
  DEMO_ASSETS,
  DEMO_BODY_DELAY_MS,
  DEMO_DRESS_DELAY_MS,
  isTryOnDemoEnabled,
} from "@/features/customer/try-on/demo/tryOnDemo";

const wait = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

export type SamBodyStage = "idle" | "uploading" | "building-body" | "ready" | "error";
export type SamDressStage = "idle" | "dressing" | "completed" | "error";

export interface SamTryOnResult {
  bodyModelUrl: string | null;
  bodyMeshUrl: string | null;
  bodyVisualizationUrl: string | null;
  // The realistic 2D image of the person actually wearing the garment (FASHN).
  dressedImageUrl: string | null;
  isDressed: boolean;
  skinTone: RgbColor | null;
}

const BODY_STAGE_LABELS: Record<SamBodyStage, string> = {
  idle: "",
  uploading: "Preparing your photo",
  "building-body": "Converting your photo into a 3D body with Sam",
  ready: "Your 3D body is ready",
  error: "Body generation failed",
};

const DRESS_STAGE_LABELS: Record<SamDressStage, string> = {
  idle: "",
  dressing: "Dressing you in the garment with AI try-on",
  completed: "Your try-on result is ready",
  error: "Dressing failed",
};

const emptyResult: SamTryOnResult = {
  bodyModelUrl: null,
  bodyMeshUrl: null,
  bodyVisualizationUrl: null,
  dressedImageUrl: null,
  isDressed: false,
  skinTone: null,
};

const bodyMeshUrlFrom = (body: SamBodyResult): string | null =>
  falFileUrl(body.meshes?.[0]) ?? falFileUrl(body.model_glb);

const dressedImageUrlFrom = (tryon: FashnTryOnResult): string | null =>
  falFileUrl(tryon.images?.[0]);

export function useSamTryOn() {
  const [bodyStage, setBodyStage] = useState<SamBodyStage>("idle");
  const [dressStage, setDressStage] = useState<SamDressStage>("idle");
  const [result, setResult] = useState<SamTryOnResult>(emptyResult);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [dressError, setDressError] = useState<string | null>(null);

  // Persisted source data so re-dressing never rebuilds the body.
  const personUriRef = useRef<string | null>(null);
  const bodyMeshUrlRef = useRef<string | null>(null);

  const bodyAbortRef = useRef<AbortController | null>(null);
  const dressAbortRef = useRef<AbortController | null>(null);

  // Track blob: URLs we create so they can be revoked and never leak.
  const blobUrlsRef = useRef<string[]>([]);
  const trackBlob = (url: string | null): string | null => {
    if (url && url.startsWith("blob:")) blobUrlsRef.current.push(url);
    return url;
  };
  const revokeBlobs = () => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
  };

  useEffect(() => () => revokeBlobs(), []);

  const cancelBody = useCallback(() => {
    bodyAbortRef.current?.abort();
    bodyAbortRef.current = null;
  }, []);

  const cancelDress = useCallback(() => {
    dressAbortRef.current?.abort();
    dressAbortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancelBody();
    cancelDress();
    revokeBlobs();
    personUriRef.current = null;
    bodyMeshUrlRef.current = null;
    setBodyStage("idle");
    setDressStage("idle");
    setBodyError(null);
    setDressError(null);
    setResult(emptyResult);
  }, [cancelBody, cancelDress]);

  // Step 1: generate the 3D body from the person photo.
  const generateBody = useCallback(
    async (personPhoto: File) => {
      cancelBody();
      cancelDress();
      const controller = new AbortController();
      bodyAbortRef.current = controller;
      const signal = controller.signal;

      setBodyError(null);
      setDressError(null);
      setDressStage("idle");
      setResult(emptyResult);
      bodyMeshUrlRef.current = null;

      try {
        setBodyStage("uploading");
        const [personUri, skinTone] = await Promise.all([
          fileToDataUri(personPhoto),
          extractSkinToneFromImage(personPhoto),
        ]);
        personUriRef.current = personUri;
        setResult((prev) => ({ ...prev, skinTone }));

        setBodyStage("building-body");

        // Demo/mock mode: return a bundled sample 3D body, no FAL call/credits.
        if (isTryOnDemoEnabled()) {
          await wait(DEMO_BODY_DELAY_MS, signal);
          bodyMeshUrlRef.current = DEMO_ASSETS.bodyModelUrl;
          setResult((prev) => ({
            ...prev,
            bodyModelUrl: DEMO_ASSETS.bodyModelUrl,
            bodyMeshUrl: DEMO_ASSETS.bodyModelUrl,
            bodyVisualizationUrl: null,
          }));
          setBodyStage("ready");
          return;
        }

        const body = await samFalAiApi.bodyFrom3D(personUri, { signal });
        const bodyMeshUrl = bodyMeshUrlFrom(body);

        if (!bodyMeshUrl) {
          throw new Error("Sam could not reconstruct a 3D body from the photo.");
        }
        // Keep the remote mesh URL for align (FAL must fetch it server-side).
        bodyMeshUrlRef.current = bodyMeshUrl;

        // model-viewer renders GLB only. The combined body GLB is required to
        // display the 3D body; surface a clear error if it is missing.
        const remoteBodyGlb = falFileUrl(body.model_glb);
        if (!remoteBodyGlb) {
          throw new Error(
            "Sam returned a 3D body mesh but no viewable GLB model. Please retry with a clearer full-body photo.",
          );
        }
        // Persist the renderable GLB as a blob so model-viewer never re-fetches
        // an expired FAL URL (which would render a red error state).
        const bodyModelUrl = trackBlob(
          await toPersistentModelUrl(remoteBodyGlb, signal),
        );
        const bodyVisualizationUrl = falFileUrl(body.visualization);

        setResult((prev) => ({
          ...prev,
          bodyModelUrl,
          bodyMeshUrl,
          bodyVisualizationUrl,
        }));
        setBodyStage("ready");
      } catch (error) {
        if (signal.aborted) {
          setBodyStage("idle");
          return;
        }
        setBodyStage("error");
        setBodyError(
          error instanceof Error
            ? error.message
            : "Sam could not build your 3D body. Please retry.",
        );
      } finally {
        bodyAbortRef.current = null;
      }
    },
    [cancelBody, cancelDress],
  );

  // Step 2: dress (or re-dress) the person using real virtual try-on (FASHN).
  // This puts the garment ONTO the person photo and returns a realistic image —
  // unlike SAM-3 3d-align, which only composes body+object in a shared scene and
  // never fits clothing onto the body.
  const dress = useCallback(
    async (clothesPhoto: File, category?: TryOnGarmentCategory) => {
      const personUri = personUriRef.current;
      if (!personUri) {
        setDressError("Generate your 3D body first, then upload a garment to wear.");
        setDressStage("error");
        return;
      }

      cancelDress();
      const controller = new AbortController();
      dressAbortRef.current = controller;
      const signal = controller.signal;

      setDressError(null);

      try {
        setDressStage("dressing");

        // Demo/mock mode: return a bundled sample dressed image, no FAL call.
        if (isTryOnDemoEnabled()) {
          await wait(DEMO_DRESS_DELAY_MS, signal);
          setResult((prev) => ({
            ...prev,
            dressedImageUrl: DEMO_ASSETS.dressedImageUrl,
            isDressed: true,
          }));
          setDressStage("completed");
          return;
        }

        const garmentUri = await fileToDataUri(clothesPhoto);

        const tryon = await samFalAiApi.tryOn(
          { modelImage: personUri, garmentImage: garmentUri, category },
          { signal },
        );
        if (import.meta.env.DEV) {
          console.debug("[Sam] try-on response", tryon);
        }

        const remoteImageUrl = dressedImageUrlFrom(tryon);
        if (!remoteImageUrl) {
          throw new Error(
            "The try-on model did not return a dressed image. Try a clearer, front-facing garment photo.",
          );
        }

        // Persist the result image as a blob so it never re-fetches an expired
        // FAL/CDN URL and is never re-billed during the session.
        const dressedImageUrl =
          trackBlob(await toPersistentImageUrl(remoteImageUrl, signal)) ??
          remoteImageUrl;

        setResult((prev) => ({
          ...prev,
          dressedImageUrl,
          isDressed: true,
        }));
        setDressStage("completed");
      } catch (error) {
        if (signal.aborted) {
          setDressStage((prev) => (prev === "completed" ? "completed" : "idle"));
          return;
        }
        setDressStage("error");
        setDressError(
          error instanceof Error
            ? error.message
            : "Virtual try-on failed. Please retry.",
        );
      } finally {
        dressAbortRef.current = null;
      }
    },
    [cancelDress],
  );

  const isBuildingBody = bodyStage === "uploading" || bodyStage === "building-body";
  const isDressing = dressStage === "dressing";

  return {
    bodyStage,
    dressStage,
    bodyStageLabel: BODY_STAGE_LABELS[bodyStage],
    dressStageLabel: DRESS_STAGE_LABELS[dressStage],
    result,
    bodyError,
    dressError,
    hasBody: bodyStage === "ready",
    isBuildingBody,
    isDressing,
    isDemo: isTryOnDemoEnabled(),
    generateBody,
    dress,
    reset,
    cancelBody,
    cancelDress,
  };
}
