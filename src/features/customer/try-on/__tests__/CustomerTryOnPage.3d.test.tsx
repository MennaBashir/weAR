import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerTryOnPage } from "@/features/customer/try-on/pages/CustomerTryOnPage";

const viewerLoad = vi.fn();
const mutate = vi.fn();
let session: Record<string, unknown>;

vi.mock("@/features/customer/try-on/components/TryOn3DViewer", () => ({
  default: function MockTryOn3DViewer({ onLoading, onReady, onError }: { onLoading?: () => void; onReady?: () => void; onError?: () => void }) {
    useEffect(() => {
      viewerLoad();
      onLoading?.();
      if ((globalThis as { failViewer?: boolean }).failViewer) onError?.();
      else onReady?.();
    }, [onError, onLoading, onReady]);
    return <div data-testid="mock-3d-viewer">Mock 3D viewer</div>;
  },
}));

vi.mock("@/features/customer/queries/profileAvatar.queries", () => ({
  useCustomerAvatar: () => ({ isLoading: false, isError: false, data: { id: "a1", avatar3dModelUrl: null, measurements: { heightCm: 170 } } }),
}));

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerProduct: () => ({ isLoading: false, isError: false, data: { id: "p1", name: "Linen Jacket", price: 120, currency: "USD", imageUrl: "https://cdn.example.test/product.png", colors: ["Taupe"], sizes: ["M"] } }),
}));

vi.mock("@/features/customer/try-on/hooks/tryOn.queries", () => ({
  useCreateTryOnSession: () => ({ isPending: false, mutate }),
}));

const renderCompletedPage = async (modelUrl: unknown) => {
  session = { id: "s1", productId: "p1", sessionType: "Overlay2D", resultImageUrl: "https://cdn.example.test/result.png", result3dModelUrl: modelUrl };
  mutate.mockImplementation((_payload, opts) => opts.onSuccess(session));
  render(<MemoryRouter initialEntries={["/customer/try-on/p1"]}><Routes><Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
  await screen.findByRole("button", { name: "M" });
  fireEvent.click(screen.getByRole("button", { name: "M" }));
  fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
  fireEvent.click(screen.getByRole("button", { name: /try product/i }));
  await screen.findByText(/2D result complete/i);
};

beforeEach(() => {
  mutate.mockReset();
  viewerLoad.mockClear();
  (globalThis as { failViewer?: boolean }).failViewer = false;
});

describe("CustomerTryOnPage progressive 3D result", () => {
  it("keeps 2D as default and hides 3D for null or empty model URLs", async () => {
    await renderCompletedPage(null);
    expect(screen.getByRole("tabpanel", { name: /2D try-on result/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /3D View/i })).not.toBeInTheDocument();
    expect(viewerLoad).not.toHaveBeenCalled();
  });

  it("hides 3D for empty and unsafe URLs", async () => {
    await renderCompletedPage("javascript:alert(1)");
    expect(screen.queryByRole("tab", { name: /3D View/i })).not.toBeInTheDocument();
  });

  it("enables valid HTTPS 3D URL and lazy-loads viewer only after selecting 3D", async () => {
    await renderCompletedPage("https://cdn.example.test/result.glb");
    expect(screen.getByRole("tab", { name: /2D View/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /3D View/i })).toBeInTheDocument();
    expect(viewerLoad).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: /3D View/i }));
    expect(await screen.findByTestId("mock-3d-viewer")).toBeInTheDocument();
    await waitFor(() => expect(viewerLoad).toHaveBeenCalledTimes(1));
  });

  it("allows valid HTTP URL according to policy", async () => {
    await renderCompletedPage("http://cdn.example.test/result.glb");
    expect(screen.getByRole("tab", { name: /3D View/i })).toBeInTheDocument();
  });

  it("viewer failure preserves 2D result and retry does not create a new session", async () => {
    (globalThis as { failViewer?: boolean }).failViewer = true;
    await renderCompletedPage("https://cdn.example.test/result.glb");
    fireEvent.click(screen.getByRole("tab", { name: /3D View/i }));
    expect(await screen.findByText(/3D view is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Linen Jacket · Size M · Taupe/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Retry 3D/i }));
    expect(mutate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("tab", { name: /2D View/i }));
    expect(screen.getByText(/Linen Jacket · Size M · Taupe/i)).toBeInTheDocument();
  });
});
