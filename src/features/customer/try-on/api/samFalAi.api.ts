import axios from "axios";

// All FAL traffic goes through our own server-side proxy. Calling queue.fal.run
// directly from the browser is rejected with HTTP 403 (FAL blocks requests that
// carry an Origin header, to prevent API-key leakage). The proxy injects the
// Authorization header server-side and forwards to https://queue.fal.run.
const FAL_PROXY_BASE = "/api/fal";
const FAL_UPSTREAM_BASE = "https://queue.fal.run";

// Rewrite any absolute queue.fal.run URL (e.g. the status_url / response_url that
// the submit call returns) so follow-up polling also goes through our proxy.
const toProxyUrl = (url: string): string =>
  url.startsWith(FAL_UPSTREAM_BASE)
    ? `${FAL_PROXY_BASE}${url.slice(FAL_UPSTREAM_BASE.length)}`
    : url;

export const SAM_ENDPOINTS = {
  body: "fal-ai/sam-3/3d-body",
  objects: "fal-ai/sam-3/3d-objects",
  align: "fal-ai/sam-3/3d-align",
  // Real virtual try-on: dresses the person image with the garment image.
  // SAM-3 3d-align is scene composition only and cannot fit clothes onto a body,
  // so the actual "wear this garment" step uses FASHN's try-on model instead.
  tryon: "fal-ai/fashn/tryon/v1.6",
} as const;

export interface FalFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

export interface SamBodyResult {
  model_glb: FalFile | string;
  visualization: FalFile;
  meshes?: FalFile[];
  metadata?: unknown;
}

export interface SamObjectResult {
  gaussian_splat: FalFile;
  model_glb?: FalFile;
  individual_glbs?: FalFile[];
  metadata?: unknown;
}

export interface SamAlignResult {
  body_mesh_ply: FalFile;
  model_glb: FalFile;
  visualization: FalFile;
  scene_glb?: FalFile;
  metadata?: unknown;
}

export interface FashnTryOnResult {
  images: FalFile[];
}

export type TryOnGarmentCategory = "auto" | "tops" | "bottoms" | "one-pieces";

interface FalSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
  cancel_url?: string;
  queue_position?: number;
}

interface FalStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "ERROR";
  request_id: string;
  response_url: string;
  queue_position?: number;
  error?: string;
  error_type?: string;
}

// No Authorization header is sent from the browser; the proxy adds it.
const jsonHeaders = { "Content-Type": "application/json" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });

export const falFileUrl = (file: FalFile | string | undefined | null): string | null => {
  if (!file) return null;
  if (typeof file === "string") return file.trim() || null;
  return file.url?.trim() || null;
};

// glTF-binary files start with the ASCII magic "glTF" (0x46546C67 little-endian).
const GLB_MAGIC = 0x46546c67;

const isValidGlbBlob = async (blob: Blob): Promise<boolean> => {
  if (blob.size < 12) return false;
  try {
    const header = await blob.slice(0, 4).arrayBuffer();
    return new DataView(header).getUint32(0, true) === GLB_MAGIC;
  } catch {
    return false;
  }
};

// FAL media URLs are temporary and expire after a short window, which makes
// model-viewer re-fetch and fail (showing a red error state). Download the GLB
// once into a persistent blob: URL so the session never re-fetches the remote.
// The download is validated as a real GLB so a JSON/HTML error body (which axios
// happily resolves as a Blob) never reaches model-viewer as an unparsable model.
export const toPersistentModelUrl = async (
  url: string | null,
  signal?: AbortSignal,
): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const response = await axios.get<Blob>(url, {
    responseType: "blob",
    signal,
  });

  const blob = response.data;
  if (!(await isValidGlbBlob(blob))) {
    throw new Error(
      "Sam returned a model file that is not a valid 3D GLB. Please retry with a clearer photo.",
    );
  }

  // Force the correct MIME type so model-viewer reliably detects GLB format.
  const typedBlob =
    blob.type === "model/gltf-binary"
      ? blob
      : new Blob([blob], { type: "model/gltf-binary" });
  return URL.createObjectURL(typedBlob);
};

// Persist a result image (e.g. the FASHN try-on output) as a blob URL so the
// session never re-fetches an expired CDN URL. Falls back to the remote URL if
// the download fails for any reason (images load fine cross-origin in <img>).
export const toPersistentImageUrl = async (
  url: string | null,
  signal?: AbortSignal,
): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  try {
    const response = await axios.get<Blob>(url, { responseType: "blob", signal });
    if (response.data.size === 0) return url;
    return URL.createObjectURL(response.data);
  } catch {
    return url;
  }
};

interface RunSamOptions {
  signal?: AbortSignal;
  pollIntervalMs?: number;
  maxAttempts?: number;
  onStatus?: (status: FalStatusResponse) => void;
}

