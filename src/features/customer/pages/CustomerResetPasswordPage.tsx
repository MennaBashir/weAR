import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import loginImg from "@/assets/customer/login.webp";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { normalizeCustomerApiError } from "@/features/customer/utils/customerErrors";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otpCode: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numbers only"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type ResetFormValues = z.infer<typeof resetSchema>;

export function CustomerResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? "";
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const form = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema), defaultValues: { email: emailFromState, otpCode: "", newPassword: "", confirmPassword: "" } });

  const onSubmit = async (values: ResetFormValues) => {
    setApiError(null);
    try {
      await customerAuthApi.resetPassword({ email: values.email, otpCode: values.otpCode, newPassword: values.newPassword });
      setSuccess(true);
    } catch (error) {
      setApiError(normalizeCustomerApiError(error).message);
    }
  };

  if (success) {
    return (
      <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer reset password">
        <div className="flex flex-col gap-5 text-center">
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700">Your customer password was reset. Please log in again.</div>
          <button type="button" onClick={() => navigate(CUSTOMER_ROUTES.login, { replace: true, state: { message: "Password reset. Please log in." } })} className="h-[58px] rounded-[14px] bg-[#C9A390] text-[18px] font-medium text-white shadow-md shadow-[#C9A390]/20 transition-opacity hover:opacity-95">Go to customer login</button>
        </div>
      </CustomerAuthLayout>
    );
  }

  return (
    <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer reset password">
      <div className="mb-7 text-center">
        <h1 className="mb-1 text-[32px] font-bold text-[#A37E6B] md:text-[36px]" style={{ fontFamily: '"PT Serif", serif' }}>Reset Password</h1>
        <p className="text-[16px] leading-[1.35] text-[#C9A390]">Enter your email, OTP, and new customer password.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        {apiError && <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-center text-[14px] text-red-600">{apiError}</div>}
        <Field label="Email" error={form.formState.errors.email?.message}><input type="email" placeholder="Enter your Email" {...form.register("email")} className="h-[58px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[16px] text-[#5C5550] outline-none placeholder:text-[#B6A092] focus:border-[#A37E6B]" /></Field>
        <Field label="OTP Code" error={form.formState.errors.otpCode?.message}><input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP" {...form.register("otpCode")} className="h-[58px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[18px] tracking-[0.25em] text-[#5C5550] outline-none placeholder:text-[#B6A092] placeholder:tracking-normal focus:border-[#A37E6B]" /></Field>
        <PasswordField label="New Password" visible={showPassword} toggle={() => setShowPassword((value) => !value)} register={form.register("newPassword")} error={form.formState.errors.newPassword?.message} />
        <PasswordField label="Confirm Password" visible={showConfirm} toggle={() => setShowConfirm((value) => !value)} register={form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />
        <button type="submit" disabled={form.formState.isSubmitting} className="mt-2 h-[58px] rounded-[14px] bg-[#C9A390] text-[18px] font-medium text-white shadow-md shadow-[#C9A390]/20 transition-opacity hover:opacity-95 disabled:opacity-70">{form.formState.isSubmitting ? "Resetting..." : "Reset Password"}</button>
        <Link to={CUSTOMER_ROUTES.forgotPassword} className="text-center text-[14px] font-medium text-[#A37E6B] hover:underline">Need a new OTP?</Link>
      </form>
    </CustomerAuthLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">{label}</label>{children}{error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}</div>;
}

function PasswordField({ label, visible, toggle, register, error }: { label: string; visible: boolean; toggle: () => void; register: UseFormRegisterReturn; error?: string }) {
  return <Field label={label} error={error}><div className="relative"><input type={visible ? "text" : "password"} placeholder={label} {...register} className="h-[58px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 pr-14 text-[16px] text-[#5C5550] outline-none placeholder:text-[#B6A092] focus:border-[#A37E6B]" /><button type="button" onClick={toggle} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#B6A092] hover:text-[#5C5550]" aria-label={visible ? `Hide ${label}` : `Show ${label}`}>{visible ? <EyeOff size={22} /> : <Eye size={22} />}</button></div></Field>;
}
