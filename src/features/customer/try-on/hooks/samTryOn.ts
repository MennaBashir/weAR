import { useCallback, useEffect, useRef, useState } from "react";
import {
  falFileUrl,
  fileToDataUri,
  samFalAiApi,
  toPersistentModelUrl,
  type SamAlignResult,
  type SamBodyResult,
  type SamObjectResult,
} from "@/features/customer/try-on/api/samFalAi.api";
import {
  extractSkinToneFromImage,
  type RgbColor,
} from "@/features/customer/try-on/utils/skinTone";

export type SamBodyStage = "idle" | "uploading" | "building-body" | "ready" | "error";
export type SamDressStage =
  | "idle"
  | "building-object"
  | "aligning"
  | "completed"
  | "error";

export interface SamTryOnResult {
  bodyModelUrl: string | null;
  bodyMeshUrl: string | null;
  bodyVisualizationUrl: string | null;
  objectModelUrl: string | null;
  dressedModelUrl: string | null;
  dressedVisualizationUrl: string | null;
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
  "building-object": "Converting the garment into a 3D object with Sam",
  aligning: "Dressing your 3D avatar with Sam",
  completed: "Your dressed 3D avatar is ready",
  error: "Dressing failed",
};

const emptyResult: SamTryOnResult = {
  bodyModelUrl: null,
  bodyMeshUrl: null,
  bodyVisualizationUrl: null,
  objectModelUrl: null,
  dressedModelUrl: null,
  dressedVisualizationUrl: null,
  isDressed: false,
  skinTone: null,
};

const bodyMeshUrlFrom = (body: SamBodyResult): string | null =>
  falFileUrl(body.meshes?.[0]) ?? falFileUrl(body.model_glb);

const objectMeshUrlFrom = (object: SamObjectResult): string | null =>
  falFileUrl(object.model_glb) ?? falFileUrl(object.individual_glbs?.[0]);

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

  // Step 2: dress (or re-dress) the existing body without rebuilding it.
  const dress = useCallback(
    async (clothesPhoto: File, clothesPrompt?: string) => {
      const personUri = personUriRef.current;
      const bodyMeshUrl = bodyMeshUrlRef.current;
      if (!personUri || !bodyMeshUrl) {
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
        const clothesUri = await fileToDataUri(clothesPhoto);

        setDressStage("building-object");
        const object = await samFalAiApi.objectFrom3D(
          clothesUri,
          clothesPrompt?.trim() || "clothing",
          { signal },
        );
        if (import.meta.env.DEV) {
          console.debug("[Sam] 3d-objects response", object);
        }
        const objectModelUrl = objectMeshUrlFrom(object);
        if (!objectModelUrl) {
          throw new Error(
            "Sam could not build a 3D garment from the clothing photo (no GLB mesh returned). Try a clearer, front-facing garment photo and set the garment type.",
          );
        }

        setDressStage("aligning");
        const aligned: SamAlignResult = await samFalAiApi.align(
          { imageUrl: personUri, bodyMeshUrl, objectMeshUrl: objectModelUrl },
          { signal },
        );
        if (import.meta.env.DEV) {
          console.debug("[Sam] 3d-align response", aligned);
        }

        // The merged body+garment model is `scene_glb`. It is ONLY returned when
        // a valid object mesh was provided. If it is missing, the garment did not
        // merge — surface that instead of silently showing the undressed body.
        const sceneUrl = falFileUrl(aligned.scene_glb);
        if (!sceneUrl) {
          throw new Error(
            "Sam aligned your body but could not merge the garment onto it (no combined scene returned). Try a clearer garment photo or a different angle.",
          );
        }

        // Persist the merged scene GLB as a blob so it never re-fetches an
        // expired FAL URL (the red error state) — and is never re-billed.
        const dressedModelUrl = trackBlob(
          await toPersistentModelUrl(sceneUrl, signal),
        );

        // Swap to the new dressed model only once it is ready.
        setResult((prev) => ({
          ...prev,
          objectModelUrl,
          dressedModelUrl,
          dressedVisualizationUrl: falFileUrl(aligned.visualization),
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
            : "Sam dressing failed. Please retry.",
        );
      } finally {
        dressAbortRef.current = null;
      }
    },
    [cancelDress],
  );

  const isBuildingBody = bodyStage === "uploading" || bodyStage === "building-body";
  const isDressing = dressStage === "building-object" || dressStage === "aligning";

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
    generateBody,
    dress,
    reset,
    cancelBody,
    cancelDress,
  };
}
