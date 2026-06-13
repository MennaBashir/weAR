import { describe, expect, it } from "vitest";
import { getSafeTryOnResultModelUrl, toSafeModelUrl } from "@/features/customer/try-on/utils/modelUrl";

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

  it("normalizes only documented try-on result model fields and not bare avatar models", () => {
    expect(getSafeTryOnResultModelUrl({ id: "s1", productId: "p1", sessionType: "Overlay2D", result3dModelUrl: "https://cdn.example.test/dressed.glb", avatar3dModelUrl: "https://cdn.example.test/avatar.glb" })).toBe("https://cdn.example.test/dressed.glb");
    expect(getSafeTryOnResultModelUrl({ id: "s2", productId: "p1", sessionType: "Overlay2D", resultImageUrl: "https://cdn.example.test/scene.glb" })).toBe("https://cdn.example.test/scene.glb");
    expect(getSafeTryOnResultModelUrl({ id: "s3", productId: "p1", sessionType: "Overlay2D", resultImageUrl: "https://cdn.example.test/result.png", avatar3dModelUrl: "https://cdn.example.test/avatar.glb" })).toBeNull();
  });
});
