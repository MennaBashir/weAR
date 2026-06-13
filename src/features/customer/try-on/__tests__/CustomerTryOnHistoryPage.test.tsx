import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CustomerTryOnHistoryPage } from "@/features/customer/try-on/pages/CustomerTryOnHistoryPage";
import { useCustomerTryOnSessions } from "@/features/customer/try-on/hooks/tryOn.queries";

vi.mock("@/features/customer/try-on/hooks/tryOn.queries", () => ({
  useCustomerTryOnSessions: vi.fn(),
}));

const mockedUseSessions = vi.mocked(useCustomerTryOnSessions);

const renderPage = () => render(<MemoryRouter><CustomerTryOnHistoryPage /></MemoryRouter>);

describe("CustomerTryOnHistoryPage", () => {
  it("shows a loading state while authenticated customer sessions load", () => {
    mockedUseSessions.mockReturnValue({ isLoading: true, isError: false, data: undefined } as ReturnType<typeof useCustomerTryOnSessions>);
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent(/loading try-on history/i);
  });

  it("shows an empty state when the customer has no try-on sessions", () => {
    mockedUseSessions.mockReturnValue({ isLoading: false, isError: false, data: [] } as ReturnType<typeof useCustomerTryOnSessions>);
    renderPage();
    expect(screen.getByText(/no try-ons yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse products/i })).toHaveAttribute("href", "/customer/shop");
  });

  it("renders processing, completed, and failed sessions with reopen links", () => {
    mockedUseSessions.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        { id: "s1", productId: "dress-1", sessionType: "Overlay2D", status: "processing", createdAt: "2026-01-02T10:00:00Z" },
        { id: "s2", productId: "jacket-1", sessionType: "Overlay2D", status: "completed", resultImageUrl: "/result.png", createdAt: "2026-01-03T10:00:00Z" },
        { id: "s3", productId: "shirt-1", sessionType: "Overlay2D", status: "failed", createdAt: "2026-01-01T10:00:00Z" },
      ],
    } as ReturnType<typeof useCustomerTryOnSessions>);

    renderPage();

    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /reopen try-on/i })).toHaveLength(3);
    expect(screen.getByRole("link", { name: /start a try-on/i })).toHaveAttribute("href", "/customer/try-on");
  });
});
