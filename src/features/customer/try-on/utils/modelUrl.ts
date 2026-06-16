import type { CustomerAvatar } from "@/features/customer/types/profileAvatar";

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

// Blob/object URLs created by the app itself (e.g. downloaded GLBs) are trusted
// local references. They must bypass the remote-URL allowlist above, which only
// permits http(s) for untrusted backend-provided URLs.
export const toTrustedLocalModelUrl = (
  value: string | null | undefined,
): SafeModelUrl | null => {
  if (!value || !value.trim()) return null;
  if (value.startsWith("blob:") || value.startsWith("data:")) {
    return value as SafeModelUrl;
  }
  return toSafeModelUrl(value);
};

export const getSafeActiveAvatarModelUrl = (avatar: Pick<CustomerAvatar, "avatar3dModelUrl"> | null | undefined): SafeModelUrl | null =>
  toSafeModelUrl(avatar?.avatar3dModelUrl);
