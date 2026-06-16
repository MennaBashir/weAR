import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSamTryOn } from "@/features/customer/try-on/hooks/samTryOn";

vi.mock("@/features/customer/try-on/api/samFalAi.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/customer/try-on/api/samFalAi.api")
  >("@/features/customer/try-on/api/samFalAi.api");
  return {
    ...actual,
    fileToDataUri: vi.fn(async () => "data:image/png;base64,AAAA"),
    toPersistentModelUrl: vi.fn(async (url: string | null) => url),
    samFalAiApi: {
      bodyFrom3D: vi.fn(),
      objectFrom3D: vi.fn(),
      align: vi.fn(),
    },
  };
});

vi.mock("@/features/customer/try-on/utils/skinTone", () => ({
  extractSkinToneFromImage: vi.fn(async () => ({ r: 0.8, g: 0.6, b: 0.5 })),
  DEFAULT_SKIN_TONE: { r: 0.86, g: 0.68, b: 0.56 },
}));

import { samFalAiApi } from "@/features/customer/try-on/api/samFalAi.api";

const body = vi.mocked(samFalAiApi.bodyFrom3D);
const object = vi.mocked(samFalAiApi.objectFrom3D);
const align = vi.mocked(samFalAiApi.align);

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
  object.mockReset();
  align.mockReset();
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
    expect(object).not.toHaveBeenCalled();
  });

  it("dresses the existing body and re-dresses without rebuilding it", async () => {
    body.mockResolvedValue(bodyResult);
    object
      .mockResolvedValueOnce({
        gaussian_splat: { url: "https://fal/shirt.ply" },
        model_glb: { url: "https://fal/shirt.glb" },
      })
      .mockResolvedValueOnce({
        gaussian_splat: { url: "https://fal/jacket.ply" },
        model_glb: { url: "https://fal/jacket.glb" },
      });
    align
      .mockResolvedValueOnce({
        body_mesh_ply: { url: "https://fal/a1.ply" },
        model_glb: { url: "https://fal/a1.glb" },
        visualization: { url: "https://fal/a1-viz.png" },
        scene_glb: { url: "https://fal/scene-shirt.glb" },
      })
      .mockResolvedValueOnce({
        body_mesh_ply: { url: "https://fal/a2.ply" },
        model_glb: { url: "https://fal/a2.glb" },
        visualization: { url: "https://fal/a2-viz.png" },
        scene_glb: { url: "https://fal/scene-jacket.glb" },
      });

    const { result } = renderHook(() => useSamTryOn());

    await act(async () => {
      await result.current.generateBody(personFile);
    });
    await waitFor(() => expect(result.current.hasBody).toBe(true));

    await act(async () => {
      await result.current.dress(shirtFile, "shirt");
    });
    await waitFor(() => expect(result.current.dressStage).toBe("completed"));

    expect(result.current.result.dressedModelUrl).toBe("https://fal/scene-shirt.glb");
    expect(result.current.result.isDressed).toBe(true);

    // Re-dress with a different garment.
    await act(async () => {
      await result.current.dress(jacketFile, "jacket");
    });
    await waitFor(() =>
      expect(result.current.result.dressedModelUrl).toBe("https://fal/scene-jacket.glb"),
    );

    // Body was built only once; align reused the same body mesh.
    expect(body).toHaveBeenCalledTimes(1);
    expect(align).toHaveBeenCalledTimes(2);
    expect(align).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        bodyMeshUrl: "https://fal/body-mesh.ply",
        objectMeshUrl: "https://fal/jacket.glb",
      }),
      expect.anything(),
    );
  });

  it("blocks dressing before a body exists", async () => {
    const { result } = renderHook(() => useSamTryOn());

    await act(async () => {
      await result.current.dress(shirtFile, "shirt");
    });

    expect(result.current.dressStage).toBe("error");
    expect(object).not.toHaveBeenCalled();
    expect(result.current.dressError).toMatch(/body first/i);
  });

  it("errors when the garment mesh cannot be built", async () => {
    body.mockResolvedValue(bodyResult);
    object.mockResolvedValue({ gaussian_splat: { url: "https://fal/g.ply" } });

    const { result } = renderHook(() => useSamTryOn());

    await act(async () => {
      await result.current.generateBody(personFile);
    });
    await waitFor(() => expect(result.current.hasBody).toBe(true));

    await act(async () => {
      await result.current.dress(shirtFile, "shirt");
    });

    await waitFor(() => expect(result.current.dressStage).toBe("error"));
    expect(align).not.toHaveBeenCalled();
    expect(result.current.dressError).toMatch(/3D garment/i);
  });

  it("errors when align returns no combined scene (garment not merged)", async () => {
    body.mockResolvedValue(bodyResult);
    object.mockResolvedValue({
      gaussian_splat: { url: "https://fal/shirt.ply" },
      model_glb: { url: "https://fal/shirt.glb" },
    });
    align.mockResolvedValue({
      body_mesh_ply: { url: "https://fal/a.ply" },
      model_glb: { url: "https://fal/a-body.glb" },
      visualization: { url: "https://fal/a-viz.png" },
      // no scene_glb -> garment did not merge
    });

    const { result } = renderHook(() => useSamTryOn());

    await act(async () => {
      await result.current.generateBody(personFile);
    });
    await waitFor(() => expect(result.current.hasBody).toBe(true));

    await act(async () => {
      await result.current.dress(shirtFile, "shirt");
    });

    await waitFor(() => expect(result.current.dressStage).toBe("error"));
    expect(result.current.result.isDressed).toBe(false);
    expect(result.current.dressError).toMatch(/merge the garment/i);
  });
});
