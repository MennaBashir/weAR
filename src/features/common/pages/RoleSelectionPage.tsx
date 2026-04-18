import { ShoppingBag, Store, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FEF9F2] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#C9A390] opacity-10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#B6A092] opacity-10 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

      <div className="text-center mb-16 relative z-10">
        <h1
          className="text-[42px] md:text-[54px] font-bold text-[#C9A390] tracking-wider mb-4"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          weAR
        </h1>
        <p className="text-[16px] md:text-[18px] text-[#949E96] max-w-[500px] mx-auto">
          Where Shoppers Find Perfect Fit and Brands Discover Smarter Retail
          Solutions. Choose your journey to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-[1100px] relative z-10">
        <div
          onClick={() => navigate("/customer/onboarding")}
          className="group flex flex-col items-center text-center bg-white p-10 rounded-[24px] border border-[#E4DCD1] shadow-sm hover:shadow-xl hover:border-[#C9A390] transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
        >
          <div className="w-20 h-20 rounded-full bg-[#FEF9F2] text-[#C9A390] flex items-center justify-center mb-6 group-hover:bg-[#C9A390] group-hover:text-white transition-colors duration-300">
            <ShoppingBag size={32} />
          </div>
          <h2
            className="text-[22px] font-bold text-[#5C5550] mb-3"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Customer
          </h2>
          <p className="text-[14px] text-[#949E96] mb-8 leading-relaxed">
            Create your 3D avatar, try on clothes virtually, and find your
            perfect fit with AI recommendations.
          </p>
          <div className="mt-auto flex items-center gap-2 text-[#C9A390] font-bold text-[14px] group-hover:gap-4 transition-all">
            Enter as Customer <ArrowRight size={16} />
          </div>
        </div>

        <div
          onClick={() => navigate("/login/retailer")}
          className="group flex flex-col items-center text-center bg-white p-10 rounded-[24px] border-2 border-[#C9A390] shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 bg-[#E0F2E9] text-[#4CAF50] text-[10px] font-bold px-3 py-1 rounded-full">
            FOR BUSINESS
          </div>
          <div className="w-20 h-20 rounded-full bg-[#C9A390] text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Store size={32} />
          </div>
          <h2
            className="text-[22px] font-bold text-[#5C5550] mb-3"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Retailer
          </h2>
          <p className="text-[14px] text-[#949E96] mb-8 leading-relaxed">
            Manage your store, track inventory, and view powerful analytics on
            how customers interact with your products.
          </p>
          <div className="mt-auto flex items-center gap-2 text-[#C9A390] font-bold text-[14px] group-hover:gap-4 transition-all">
            Enter as Retailer <ArrowRight size={16} />
          </div>
        </div>

        <div
          onClick={() => navigate("/admin")}
          className="group flex flex-col items-center text-center bg-white p-10 rounded-[24px] border border-[#E4DCD1] shadow-sm hover:shadow-xl hover:border-[#5C5550] transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
        >
          <div className="w-20 h-20 rounded-full bg-gray-50 text-[#5C5550] flex items-center justify-center mb-6 group-hover:bg-[#5C5550] group-hover:text-white transition-colors duration-300">
            <ShieldCheck size={32} />
          </div>
          <h2
            className="text-[22px] font-bold text-[#5C5550] mb-3"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Super Admin
          </h2>
          <p className="text-[14px] text-[#949E96] mb-8 leading-relaxed">
            System control panel. Manage retailers, monitor platform health, and
            configure global settings.
          </p>
          <div className="mt-auto flex items-center gap-2 text-[#5C5550] font-bold text-[14px] group-hover:gap-4 transition-all">
            Enter as Admin <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
