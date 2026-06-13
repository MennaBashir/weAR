import { describe, expect, it } from "vitest";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { RequireAuth } from "@/app/guards/RequireAuth";
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

const protectedCustomerPaths = [
  "/customer/home",
  "/customer/shop",
  "/customer/products/product-1",
  "/customer/favorites",
  "/customer/account",
  "/customer/account/addresses",
  "/customer/avatar",
  "/customer/avatar/manual",
  "/customer/avatar/photo",
  "/customer/try-on",
  "/customer/try-on/history",
  "/customer/try-on/product-1",
  "/customer/cart",
  "/customer/checkout",
] as const;

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

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>);
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
    expect(screen.getByRole("heading", { name: /Discover fashion/i })).toBeInTheDocument();
  });

  it.each(protectedCustomerPaths)("protects %s behind customer authentication and role guards", async (path) => {
    useAuthStore.setState({
      user: null,
      role: null,
      isAuthenticated: false,
      hasHydrated: true,
    });

    const router = createMemoryRouter(
      [
        {
          element: (
            <RequireAuth>
              <RequireRole role="customer">
                <div>Protected customer route</div>
              </RequireRole>
            </RequireAuth>
          ),
          children: [{ path: "/customer/*", element: <div>Protected customer route</div> }],
        },
        { path: "/login", element: <div>Login</div> },
      ],
      { initialEntries: [path] },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(router.state.location.state).toMatchObject({
      from: expect.objectContaining({ pathname: path }),
    });

    useAuthStore.setState({
      user: {
        id: "retailer-1",
        fullName: "Retailer User",
        email: "retailer@example.com",
        brandName: "Retailer",
        businessType: "fashion",
      },
      role: "retailer",
      isAuthenticated: true,
      hasHydrated: true,
    });

    const roleRouter = createMemoryRouter(
      [
        {
          element: (
            <RequireAuth>
              <RequireRole role="customer">
                <div>Protected customer route</div>
              </RequireRole>
            </RequireAuth>
          ),
          children: [{ path: "/customer/*", element: <div>Protected customer route</div> }],
        },
        { path: "/retailer", element: <div>Retailer Home</div> },
      ],
      { initialEntries: [path] },
    );

    render(<RouterProvider router={roleRouter} />);

    await waitFor(() => expect(roleRouter.state.location.pathname).toBe("/retailer"));
    expect(screen.getByText("Retailer Home")).toBeInTheDocument();
  });
});
