import { describe, expect, it } from "vitest";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RequireRole } from "@/app/guards/RequireRole";
import { CustomerLayout } from "@/features/customer/layouts/CustomerLayout";
import { CustomerHomePage } from "@/features/customer/pages/CustomerHomePage";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { useAuthStore } from "@/features/auth/useAuthStore";

const authenticateCustomer = () => {
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
    hasHydrated: true,
  });
};

const renderCustomerRouter = (initialEntry: string) => {
  const router = createMemoryRouter(
    [
      {
        path: CUSTOMER_ROUTES.root,
        element: (
          <RequireRole role="customer">
            <CustomerLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to={CUSTOMER_ROUTES.home} replace /> },
          { path: "dashboard", element: <Navigate to={CUSTOMER_ROUTES.home} replace /> },
          { path: "home", element: <CustomerHomePage /> },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("customer routes", () => {
  it("defines customer home as the canonical customer route", () => {
    expect(CUSTOMER_ROUTES.root).toBe("/customer");
    expect(CUSTOMER_ROUTES.dashboard).toBe("/customer/dashboard");
    expect(CUSTOMER_ROUTES.home).toBe("/customer/home");
  });

  it("redirects legacy customer root and dashboard routes to customer home", async () => {
    authenticateCustomer();
    const rootRouter = renderCustomerRouter(CUSTOMER_ROUTES.root);

    await waitFor(() => expect(rootRouter.state.location.pathname).toBe(CUSTOMER_ROUTES.home));

    const dashboardRouter = renderCustomerRouter(CUSTOMER_ROUTES.dashboard);
    await waitFor(() =>
      expect(dashboardRouter.state.location.pathname).toBe(CUSTOMER_ROUTES.home),
    );
  });

  it("renders the customer layout and home page", async () => {
    authenticateCustomer();
    const router = renderCustomerRouter(CUSTOMER_ROUTES.home);

    await waitFor(() => expect(router.state.location.pathname).toBe(CUSTOMER_ROUTES.home));
    expect(screen.getAllByText("weAR Customer")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Welcome, Customer User")[0]).toBeInTheDocument();
  });
});
