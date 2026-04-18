import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import ob1 from "@/assets/auth/signupstep1.webp";
import ob2 from "@/assets/auth/signupstep2.webp";
import ob3 from "@/assets/auth/signupstep1.webp";

const STEPS = [
  {
    title: "Create Your Avatar",
    subtitle: "Customize Your Digital Look For A personalized Experience",
    image: ob1,
    buttonText: "Next",
    showArrow: true,
  },
  {
    title: "Smart Ai Recommendation",
    subtitle: "weAR Learns Your Style And Suggests Outfits you will love",
    image: ob2,
    buttonText: "Next",
    showArrow: true,
  },
  {
    title: "Try Before Buy",
    subtitle: "See It on you instantly",
    image: ob3,
    buttonText: "Get Started",
    showArrow: false,
  },
];

export function CustomerOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/login/customer");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans">
      {/* Background Images */}
      {STEPS.map((step, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            currentStep === index
              ? "opacity-100 z-0"
              : "opacity-0 z-0 pointer-events-none"
          }`}
          style={{
            backgroundImage: `url(${step.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      {/* Gradients for Text & Control Readability */}
      <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-black/70 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent z-10" />

      {/* Texts (Top Left Aligned) */}
      <div className="absolute top-[10%] md:top-[12%] left-[5%] md:left-[8%] z-20 max-w-[500px] pr-4">
        <h1
          className="text-[32px] md:text-[42px] font-bold text-[#C9A390] mb-3 leading-tight drop-shadow-md"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          {STEPS[currentStep].title}
        </h1>
        <p className="text-[15px] md:text-[18px] text-white/95 leading-relaxed font-medium drop-shadow-sm">
          {STEPS[currentStep].subtitle}
        </p>
      </div>

      {/* Navigation Controls (Bottom Aligned) */}
      <div className="absolute bottom-[6%] left-0 right-0 z-20 flex items-center justify-between px-[5%] md:px-[8%]">
        {/* Back Button */}
        <div className="w-[140px]">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all shadow-sm"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
          ) : (
            <div /> // Empty div to preserve flex layout
          )}
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-500 ease-in-out shadow-sm ${
                currentStep === index ? "bg-[#C9A390] w-8" : "bg-white/60 w-2"
              }`}
            />
          ))}
        </div>

        {/* Next / Get Started Button */}
        <div className="w-[140px] flex justify-end">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-[12px] bg-[#C9A390] text-white font-bold text-[15px] hover:bg-[#A37E6B] transition-colors whitespace-nowrap shadow-lg"
          >
            {STEPS[currentStep].buttonText}
            {STEPS[currentStep].showArrow && (
              <ArrowRight size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
