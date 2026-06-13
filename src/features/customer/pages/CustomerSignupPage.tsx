import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import signupImg from "@/assets/customer/signup.webp";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import {
  customerAuthApi,
  extractCustomerAuthData,
  extractTempStepToken,
  getCustomerProfile,
  isSuccessfulResponse,
  type CustomerGender,
} from "@/features/customer/api/customerAuth.api";

type SignupStep = 1 | 2;

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

export function CustomerSignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [step, setStep] = useState<SignupStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<CustomerGender>("Male");
  const [createAvatar, setCreateAvatar] = useState<boolean | null>(null);
  const [tempStepToken, setTempStepToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await customerAuthApi.register({
        fullName,
        email,
        password,
        phoneNumber,
      });
      const nextTempToken = extractTempStepToken(response);

      if (nextTempToken) {
        setTempStepToken(nextTempToken);
        setStep(2);
        setMessage("تم إنشاء الخطوة الأولى بنجاح. أكمل بيانات الملف الشخصي.");
      } else {
        setErrorMsg(response.message || "تعذر الحصول على TempStepToken.");
      }
    } catch (error: unknown) {
      setErrorMsg(
        getErrorMessage(error, "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);

    if (!tempStepToken) {
      setErrorMsg("TempStepToken غير متوفر. يرجى تنفيذ الخطوة الأولى مرة أخرى.");
      setStep(1);
      return;
    }

    if (createAvatar === null) {
      setErrorMsg("يرجى اختيار هل تريد إنشاء Avatar الآن أم لا.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await customerAuthApi.completeProfile({
        tempStepToken,
        age: Number(age),
        gender,
        createAvatar,
      });
      const authData = extractCustomerAuthData(response);

      if (authData?.accessToken && authData?.refreshToken) {
        const profile = getCustomerProfile(authData, {
          fullName,
          email,
          phoneNumber,
          age: Number(age),
          gender,
          createAvatar,
        });

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

      if (isSuccessfulResponse(response)) {
        navigate("/login/customer", {
          replace: true,
          state: { message: "تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن." },
        });
        return;
      }

      setErrorMsg(response.message || "تعذر إكمال الملف الشخصي.");
    } catch (error: unknown) {
      setErrorMsg(
        getErrorMessage(error, "حدث خطأ أثناء إكمال الملف الشخصي."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthLayout imageSrc={signupImg} imageAlt="Customer Signup">
      <div className="flex h-full flex-col">
        <div className="mb-5 text-center">
          <h1
            className="mb-1 text-[32px] font-bold text-[#A37E6B] md:text-[36px]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Sign-up
          </h1>
          <p className="text-[18px] leading-[1.05] text-[#C9A390]">
            Welcome to weAR
            <br />
            Create your account here!
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-center text-[14px] text-red-600">
            {errorMsg}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[14px] text-emerald-700">
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">
                Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your Name"
                className="h-[56px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[16px] text-[#5C5550] outline-none transition-colors placeholder:text-[#B6A092] focus:border-[#A37E6B]"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email"
                className="h-[56px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[16px] text-[#5C5550] outline-none transition-colors placeholder:text-[#B6A092] focus:border-[#A37E6B]"
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
                  className="h-[56px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 pr-12 text-[16px] text-[#5C5550] outline-none transition-colors placeholder:text-[#B6A092] focus:border-[#A37E6B]"
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
            </div>

            <div>
              <label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your Phone Number"
                className="h-[56px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[16px] text-[#5C5550] outline-none transition-colors placeholder:text-[#B6A092] focus:border-[#A37E6B]"
                required
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C9A390]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E4DCD1]" />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="h-9 rounded-[10px] bg-[#C9A390] px-7 text-[18px] font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-70"
              >
                {isLoading ? "Loading..." : "Next"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCompleteProfile} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[16px] font-medium text-[#C9A390]">
                Age
              </label>
              <input
                type="number"
                min="1"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your Age"
                className="h-[56px] w-full rounded-[14px] border border-[#C9A390] bg-white px-5 text-[16px] text-[#5C5550] outline-none transition-colors placeholder:text-[#B6A092] focus:border-[#A37E6B]"
                required
              />
            </div>

            <fieldset>
              <legend className="mb-3 text-[16px] font-medium text-[#C9A390]">
                Gender
              </legend>
              <div className="flex gap-8 text-[16px] text-[#A37E6B]">
                {(["Male", "Female"] as CustomerGender[]).map((option) => (
                  <label key={option} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={gender === option}
                      onChange={() => setGender(option)}
                      className="h-4 w-4 accent-[#C9A390]"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-[16px] font-medium text-[#C9A390]">
                Do you want to create your own avatar now?
              </legend>
              <div className="flex gap-8 text-[16px] text-[#A37E6B]">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="createAvatar"
                    checked={createAvatar === true}
                    onChange={() => setCreateAvatar(true)}
                    className="h-4 w-4 accent-[#C9A390]"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="createAvatar"
                    checked={createAvatar === false}
                    onChange={() => setCreateAvatar(false)}
                    className="h-4 w-4 accent-[#C9A390]"
                  />
                  No
                </label>
              </div>
            </fieldset>

            <div className="mt-auto flex items-center justify-between pt-6">
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E4DCD1]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#C9A390]" />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="h-9 rounded-[10px] bg-[#C9A390] px-7 text-[18px] font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-70"
              >
                {isLoading ? "Loading..." : "Submit"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-auto pt-4 text-center text-[16px] text-[#C9A390]">
          Have an account?{" "}
          <Link
            to="/login/customer"
            className="font-medium text-[#A37E6B] transition-all hover:underline"
          >
            Login ↗
          </Link>
        </div>
      </div>
    </CustomerAuthLayout>
  );
}
