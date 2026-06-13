import { describe, expect, it } from "vitest";
import { parseShopQuery, serializeShopQuery, toCatalogParams } from "@/features/customer/pages/shopQueryParams";

describe("shop query params", () => {
  it("parses and serializes meaningful catalog state", () => {
    const state = parseShopQuery("?search=linen&category=c1&colors=Black&colors=Blue&sizes=M&sort=price:desc&page=3");
    expect(state).toMatchObject({ search: "linen", categoryId: "c1", colors: ["Black", "Blue"], sizes: ["M"], sort: "price:desc", page: 3 });
    expect(serializeShopQuery(state)).toContain("search=linen");
    expect(toCatalogParams(state)).toMatchObject({ search: "linen", categoryId: "c1", colors: ["Black", "Blue"], sortBy: "price", sortDirection: "desc", pageNumber: 3 });
  });

  it("defaults invalid pages and omits default sort/page", () => {
    const state = parseShopQuery("?page=-2&sort=featured");
    expect(state.page).toBe(1);
    expect(serializeShopQuery(state)).toBe("");
  });
});
