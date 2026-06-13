import { describe, expect, it } from "vitest";
import { initialTryOnFlowState, tryOnFlowReducer } from "@/features/customer/try-on/types/tryOn";

describe("tryOnFlowReducer", () => {
  it("handles missing-avatar prerequisite and preserves a safe product return route input", () => {
    const checking = tryOnFlowReducer(initialTryOnFlowState("product-1"), { type: "ENTER_ROOM" });
    expect(checking.status).toBe("checking-avatar");
    const missing = tryOnFlowReducer(checking, { type: "AVATAR_MISSING" });
    expect(missing.status).toBe("error-avatar-required");
    expect(missing.productId).toBe("product-1");
  });

  it("uses the product id from the route and validates required variants before submit", () => {
    const ready = tryOnFlowReducer(initialTryOnFlowState("route-product"), { type: "AVATAR_READY", productId: "route-product" });
    const sized = tryOnFlowReducer(ready, { type: "SELECT_SIZE", size: "M" });
    const colored = tryOnFlowReducer(sized, { type: "SELECT_COLOR", color: "Ivory" });
    expect(colored.productId).toBe("route-product");
    expect(colored.selectedSize).toBe("M");
    expect(colored.selectedColor).toBe("Ivory");
  });

  it("prevents unrelated duplicate-submit state changes while already processing", () => {
    const ready = tryOnFlowReducer(initialTryOnFlowState("product-1"), { type: "AVATAR_READY", productId: "product-1" });
    const submitting = tryOnFlowReducer(ready, { type: "SUBMIT" });
    const processing = tryOnFlowReducer(submitting, { type: "PROCESSING" });
    const duplicate = tryOnFlowReducer(processing, { type: "SUBMIT" });
    expect(duplicate).toEqual(processing);
  });

  it("moves ready to submitting to processing to completed-2d with a null 3D model URL", () => {
    const ready = tryOnFlowReducer(initialTryOnFlowState("product-1"), { type: "AVATAR_READY", productId: "product-1" });
    const submitting = tryOnFlowReducer(ready, { type: "SUBMIT" });
    const processing = tryOnFlowReducer(submitting, { type: "PROCESSING" });
    const completed = tryOnFlowReducer(processing, { type: "COMPLETE_2D", session: { id: "s1", productId: "product-1", sessionType: "Overlay2D", resultImageUrl: "/result.png", avatar3dModelUrl: null } });
    expect(completed.status).toBe("completed-2d");
    expect(completed.session?.avatar3dModelUrl).toBeNull();
  });

  it("moves processing to retryable error and retry preserves product and selections", () => {
    const selected = { selectedSize: "L", selectedColor: "Taupe" };
    const ready = tryOnFlowReducer(initialTryOnFlowState("product-9", selected), { type: "AVATAR_READY", productId: "product-9" });
    const processing = tryOnFlowReducer(tryOnFlowReducer(ready, { type: "SUBMIT" }), { type: "PROCESSING" });
    const error = tryOnFlowReducer(processing, { type: "RETRYABLE_ERROR", message: "Network timeout" });
    const retrying = tryOnFlowReducer(error, { type: "SUBMIT" });
    expect(error.status).toBe("error-retryable");
    expect(retrying.productId).toBe("product-9");
    expect(retrying.selectedSize).toBe("L");
    expect(retrying.selectedColor).toBe("Taupe");
  });
});
