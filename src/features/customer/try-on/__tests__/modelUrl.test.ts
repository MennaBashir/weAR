import { describe, expect, it } from "vitest";
import {
  getSafeActiveAvatarModelUrl,
  toSafeModelUrl,
  toTrustedLocalModelUrl,
} from "@/features/customer/try-on/utils/modelUrl";

describe("try-on model URL safety", () => {
  it("rejects null, empty, malformed, javascript, data and blob URLs", () => {
    expect(toSafeModelUrl(null)).toBeNull();
    expect(toSafeModelUrl(undefined)).toBeNull();
    expect(toSafeModelUrl(" ")).toBeNull();
    expect(toSafeModelUrl("not a url")).toBeNull();
    expect(toSafeModelUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeModelUrl("data:model/gltf+json,{}")).toBeNull();
    expect(toSafeModelUrl("blob:https://example.test/1")).toBeNull();
  });

  it("allows valid HTTPS and HTTP URLs", () => {
    expect(toSafeModelUrl("https://cdn.example.test/result.glb")).toBe("https://cdn.example.test/result.glb");
    expect(toSafeModelUrl("http://cdn.example.test/result.glb")).toBe("http://cdn.example.test/result.glb");
  });

  it("trusts app-created blob and data URLs but still validates remote URLs", () => {
    expect(toTrustedLocalModelUrl("blob:https://app.test/abc")).toBe(
      "blob:https://app.test/abc",
    );
    expect(toTrustedLocalModelUrl("data:model/gltf-binary;base64,AAAA")).toBe(
      "data:model/gltf-binary;base64,AAAA",
    );
    expect(toTrustedLocalModelUrl("https://cdn.example.test/r.glb")).toBe(
      "https://cdn.example.test/r.glb",
    );
    expect(toTrustedLocalModelUrl("javascript:alert(1)")).toBeNull();
    expect(toTrustedLocalModelUrl(null)).toBeNull();
  });

  it("uses the active Avatar GLB as the neutral 3D source", () => {
    expect(getSafeActiveAvatarModelUrl({ avatar3dModelUrl: "https://cdn.example.test/avatar.glb" })).toBe("https://cdn.example.test/avatar.glb");
    expect(getSafeActiveAvatarModelUrl({ avatar3dModelUrl: "javascript:alert(1)" })).toBeNull();
    expect(getSafeActiveAvatarModelUrl(null)).toBeNull();
  });
});
