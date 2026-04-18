import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import basicImg from "@/assets/auth/pricing/basic.webp";
import standardImg from "@/assets/auth/pricing/standard.webp";
import enterpriseImg from "@/assets/auth/pricing/enterprise.webp";
import saasImg from "@/assets/auth/pricing/saas.webp";

type BillingCycle = "Monthly" | "Yearly" | "SaaS";

interface PricingPlan {
  name: string;
  desc: string;
  price: string;
  period: string;
  img: string;
  popular?: boolean;
  isSaaS?: boolean;
  features: string[];
}

const pricingData: Record<BillingCycle, PricingPlan[]> = {
  Monthly: [
    {
      name: "Basic",
      desc: "A simple start for everyone",
      price: "50",
      period: "month",
      img: basicImg,
      features: [
        "Virtual Fitting Room with 3D Avatars",
        "Full AI Style Recommendations",
        "Product Catalog & Inventory Management",
        "Retailer Analytics Dashboard",
        "Return & Refund Management System",
        "Up to 250 active products",
        "Up to 1,000 monthly virtual try-ons",
        "5% platform commission on sales",
        "Email support (48-hour response)",
      ],
    },
    {
      name: "Standard",
      desc: "For small to medium businesses",
      price: "150",
      period: "month",
      img: standardImg,
      popular: true,
      features: [
        "Virtual Fitting Room with 3D Avatars",
        "Full AI Style Recommendations",
        "Product Catalog & Inventory Management",
        "Retailer Analytics Dashboard",
        "Return & Refund Management System",
        "Up to 1,000 active products",
        "Up to 10,000 monthly virtual try-ons",
        "3% platform commission on sales",
        "Advanced body analytics & fit insights",
        "Priority support (24-hour response)",
      ],
    },
    {
      name: "Enterprise",
      desc: "Solution for big organizations",
      price: "300",
      period: "month",
      img: enterpriseImg,
      features: [
        "Virtual Fitting Room with 3D Avatars",
        "Full AI Style Recommendations",
        "Product Catalog & Inventory Management",
        "Retailer Analytics Dashboard",
        "Return & Refund Management System",
        "Unlimited active products",
        "Unlimited monthly virtual try-ons",
        "1% platform commission on sales",
        "24/7 phone & chat support",
        "Onboarding & training sessions",
      ],
    },
  ],
  Yearly: [
    {
      name: "Basic",
      desc: "A simple start for everyone",
      price: "500",
      period: "Year",
      img: basicImg,
      features: [
        "Virtual Fitting Room with 3D Avatars",
        "Full AI Style Recommendations",
        "Product Catalog & Inventory Management",
        "Retailer Analytics Dashboard",
        "Return & Refund Management System",
        "Up to 250 active products",
        "Up to 1,000 monthly virtual try-ons",
        "5% platform commission on sales",
        "Email support (48-hour response)",
      ],
    },
    {
      name: "Standard",
      desc: "For small to medium businesses",
      price: "1440",
      period: "Year",
      img: standardImg,
      popular: true,
      features: [
        "Virtual Fitting Room with 3D Avatars",
        "Full AI Style Recommendations",
        "Product Catalog & Inventory Management",
        "Retailer Analytics Dashboard",
        "Return & Refund Management System",
        "Up to 1,000 active products",
        "Up to 10,000 monthly virtual try-ons",
        "3% platform commission on sales",
        "Advanced body analytics & fit insights",
        "Priority support (24-hour response)",
      ],
    },
    {
      name: "Enterprise",
      desc: "Solution for big organizations",
      price: "3840",
      period: "Year",
      img: enterpriseImg,
      features: [
        "Virtual Fitting Room with 3D Avatars",
        "Full AI Style Recommendations",
        "Product Catalog & Inventory Management",
        "Retailer Analytics Dashboard",
        "Return & Refund Management System",
        "Unlimited active products",
        "Unlimited monthly virtual try-ons",
        "1% platform commission on sales",
        "24/7 phone & chat support",
        "Onboarding & training sessions",
      ],
    },
  ],
  SaaS: [
    {
      name: "Enterprise",
      desc: "Solution for big organizations",
      price: "5000",
      period: "",
      img: saasImg,
      isSaaS: true,
      features: [
        "Virtual Fitting Room with 3D Avatars",
        "Full AI Style Recommendations",
        "Product Catalog & Inventory Management",
        "Retailer Analytics Dashboard",
        "Return & Refund Management System",
        "Unlimited active products",
        "Unlimited monthly virtual try-ons",
        "1% platform commission on sales",
        "24/7 phone & chat support",
        "Onboarding & training sessions",
        "100% White-Label Platform - Your branding, your domain",
        "Custom Mobile Applications - iOS & Android apps under your name",
        "Source Code Access",
        "Dedicated Development Team for custom features",
        'Remove all "[Platform Name]" branding',
        "Priority 24/7 Support with SLAs",
      ],
    },
  ],
};

