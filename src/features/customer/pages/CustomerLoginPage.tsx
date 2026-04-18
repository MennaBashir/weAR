import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import loginImg from "@/assets/customer/login.webp";
import googleIcon from "@/assets/auth/google.svg";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: "cust-1",
      email: email || "customer@wear.com",
      name: "Customer User",
      role: "customer",
    });
    navigate("/customer/dashboard");
  };

  return (
    <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer Login">
      <div className="text-center mb-8">
        <h1
          className="text-[32px] md:text-[36px] font-bold text-[#A37E6B] mb-2"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Login
        </h1>
        <p className="text-[14px] text-[#B6A092] leading-relaxed">
          Welcome back! Please log in to access your
          <br />
          account
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div>
          <label className="text-[13px] font-medium text-[#B6A092] mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email"
            className="h-[50px] w-full rounded-[12px] border border-[#E4DCD1] px-4 text-[14px] outline-none focus:border-[#C9A390] text-[#5C5550] placeholder:text-[#D3C1B6] bg-white transition-colors"
            required
          />
        </div>

        <div>
          <label className="text-[13px] font-medium text-[#B6A092] mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your Password"
              className="h-[50px] w-full rounded-[12px] border border-[#E4DCD1] px-4 pr-12 text-[14px] outline-none focus:border-[#C9A390] text-[#5C5550] placeholder:text-[#D3C1B6] bg-white transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B6A092] hover:text-[#5C5550]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="text-right mt-1.5">
            <a
              href="#"
              className="text-[12px] text-[#B6A092] hover:text-[#A37E6B] font-medium transition-colors"
            >
              Forget Password?
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-1">
          <div className="relative flex items-center justify-center w-5 h-5 rounded-[4px] border border-[#C9A390] bg-[#C9A390] overflow-hidden cursor-pointer shadow-sm shadow-[#C9A390]/20">
            <input
              type="checkbox"
              className="absolute opacity-0 cursor-pointer w-full h-full"
              defaultChecked
            />
            <svg
              className="w-3.5 h-3.5 text-white pointer-events-none"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M3 8L6 11L11 3.5"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="currentColor"
              ></path>
            </svg>
          </div>
          <span className="text-[13px] text-[#B6A092] font-medium">
            Remember me
          </span>
        </div>

        <button
          type="submit"
          className="h-[50px] w-full rounded-[12px] bg-[#C9A390] text-white font-bold text-[15px] hover:opacity-95 transition-opacity mt-3 shadow-md shadow-[#C9A390]/20 tracking-wide"
        >
          Login
        </button>

        <div className="flex items-center gap-4 my-2">
          <div className="h-[1px] flex-1 bg-[#E4DCD1]"></div>
          <span className="text-[12px] text-[#B6A092] uppercase font-bold tracking-wider">
            OR
          </span>
          <div className="h-[1px] flex-1 bg-[#E4DCD1]"></div>
        </div>

        <button
          type="button"
          className="h-[50px] w-full rounded-[12px] border border-[#E4DCD1] bg-white flex items-center justify-center gap-3 text-[#5C5550] font-bold text-[14px] hover:bg-gray-50 transition-colors shadow-sm"
        >
          <img src={googleIcon} alt="Google" className="w-5 h-5" />
          Login with Google
        </button>

        <div className="text-center mt-5">
          <span className="text-[13px] text-[#B6A092]">
            Don't have an account?{" "}
          </span>
          <Link
            to="/signup/customer"
            className="text-[13px] text-[#A37E6B] font-bold hover:underline transition-all"
          >
            Sign Up ↗
          </Link>
        </div>
      </form>
    </CustomerAuthLayout>
  );
}
