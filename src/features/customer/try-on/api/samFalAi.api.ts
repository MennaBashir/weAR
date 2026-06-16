import axios from "axios";

const FAL_QUEUE_BASE = "https://queue.fal.run";

const FAL_API_KEY =
  import.meta.env.VITE_FAL_API_KEY ||
  "86b47234-1e41-423c-a055-f96f2c06d165:b38970272c89034868fdafea921121ca";

export const SAM_ENDPOINTS = {
  body: "fal-ai/sam-3/3d-body",
  objects: "fal-ai/sam-3/3d-objects",
  align: "fal-ai/sam-3/3d-align",
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

interface FalSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
  cancel_url?: string;
  queue_position?: number;
}

interface FalStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
  request_id: string;
  response_url: string;
  queue_position?: number;
  error?: string;
  error_type?: string;
}

const authHeaders = {
  Authorization: `Key ${FAL_API_KEY}`,
  "Content-Type": "application/json",
};

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

// FAL media URLs are temporary and expire after a short window, which makes
// model-viewer re-fetch and fail (showing a red error state). Download the GLB
// once into a persistent blob: URL so the session never re-fetches the remote.
export const toPersistentModelUrl = async (
  url: string | null,
  signal?: AbortSignal,
): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  try {
    const response = await axios.get<Blob>(url, {
      responseType: "blob",
      signal,
    });
    return URL.createObjectURL(response.data);
  } catch {
    // Fall back to the remote URL if download fails.
    return url;
  }
};

interface RunSamOptions {
  signal?: AbortSignal;
  pollIntervalMs?: number;
  maxAttempts?: number;
  onStatus?: (status: FalStatusResponse) => void;
}

const runSam = async <TResult>(
  endpoint: string,
  input: Record<string, unknown>,
  options: RunSamOptions = {},
): Promise<TResult> => {
  const { signal, pollIntervalMs = 3000, maxAttempts = 200, onStatus } = options;

  const submit = await axios.post<FalSubmitResponse>(
    `${FAL_QUEUE_BASE}/${endpoint}`,
    input,
    { headers: authHeaders, signal },
  );

  const { status_url, response_url } = submit.data;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const status = await axios.get<FalStatusResponse>(status_url, {
      headers: authHeaders,
      signal,
    });

    onStatus?.(status.data);

    if (status.data.status === "COMPLETED") {
      if (status.data.error) {
        throw new Error(status.data.error);
      }
      const result = await axios.get<TResult>(response_url, {
        headers: authHeaders,
        signal,
      });
      return result.data;
    }

    await sleep(pollIntervalMs);
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
};
