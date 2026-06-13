import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerForgotPasswordPage } from "@/features/customer/pages/CustomerForgotPasswordPage";
import { CustomerResetPasswordPage } from "@/features/customer/pages/CustomerResetPasswordPage";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";

vi.mock("@/features/customer/api/customerAuth.api", () => ({
  customerAuthApi: {
    forgotPassword: vi.fn().mockResolvedValue({ success: true }),
    resetPassword: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const forgotPassword = vi.mocked(customerAuthApi.forgotPassword);
const resetPassword = vi.mocked(customerAuthApi.resetPassword);

describe("customer password recovery pages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates email and requests a customer forgot-password OTP", async () => {
    render(<MemoryRouter><CustomerForgotPasswordPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
    expect(await screen.findByText("Please enter a valid email")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter your Email"), { target: { value: "customer@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));

    await waitFor(() => expect(forgotPassword).toHaveBeenCalledWith("customer@example.com"));
    expect(screen.getByRole("button", { name: "Enter OTP" })).toBeInTheDocument();
  });

  it("validates reset fields and redirects to customer login after reset", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: CUSTOMER_ROUTES.resetPassword, state: { email: "customer@example.com" } }]}>
        <Routes>
          <Route path={CUSTOMER_ROUTES.resetPassword} element={<CustomerResetPasswordPage />} />
          <Route path={CUSTOMER_ROUTES.login} element={<h1>Customer login destination</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
    expect(await screen.findByText("OTP must be 6 digits")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter 6-digit OTP"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("New Password"), { target: { value: "secret1" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith({ email: "customer@example.com", otpCode: "123456", newPassword: "secret1" }));
    fireEvent.click(await screen.findByRole("button", { name: "Go to customer login" }));
    expect(await screen.findByRole("heading", { name: "Customer login destination" })).toBeInTheDocument();
  });
});
