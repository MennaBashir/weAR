import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { samFalAiApi } from "@/features/customer/try-on/api/samFalAi.api";

vi.mock("axios");

const mockedAxios = vi.mocked(axios, true);

const submitResponse = {
  data: {
    request_id: "req-1",
    status_url: "https://queue.fal.run/status",
    response_url: "https://queue.fal.run/response",
  },
};

beforeEach(() => {
  mockedAxios.post.mockReset();
  mockedAxios.get.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("samFalAiApi.runSam (via bodyFrom3D)", () => {
  it("returns the result once the job completes", async () => {
    mockedAxios.post.mockResolvedValueOnce(submitResponse);
    mockedAxios.get
      .mockResolvedValueOnce({ data: { status: "IN_PROGRESS", request_id: "req-1" } })
      .mockResolvedValueOnce({ data: { status: "COMPLETED", request_id: "req-1" } })
      .mockResolvedValueOnce({ data: { model_glb: { url: "https://fal/body.glb" } } });

    const result = await samFalAiApi.bodyFrom3D("data:image/png;base64,AAAA", {
      pollIntervalMs: 0,
    });

    expect(result).toEqual({ model_glb: { url: "https://fal/body.glb" } });
  });

  it("throws immediately when the job reports FAILED instead of timing out", async () => {
    mockedAxios.post.mockResolvedValueOnce(submitResponse);
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "FAILED", request_id: "req-1", error: "bad photo" },
    });

    await expect(
      samFalAiApi.bodyFrom3D("data:image/png;base64,AAAA", { pollIntervalMs: 0 }),
    ).rejects.toThrow("bad photo");

    // It should NOT have fetched the response_url for a failed job.
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("throws on ERROR status with a fallback message when no error text is given", async () => {
    mockedAxios.post.mockResolvedValueOnce(submitResponse);
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: "ERROR", request_id: "req-1" },
    });

    await expect(
      samFalAiApi.bodyFrom3D("data:image/png;base64,AAAA", { pollIntervalMs: 0 }),
    ).rejects.toThrow(/processing failed/i);
  });

  it("times out after the max attempts when never completing", async () => {
    mockedAxios.post.mockResolvedValueOnce(submitResponse);
    mockedAxios.get.mockResolvedValue({
      data: { status: "IN_PROGRESS", request_id: "req-1" },
    });

    await expect(
      samFalAiApi.bodyFrom3D("data:image/png;base64,AAAA", {
        pollIntervalMs: 0,
        maxAttempts: 3,
      }),
    ).rejects.toThrow(/timed out/i);
  });
});