// Turn FAL/axios errors into clear, user-facing messages. FAL responds with a
// `detail` field (e.g. balance lock) and uses 401/403 for auth/credit problems.
const normalizeFalError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { detail?: string; error?: string } | undefined;
    const detail =
      (typeof data === "object" && (data?.detail || data?.error)) || undefined;

    if (detail && /balance|locked|top up/i.test(detail)) {
      return new Error(
        "The AI try-on service is out of credits. Please top up the FAL account at fal.ai/dashboard/billing.",
      );
    }
    if (status === 401 || status === 403) {
      return new Error(
        detail ??
          "The AI try-on service rejected the request (auth/credit issue). Please check the FAL API key and account balance.",
      );
    }
    if (detail) return new Error(detail);
    if (!error.response) {
      return new Error("Network error reaching the AI try-on service. Please retry.");
    }
  }
  return error instanceof Error ? error : new Error("AI try-on request failed.");
};

const runSam = async <TResult>(
  endpoint: string,
  input: Record<string, unknown>,
  options: RunSamOptions = {},
): Promise<TResult> => {
  const { signal, pollIntervalMs, maxAttempts = 200, onStatus } = options;

  // Adaptive polling: check quickly at first so short jobs finish fast, then
  // back off to avoid hammering the queue on long jobs. A fixed pollIntervalMs
  // (when provided, e.g. in tests) overrides this.
  const intervalFor = (attempt: number): number => {
    if (pollIntervalMs != null) return pollIntervalMs;
    if (attempt < 5) return 1000; // first ~5s: poll every 1s
    if (attempt < 15) return 2000; // next ~20s: every 2s
    return 3000; // afterwards: every 3s
  };

  let submit;
  try {
    submit = await axios.post<FalSubmitResponse>(
      `${FAL_PROXY_BASE}/${endpoint}`,
      input,
      { headers: jsonHeaders, signal },
    );
  } catch (error) {
    if (axios.isCancel(error) || (error as Error)?.name === "AbortError") throw error;
    throw normalizeFalError(error);
  }

  // Route polling through the proxy too (the upstream URLs point at queue.fal.run).
  const statusUrl = toProxyUrl(submit.data.status_url);
  const responseUrl = toProxyUrl(submit.data.response_url);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    let status;
    try {
      status = await axios.get<FalStatusResponse>(statusUrl, { signal });
    } catch (error) {
      if (axios.isCancel(error) || (error as Error)?.name === "AbortError") throw error;
      throw normalizeFalError(error);
    }

    onStatus?.(status.data);

    if (status.data.status === "FAILED" || status.data.status === "ERROR") {
      throw new Error(
        status.data.error ?? "Sam-3 processing failed. Please retry with a clearer photo.",
      );
    }

    if (status.data.status === "COMPLETED") {
      if (status.data.error) {
        throw new Error(status.data.error);
      }
      try {
        const result = await axios.get<TResult>(responseUrl, { signal });
        return result.data;
      } catch (error) {
        if (axios.isCancel(error) || (error as Error)?.name === "AbortError") throw error;
        throw normalizeFalError(error);
      }
    }

    await sleep(intervalFor(attempt));
  }

  throw new Error("Sam-3 processing timed out. Please retry.");
};

export const samFalAiApi = {
  bodyFrom3D: (imageUrl: string, options?: RunSamOptions) =>
    runSam<SamBodyResult>(
      SAM_ENDPOINTS.body,
      {
        image_url: imageUrl,
        export_meshes: true,
        include_3d_keypoints: false,
      },
      options,
    ),

  objectFrom3D: (imageUrl: string, prompt: string, options?: RunSamOptions) =>
    runSam<SamObjectResult>(
      SAM_ENDPOINTS.objects,
      { image_url: imageUrl, prompt, export_textured_glb: true },
      options,
    ),

  align: (
    payload: { imageUrl: string; bodyMeshUrl: string; objectMeshUrl?: string | null },
    options?: RunSamOptions,
  ) =>
    runSam<SamAlignResult>(
      SAM_ENDPOINTS.align,
      {
        image_url: payload.imageUrl,
        body_mesh_url: payload.bodyMeshUrl,
        ...(payload.objectMeshUrl ? { object_mesh_url: payload.objectMeshUrl } : {}),
      },
      options,
    ),

  tryOn: (
    payload: {
      modelImage: string;
      garmentImage: string;
      category?: TryOnGarmentCategory;
    },
    options?: RunSamOptions,
  ) =>
    runSam<FashnTryOnResult>(
      SAM_ENDPOINTS.tryon,
      {
        model_image: payload.modelImage,
        garment_image: payload.garmentImage,
        category: payload.category ?? "auto",
        mode: "balanced",
      },
      options,
    ),
};
