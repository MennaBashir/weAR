import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSamTryOn } from "@/features/customer/try-on/hooks/samTryOn";

vi.mock("@/features/customer/try-on/api/samFalAi.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/customer/try-on/api/samFalAi.api")
  >("@/features/customer/try-on/api/samFalAi.api");
  return {
    ...actual,
    fileToDataUri: vi.fn(async () => "data:image/png;base64,AAAA"),
    toPersistentModelUrl: vi.fn(async (url: string | null) => url),
    toPersistentImageUrl: vi.fn(async (url: string | null) => url),
    samFalAiApi: {
      bodyFrom3D: vi.fn(),
      tryOn: vi.fn(),
    },
  };
});

vi.mock("@/features/customer/try-on/utils/skinTone", () => ({
  extractSkinToneFromImage: vi.fn(async () => ({ r: 0.8, g: 0.6, b: 0.5 })),
  DEFAULT_SKIN_TONE: { r: 0.86, g: 0.68, b: 0.56 },
}));

import { samFalAiApi } from "@/features/customer/try-on/api/samFalAi.api";

const body = vi.mocked(samFalAiApi.bodyFrom3D);
const tryOn = vi.mocked(samFalAiApi.tryOn);

const personFile = new File(["p"], "person.png", { type: "image/png" });
const shirtFile = new File(["s"], "shirt.png", { type: "image/png" });
const jacketFile = new File(["j"], "jacket.png", { type: "image/png" });

const bodyResult = {
  model_glb: { url: "https://fal/body.glb" },
  visualization: { url: "https://fal/body-viz.png" },
  meshes: [{ url: "https://fal/body-mesh.ply" }],
};

beforeEach(() => {
  body.mockReset();
  tryOn.mockReset();
});

describe("useSamTryOn separated flow", () => {
  it("generates the body with skin tone before dressing is allowed", async () => {
    body.mockResolvedValue(bodyResult);

    const { result } = renderHook(() => useSamTryOn());

    expect(result.current.hasBody).toBe(false);

    await act(async () => {
      await result.current.generateBody(personFile);
    });

    await waitFor(() => expect(result.current.bodyStage).toBe("ready"));
    expect(result.current.hasBody).toBe(true);
    expect(result.current.result.bodyMeshUrl).toBe("https://fal/body-mesh.ply");
    expect(result.current.result.skinTone).toEqual({ r: 0.8, g: 0.6, b: 0.5 });
    expect(result.current.result.isDressed).toBe(false);
    expect(tryOn).not.toHaveBeenCalled();
  });

  it("dresses the person via try-on and re-dresses without rebuilding the body", async () => {
    body.mockResolvedValue(bodyResult);
    tryOn
      .mockResolvedValueOnce({ images: [{ url: "https://fal/tryon-shirt.png" }] })
      .mockResolvedValueOnce({ images: [{ url: "https://fal/tryon-jacket.png" }] });

    const { result } = renderHook(() => useSamTryOn());

    await act(async () => {
      await result.current.generateBody(personFile);
    });
    await waitFor(() => expect(result.current.hasBody).toBe(true));

    await act(async () => {
      await result.current.dress(shirtFile, "tops");
    });
    await waitFor(() => expect(result.current.dressStage).toBe("completed"));

    expect(result.current.result.dressedImageUrl).toBe("https://fal/tryon-shirt.png");
    expect(result.current.result.isDressed).toBe(true);

    // Re-dress with a different garment.
    await act(async () => {
      await result.current.dress(jacketFile, "tops");
    });
    await waitFor(() =>
      expect(result.current.result.dressedImageUrl).toBe("https://fal/tryon-jacket.png"),
    );

    // Body was built only once; try-on reused the same person photo.
    expect(body).toHaveBeenCalledTimes(1);
    expect(tryOn).toHaveBeenCalledTimes(2);
    expect(tryOn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        modelImage: "data:image/png;base64,AAAA",
        garmentImage: "data:image/png;base64,AAAA",
        category: "tops",
      }),
      expect.anything(),
    );
  });

  it("blocks dressing before a body exists", async () => {
    const { result } = renderHook(() => useSamTryOn());

    await act(async () => {
      await result.current.dress(shirtFile, "tops");
    });

    expect(result.current.dressStage).toBe("error");
    expect(tryOn).not.toHaveBeenCalled();
    expect(result.current.dressError).toMatch(/body first/i);
  });

  it("errors when the try-on returns no dressed image", async () => {
    body.mockResolvedValue(bodyResult);
    tryOn.mockResolvedValue({ images: [] });

    const { result } = renderHook(() => useSamTryOn());

    await act(async () => {
      await result.current.generateBody(personFile);
    });
    await waitFor(() => expect(result.current.hasBody).toBe(true));

    await act(async () => {
      await result.current.dress(shirtFile, "tops");
    });

    await waitFor(() => expect(result.current.dressStage).toBe("error"));
    expect(result.current.result.isDressed).toBe(false);
    expect(result.current.dressError).toMatch(/dressed image/i);
  });
});

describe("useSamTryOn demo mode", () => {
  beforeEach(() => {
    body.mockReset();
    tryOn.mockReset();
    localStorage.setItem("wear:tryon-demo", "1");
  });

  afterEach(() => {
    localStorage.removeItem("wear:tryon-demo");
  });

  it("builds body and dresses from bundled assets without calling FAL", async () => {
    const { result } = renderHook(() => useSamTryOn());
    expect(result.current.isDemo).toBe(true);

    await act(async () => {
      await result.current.generateBody(personFile);
    });
    await waitFor(() => expect(result.current.hasBody).toBe(true));

    expect(result.current.result.bodyModelUrl).toBe("/demo/body.glb");
    expect(body).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.dress(shirtFile, "tops");
    });
    await waitFor(() => expect(result.current.dressStage).toBe("completed"));

    expect(result.current.result.dressedImageUrl).toBe("/demo/dressed.png");
    expect(result.current.result.isDressed).toBe(true);
    expect(tryOn).not.toHaveBeenCalled();
  });
});
