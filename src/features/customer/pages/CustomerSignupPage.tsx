import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import signupImg from "@/assets/customer/signup.webp";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";

export function CustomerSignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<"Female" | "Male">("Female");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: "cust-1",
      email: email || "customer@wear.com",
      name: name || "New Customer",
      role: "customer",
    });
    navigate("/customer/dashboard");
  };

  return (
    <CustomerAuthLayout imageSrc={signupImg} imageAlt="Customer Signup">
      <div className="flex flex-col h-full justify-center">
        <div className="text-center mb-5">
          <h1
            className="text-[28px] md:text-[32px] font-bold text-[#A37E6B] mb-1"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Sign-up
          </h1>
          <p className="text-[13px] text-[#B6A092] leading-snug">
            Welcome to weAR
            <br />
            Create your account here!
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-medium text-[#B6A092] mb-1 block">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your Name"
              className="h-[44px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[13px] outline-none focus:border-[#C9A390] text-[#5C5550] placeholder:text-[#D3C1B6] bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#B6A092] mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
              className="h-[44px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[13px] outline-none focus:border-[#C9A390] text-[#5C5550] placeholder:text-[#D3C1B6] bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#B6A092] mb-1 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Password"
                className="h-[44px] w-full rounded-[10px] border border-[#E4DCD1] px-4 pr-10 text-[13px] outline-none focus:border-[#C9A390] text-[#5C5550] placeholder:text-[#D3C1B6] bg-white transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B6A092] hover:text-[#5C5550]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#B6A092] mb-1 block">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="Enter your Phone Number"
              className="h-[44px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[13px] outline-none focus:border-[#C9A390] text-[#5C5550] placeholder:text-[#D3C1B6] bg-white transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[#B6A092] mb-1 block">
                Gender
              </label>
              <div className="flex h-[44px] rounded-[10px] border border-[#E4DCD1] p-1 gap-1 bg-white">
                <button
                  type="button"
                  onClick={() => setGender("Female")}
                  className={`flex-1 rounded-[6px] text-[12px] font-bold transition-all ${gender === "Female" ? "bg-[#FEF9F2] text-[#A37E6B] shadow-sm border border-[#E4DCD1]/50" : "text-[#B6A092] hover:bg-gray-50"}`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => setGender("Male")}
                  className={`flex-1 rounded-[6px] text-[12px] font-bold transition-all ${gender === "Male" ? "bg-[#FEF9F2] text-[#A37E6B] shadow-sm border border-[#E4DCD1]/50" : "text-[#B6A092] hover:bg-gray-50"}`}
                >
                  Male
                </button>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#B6A092] mb-1 block">
                Age
              </label>
              <input
                type="number"
                placeholder="Enter your Age"
                className="h-[44px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[13px] outline-none focus:border-[#C9A390] text-[#5C5550] placeholder:text-[#D3C1B6] bg-white transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="h-[46px] w-full rounded-[10px] bg-[#C9A390] text-white font-bold text-[14px] hover:opacity-95 transition-opacity mt-2 shadow-sm shadow-[#C9A390]/20 tracking-wide"
          >
            Sign Up
          </button>

          <div className="text-center mt-1">
            <span className="text-[12px] text-[#B6A092]">
              Have an account?{" "}
            </span>
            <Link
              to="/login/customer"
              className="text-[12px] text-[#A37E6B] font-bold hover:underline transition-all"
            >
              Login ↗
            </Link>
          </div>
        </form>
      </div>
    </CustomerAuthLayout>
  );
}