const textStyleBase = {
  fontFeatureSettings: "'liga' off, 'clig' off",
  fontFamily: '"Hanuman", sans-serif',
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "100%",
};

const buttonStyle = {
  display: "inline-flex",
  height: "50px",
  padding: "0 35px",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "12px",
  border: "1px solid #E4DCD1",
  fontFeatureSettings: "'liga' off, 'clig' off",
  fontFamily: '"Hanuman", sans-serif',
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12px",
  textTransform: "uppercase" as const,
};

const PricingCard = ({
  plan,
  onSelect,
}: {
  plan: PricingPlan;
  onSelect: (name: string, price: string) => void;
}) => {
  return (
    <div
      className={`flex flex-col shrink w-full max-w-[469px] h-[750px] max-h-full overflow-hidden bg-white relative transition-all duration-300 ${plan.popular ? "border-[2px] border-[#D4B09B] shadow-2xl scale-[1.02] z-10" : "hover:shadow-lg"}`}
      style={{
        borderRadius: "25px",
        border: plan.popular ? "2px solid #C9A390" : "1px solid #E4DCD1",
      }}
    >
      <div className="h-[200px] shrink-0 w-full relative bg-[#FDFCFB] flex justify-center items-end">
        <img
          src={plan.img}
          alt={plan.name}
          className="h-[85%] w-auto object-contain"
        />
        {plan.popular && (
          <div
            className="absolute top-0 right-6 bg-[#C9A390] text-white px-5 py-2 text-[11px] uppercase tracking-widest font-bold shadow-sm"
            style={{ borderRadius: "0 0 8px 8px" }}
          >
            Popular
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
        <div className="text-center shrink-0 border-b border-[#F0EDEB] pb-6 mb-6">
          <h3
            style={{
              ...textStyleBase,
              color: "#949E96",
              fontSize: "20px",
              letterSpacing: "0.2px",
            }}
          >
            {plan.name}
          </h3>
          <p
            className="mt-2"
            style={{
              ...textStyleBase,
              color: "#C9A390",
              fontSize: "14px",
              letterSpacing: "0.14px",
            }}
          >
            {plan.desc}
          </p>
          <div className="mt-4 flex items-start justify-center text-[#B6A092]">
            <span className="text-[18px] mt-2 font-bold">$</span>
            <span
              className="text-[54px] leading-none mx-1"
              style={{ fontFamily: '"PT Serif", serif' }}
            >
              {plan.price}
            </span>
            {plan.period && (
              <span className="text-[14px] self-end mb-2 text-[#8A8A8A]">
                /{plan.period}
              </span>
            )}
          </div>
        </div>

        <ul
          className="flex-1 overflow-y-auto space-y-3.5 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            ...textStyleBase,
            color: "rgba(0, 0, 0, 0.50)",
            fontSize: "14px",
            letterSpacing: "0.14px",
          }}
        >
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-[rgba(0,0,0,0.50)] text-[16px] leading-none mt-px">
                •
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-4 shrink-0 pt-6 mt-2 justify-center">
          <button
            onClick={() => onSelect(plan.name, plan.price)}
            className="cursor-pointer transition-all text-[#B6A092] hover:bg-[#C9A390] hover:text-white hover:border-[#C9A390]"
            style={buttonStyle}
          >
            START YOUR TRIAL
          </button>
          <button
            onClick={() => onSelect(plan.name, plan.price)}
            className="cursor-pointer transition-all text-[#B6A092] hover:bg-[#C9A390] hover:text-white hover:border-[#C9A390]"
            style={buttonStyle}
          >
            SELECT
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RetailerPricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [billing, setBilling] = useState<BillingCycle>("Monthly");

  const signupData = location.state?.signupData || {};
  const currentPlans = pricingData[billing];

  const handleSelectPlan = (planName: string, price: string) => {
    const planData = { plan: planName, billing, price };
    navigate("/signup/retailer/payment", {
      state: { finalSignupData: { ...signupData, ...planData } },
    });
  };

  return (
    // السر هنا: min-h-screen للموبايل عشان السكرول، و h-screen lg:overflow-hidden للديسكتوب عشان نمنع السكرول ونثبتها
    <div className="flex min-h-screen lg:h-screen w-full flex-col items-center justify-center bg-white px-4 py-10 lg:py-6 font-sans lg:overflow-hidden">
      <header className="w-full text-center shrink-0 mb-6 xl:mb-10 mt-4 lg:mt-0">
        <h1
          className="text-[#B6A092] mb-3 text-3xl md:text-[40px]"
          style={{
            fontFamily: '"PT Serif", serif',
            fontWeight: 700,
            lineHeight: "1.2",
          }}
        >
          {billing === "SaaS"
            ? "SaaS / White-Label Solution"
            : "Subscription Plan"}
        </h1>
        <p
          className="mx-auto mb-6 transition-all"
          style={{
            color: "rgba(201, 163, 144, 0.85)",
            textAlign: "center",
            fontFeatureSettings: "'liga' off, 'clig' off",
            fontFamily: '"Hanuman", sans-serif',
            fontSize: "20px",
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "100%",
            letterSpacing: "0.2px",
          }}
        >
          {billing === "SaaS"
            ? "For businesses wanting their own standalone VFR platform"
            : "All plans include full access to every platform feature. choose the best plan fit your needs."}
        </p>

        <div
          className="mx-auto flex items-center p-1"
          style={{
            width: "100%",
            maxWidth: "861px",
            height: "60px",
            borderRadius: "12px",
            border: "1px solid #E4DCD1",
            background: "#FEF9F2",
          }}
        >
          {(["Monthly", "Yearly", "SaaS"] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={`flex-1 h-full cursor-pointer rounded-[8px] transition-all duration-300 ${
                billing === cycle
                  ? "bg-[#B6A092] text-white shadow-sm"
                  : "text-[#B6A092] hover:bg-[#F5F1EF]"
              }`}
              style={{
                fontFamily: '"Hanuman", sans-serif',
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              {cycle}
            </button>
          ))}
        </div>
      </header>

      {billing === "SaaS" ? (
        <div className="flex w-full max-w-[1250px] flex-1 min-h-0 items-stretch gap-6 xl:gap-8 justify-center pb-6">
          <div
            className="flex flex-col shrink-0 w-full max-w-[400px] h-full overflow-hidden bg-white relative transition-all duration-300"
            style={{ borderRadius: "25px", border: "1px solid #E4DCD1" }}
          >
            <div className="flex flex-col flex-1 min-h-0 px-8 py-10 lg:py-6">
              <div className="text-center shrink-0 border-b border-[#F0EDEB] pb-6 mb-6">
                <h3
                  style={{
                    ...textStyleBase,
                    color: "#949E96",
                    fontSize: "20px",
                    letterSpacing: "0.2px",
                  }}
                >
                  {pricingData.SaaS[0].name}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    ...textStyleBase,
                    color: "#C9A390",
                    fontSize: "14px",
                    letterSpacing: "0.14px",
                  }}
                >
                  {pricingData.SaaS[0].desc}
                </p>
                <div className="mt-4 flex items-start justify-center text-[#B6A092]">
                  <span className="text-[18px] mt-2 font-bold">$</span>
                  <span
                    className="text-[54px] leading-none mx-1"
                    style={{ fontFamily: '"PT Serif", serif' }}
                  >
                    {pricingData.SaaS[0].price}
                  </span>
                </div>
              </div>

              <ul
                className="flex-1 overflow-y-auto space-y-3.5 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{
                  ...textStyleBase,
                  color: "rgba(0, 0, 0, 0.50)",
                  fontSize: "14px",
                  letterSpacing: "0.14px",
                }}
              >
                {pricingData.SaaS[0].features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[rgba(0,0,0,0.50)] text-[16px] leading-none mt-px">
                      •
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex shrink-0 pt-6 mt-2 justify-center">
                <button
                  onClick={() =>
                    handleSelectPlan(
                      pricingData.SaaS[0].name,
                      pricingData.SaaS[0].price,
                    )
                  }
                  className="cursor-pointer transition-all text-[#B6A092] hover:bg-[#C9A390] hover:text-white hover:border-[#C9A390] w-full max-w-[200px]"
                  style={buttonStyle}
                >
                  SELECT
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 h-full overflow-hidden rounded-[25px] bg-[#FDFCFB] border border-[#E4DCD1] hidden md:block">
            <img
              src={saasImg}
              alt="SaaS Illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div
          className={`flex w-full max-w-[1450px] flex-1 min-h-0 items-center gap-6 xl:gap-8 justify-center`}
        >
          {currentPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} onSelect={handleSelectPlan} />
          ))}
        </div>
      )}
    </div>
  );
}
