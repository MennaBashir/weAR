import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import loginImg from "@/assets/customer/login.webp";
import googleIcon from "@/assets/auth/google.svg";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import {
  customerAuthApi,
  extractCustomerAuthData,
  getCustomerProfile,
} from "@/features/customer/api/customerAuth.api";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return (
      (data?.message as string | undefined) ||
      ((data?.errors as string[] | undefined)?.join("، ")) ||
      fallback
    );
  }

  if (error instanceof Error) return error.message;

  return fallback;
};

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const locationState = location.state as { message?: string } | null;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await customerAuthApi.login({
        email,
        password,
        rememberMe,
      });
      const authData = extractCustomerAuthData(response);

      if (authData?.accessToken && authData.refreshToken) {
        const profile = getCustomerProfile(authData, { email });

        login(
          profile,
          {
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
          },
          "customer",
        );
        navigate("/customer/dashboard", { replace: true });
        return;
      }

      setErrorMsg(response.message || "Invalid customer credentials.");
    } catch (error: unknown) {
      setErrorMsg(
        getErrorMessage(error, "Something went wrong. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer Login">
      <div className="mb-7 text-center">
        <h1
          className="mb-1 text-[32px] font-bold text-[#A37E6B] md:text-[36px]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Login
        </h1>
        <p className="text-[18px] leading-[1.05] text-[#C9A390]">
          Welcome back! Please log in to access
          <br />
          your account
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
        {locationState?.message && (
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[14px] text-emerald-700">
            {locationState.message}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-center text-[14px] text-red-600">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email"
            className="h-[58px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[16px] text-[#5C5550] outline-none transition-colors placeholder:text-[#B6A092] focus:border-[#A37E6B]"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Password"
              className="h-[58px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 pr-14 text-[16px] text-[#5C5550] outline-none transition-colors placeholder:text-[#B6A092] focus:border-[#A37E6B]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#B6A092] transition-colors hover:text-[#5C5550]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-[14px] font-medium text-[#B6A092] transition-colors hover:text-[#A37E6B]"
            >
              Forget Password?
            </Link>
          </div>
        </div>

        <label className="mt-1 flex items-center gap-3 text-[16px] font-medium text-[#C9A390]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 accent-[#C9A390]"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-[58px] w-full rounded-[14px] bg-[#C9A390] text-[20px] font-medium text-white shadow-md shadow-[#C9A390]/20 transition-opacity hover:opacity-95 disabled:opacity-70"
        >
          {isLoading ? "Loading..." : "Login"}
        </button>

        <div className="my-1 flex items-center gap-2">
          <div className="h-px flex-1 bg-[#C9A390]"></div>
          <span className="text-[14px] font-medium uppercase text-[#C9A390]">
            OR
          </span>
          <div className="h-px flex-1 bg-[#C9A390]"></div>
        </div>

        <button
          type="button"
          className="flex h-[58px] w-full items-center justify-center gap-4 rounded-[14px] border border-[#C9A390] bg-white text-[20px] font-medium text-[#B6A092] shadow-sm transition-colors hover:bg-gray-50"
        >
          <img src={googleIcon} alt="Google" className="h-6 w-6" />
          Login with Google
        </button>

        <div className="mt-3 text-center text-[16px] text-[#C9A390]">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup/customer"
            className="font-medium text-[#A37E6B] transition-all hover:underline"
          >
            Sign Up ↗
          </Link>
        </div>
      </form>
    </CustomerAuthLayout>
  );
}
