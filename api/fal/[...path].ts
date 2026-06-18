// Vercel Serverless Function (Node runtime). Node is used instead of Edge so the
// request body limit is large enough for base64 image data URIs sent to FAL
// (Edge caps bodies at ~4MB; two photos as base64 easily exceed that).
export const config = {
  api: { bodyParser: false },
};

const FAL_UPSTREAM = "https://queue.fal.run";

// Fallback FAL key so the deployed proxy works even before FAL_API_KEY is set in
// the host's environment variables. Prefer setting FAL_API_KEY to override it.
const FAL_FALLBACK_KEY =
  "86b47234-1e41-423c-a055-f96f2c06d165:b38970272c89034868fdafea921121ca";

// Server-side proxy for FAL. The browser must never call queue.fal.run directly:
// the API key would be exposed, and FAL can reject browser-origin requests. This
// function injects the Authorization header from a server-only env var and
// forwards the request body/path to FAL.
export default async function handler(
  request: { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; on: (event: string, cb: (chunk?: unknown) => void) => void },
  response: {
    statusCode: number;
    setHeader: (key: string, value: string) => void;
    end: (body?: unknown) => void;
  },
): Promise<void> {
  const apiKey =
    process.env.FAL_API_KEY ?? process.env.VITE_FAL_API_KEY ?? FAL_FALLBACK_KEY;

  // Strip the /api/fal prefix; forward the rest (path + query) to FAL.
  const rawUrl = request.url ?? "";
  const upstreamPath = rawUrl.replace(/^\/api\/fal/, "");
  const upstreamUrl = `${FAL_UPSTREAM}${upstreamPath}`;

  const method = request.method ?? "GET";

  const headers: Record<string, string> = {
    Authorization: `Key ${apiKey}`,
  };
  const contentType = request.headers["content-type"];
  if (typeof contentType === "string") headers["content-type"] = contentType;

  let body: Buffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await readBody(request);
  }

  const upstream = await fetch(upstreamUrl, { method, headers, body });
  const buffer = Buffer.from(await upstream.arrayBuffer());

  response.statusCode = upstream.status;
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) response.setHeader("content-type", upstreamContentType);
  response.end(buffer);
}

function readBody(request: {
  on: (event: string, cb: (chunk?: unknown) => void) => void;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk as Buffer)));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", (error) => reject(error));
  });
}
