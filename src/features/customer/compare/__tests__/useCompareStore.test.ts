import { beforeEach, describe, expect, it } from "vitest";
import { useCompareStore, COMPARE_MAX, COMPARE_MIN } from "@/features/customer/compare/useCompareStore";

beforeEach(() => {
  useCompareStore.setState({ productIds: [] });
});

describe("useCompareStore — selection", () => {
  it("adds a product", () => {
    useCompareStore.getState().add("p1");
    expect(useCompareStore.getState().productIds).toContain("p1");
  });

  it("does not add the same product twice", () => {
    useCompareStore.getState().add("p1");
    useCompareStore.getState().add("p1");
    expect(useCompareStore.getState().productIds).toHaveLength(1);
  });

  it("does not exceed the max limit", () => {
    for (let i = 0; i <= COMPARE_MAX + 1; i++) {
      useCompareStore.getState().add(`p${i}`);
    }
    expect(useCompareStore.getState().productIds).toHaveLength(COMPARE_MAX);
  });

  it("removes a product", () => {
    useCompareStore.getState().add("p1");
    useCompareStore.getState().remove("p1");
    expect(useCompareStore.getState().productIds).not.toContain("p1");
  });

  it("clears all products", () => {
    useCompareStore.getState().add("p1");
    useCompareStore.getState().add("p2");
    useCompareStore.getState().clear();
    expect(useCompareStore.getState().productIds).toHaveLength(0);
  });
});

describe("useCompareStore — selectors", () => {
  it("isSelected returns true for selected product", () => {
    useCompareStore.getState().add("p1");
    expect(useCompareStore.getState().isSelected("p1")).toBe(true);
  });

  it("isSelected returns false for non-selected product", () => {
    expect(useCompareStore.getState().isSelected("p99")).toBe(false);
  });

  it("isFull returns false below max", () => {
    useCompareStore.getState().add("p1");
    expect(useCompareStore.getState().isFull()).toBe(false);
  });

  it("isFull returns true at max", () => {
    for (let i = 0; i < COMPARE_MAX; i++) {
      useCompareStore.getState().add(`p${i}`);
    }
    expect(useCompareStore.getState().isFull()).toBe(true);
  });
});

describe("constants", () => {
  it("COMPARE_MIN is 2", () => {
    expect(COMPARE_MIN).toBe(2);
  });

  it("COMPARE_MAX is 4", () => {
    expect(COMPARE_MAX).toBe(4);
  });
});
