import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import { CustomerLayout } from "@/features/customer/layouts/CustomerLayout";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";

vi.mock("@/features/customer/api/customerAuth.api", () => ({
  customerAuthApi: { logout: vi.fn().mockResolvedValue({ success: true }) },
}));

const renderLayout = (initialEntry = CUSTOMER_ROUTES.home) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/customer" element={<CustomerLayout />}>
          <Route path="home" element={<h1>Nested customer home</h1>} />
          <Route path="shop" element={<h1>Nested shop placeholder</h1>} />
          <Route path="account" element={<h1>Nested account placeholder</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("CustomerLayout", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "customer-1",
        fullName: "Customer User",
        email: "customer@example.com",
        brandName: "",
        businessType: "customer",
      },
      role: "customer",
      isAuthenticated: true,
      accessToken: "access-token",
      refreshToken: "refresh-token",
      hasHydrated: true,
    });
  });

  it("renders the storefront landmarks and nested route outlet", () => {
    renderLayout();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Nested customer home");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText(/Free shipping/i)).toBeInTheDocument();
  });

  it("renders desktop customer navigation links", () => {
    renderLayout();

    const desktopNav = screen.getByRole("navigation", {
      name: "Customer navigation",
    });

    expect(within(desktopNav).getByRole("link", { name: /Home/i })).toHaveAttribute(
      "href",
      CUSTOMER_ROUTES.home,
    );
    expect(within(desktopNav).getByRole("link", { name: /Shop/i })).toHaveAttribute(
      "href",
      CUSTOMER_ROUTES.shop,
    );
    expect(within(desktopNav).getByRole("link", { name: /Try On/i })).toHaveAttribute(
      "href",
      CUSTOMER_ROUTES.tryOn,
    );
    expect(within(desktopNav).getByRole("link", { name: /Favorites/i })).toHaveAttribute(
      "href",
      CUSTOMER_ROUTES.favorites,
    );
    expect(within(desktopNav).getByRole("link", { name: /Account/i })).toHaveAttribute(
      "href",
      CUSTOMER_ROUTES.account,
    );
  });

  it("opens, closes, and route-select closes the mobile menu", () => {
    renderLayout();

    const menuButton = screen.getByRole("button", { name: "Open customer menu" });
    fireEvent.click(menuButton);

    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile customer navigation",
    });
    expect(mobileNav).toBeInTheDocument();

    fireEvent.click(within(mobileNav).getByRole("link", { name: /Shop/i }));
    expect(screen.queryByRole("navigation", { name: "Mobile customer navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Nested shop placeholder");

    fireEvent.click(screen.getByRole("button", { name: "Open customer menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile customer navigation" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Mobile customer navigation" })).not.toBeInTheDocument();
  });

  it("logs out from the mobile account action", async () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Open customer menu" }));
    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile customer navigation",
    });
    fireEvent.click(within(mobileNav).getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(customerAuthApi.logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().role).toBeNull();
  });
});
