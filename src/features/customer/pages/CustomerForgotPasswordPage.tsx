import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import loginImg from "@/assets/customer/login.webp";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { normalizeCustomerApiError } from "@/features/customer/utils/customerErrors";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function CustomerForgotPasswordPage() {
  const navigate = useNavigate();
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const form = useForm<ForgotFormValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  const onSubmit = async (values: ForgotFormValues) => {
    setApiError(null);
    try {
      await customerAuthApi.forgotPassword(values.email);
      setSubmittedEmail(values.email);
    } catch (error) {
      setApiError(normalizeCustomerApiError(error).message);
    }
  };

  return (
    <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer forgot password">
      <div className="mb-7 text-center">
        <h1 className="mb-1 text-[32px] font-bold text-[#A37E6B] md:text-[36px]" style={{ fontFamily: '"PT Serif", serif' }}>Forgot Password</h1>
        <p className="text-[16px] leading-[1.35] text-[#C9A390]">Enter your customer email and we&apos;ll send a one-time password.</p>
      </div>

      {submittedEmail ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700">
            If this customer account exists, an OTP was sent to <strong>{submittedEmail}</strong>.
          </div>
          <button type="button" onClick={() => navigate(CUSTOMER_ROUTES.resetPassword, { state: { email: submittedEmail } })} className="h-[58px] rounded-[14px] bg-[#C9A390] text-[18px] font-medium text-white shadow-md shadow-[#C9A390]/20 transition-opacity hover:opacity-95">Enter OTP</button>
          <Link to={CUSTOMER_ROUTES.login} className="text-[14px] font-medium text-[#A37E6B] hover:underline">Back to customer login</Link>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {apiError && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-center text-[14px] text-red-600">{apiError}</div>}
          <div>
            <label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">Email</label>
            <input type="email" placeholder="Enter your Email" {...form.register("email")} className="h-[58px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[16px] text-[#5C5550] outline-none placeholder:text-[#B6A092] focus:border-[#A37E6B]" />
            {form.formState.errors.email && <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.email.message}</p>}
          </div>
          <button type="submit" disabled={form.formState.isSubmitting} className="h-[58px] rounded-[14px] bg-[#C9A390] text-[18px] font-medium text-white shadow-md shadow-[#C9A390]/20 transition-opacity hover:opacity-95 disabled:opacity-70">{form.formState.isSubmitting ? "Sending..." : "Send OTP"}</button>
          <Link to={CUSTOMER_ROUTES.login} className="text-center text-[14px] font-medium text-[#A37E6B] hover:underline">Back to customer login</Link>
        </form>
      )}
    </CustomerAuthLayout>
  );
}
