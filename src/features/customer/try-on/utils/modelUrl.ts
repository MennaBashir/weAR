import type { TryOnSession } from "@/features/customer/try-on/types/tryOn";

export type SafeModelUrl = string & { readonly __safeModelUrl: unique symbol };

export const toSafeModelUrl = (value: string | null | undefined): SafeModelUrl | null => {
  if (!value || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString() as SafeModelUrl;
  } catch {
    return null;
  }
};

const pickTryOnModelUrl = (session: TryOnSession): string | null | undefined => {
  if (session.result3dModelUrl) return session.result3dModelUrl;
  if (session.model3dUrl) return session.model3dUrl;
  if (session.resultImageUrl?.toLowerCase().split("?")[0]?.endsWith(".glb")) return session.resultImageUrl;
  if (session.resultImageUrl?.toLowerCase().split("?")[0]?.endsWith(".gltf")) return session.resultImageUrl;
  return null;
};

export const getSafeTryOnResultModelUrl = (session: TryOnSession | null | undefined): SafeModelUrl | null => {
  if (!session) return null;
  return toSafeModelUrl(pickTryOnModelUrl(session));
};
