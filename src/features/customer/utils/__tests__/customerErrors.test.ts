import axios from "axios";
import { describe, expect, it } from "vitest";
import { normalizeCustomerApiError } from "@/features/customer/utils/customerErrors";

describe("normalizeCustomerApiError", () => {
  it("normalizes axios response messages and errors", () => {
    const error = new axios.AxiosError("Request failed", undefined, undefined, undefined, {
      data: { message: "Email already exists", errors: ["Use another email"] },
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    });

    expect(normalizeCustomerApiError(error)).toEqual({
      message: "Email already exists",
      errors: ["Use another email"],
      status: 409,
    });
  });

  it("falls back for unknown errors", () => {
    expect(normalizeCustomerApiError(null, "Try again")).toEqual({
      message: "Try again",
      errors: [],
    });
  });
});
