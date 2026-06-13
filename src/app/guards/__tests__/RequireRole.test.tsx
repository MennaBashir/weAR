import { describe, it, expect } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { RequireRole } from "@/app/guards/RequireRole";
import { useAuthStore } from "@/features/auth/useAuthStore";
import "@testing-library/jest-dom";

describe("RequireRole", () => {
  it("redirects when role mismatched", () => {
    // set authenticated but different role
    useAuthStore.setState({
      user: {
        id: "1",
        fullName: "Customer User",
        email: "c@test.com",
        brandName: "",
        businessType: "",
        has3DModels: false,
        accountStatus: "active",
        isEmailVerified: true,
      },
      role: "customer",
      isAuthenticated: true,
      hasHydrated: true,
    });

    const router = createMemoryRouter(
      [
        {
          path: "/retailer",
          element: (
            <RequireRole role="retailer">
              <div>Retailer Secret</div>
            </RequireRole>
          ),
        },
        { path: "/customer/home", element: <div>Customer Home</div> },
      ],
      { initialEntries: ["/retailer"] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.queryByText("Retailer Secret")).toBeNull();
    expect(screen.getByText("Customer Home")).toBeInTheDocument();
  });
});
