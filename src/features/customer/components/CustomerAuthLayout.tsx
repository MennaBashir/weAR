import React from "react";
import logoImage from "@/assets/auth/logo.webp";

interface CustomerAuthLayoutProps {
  children: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
}

export function CustomerAuthLayout({
  children,
  imageSrc,
  imageAlt,
}: CustomerAuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-white p-4 pt-28 md:p-8 md:pt-20 font-sans">
      <div className="absolute left-6 top-4 z-20 md:left-8 md:top-6">
        <div className="flex items-center gap-2">
          <div className="h-[60px] w-[65px] overflow-hidden md:h-[80px] md:w-[85px]">
            <img
              src={logoImage}
              alt="weAR logo"
              className="h-full w-full object-contain"
            />
          </div>
          <span
            className="translate-y-[1px] text-[#A37E6B]"
            style={{
              fontFamily: "Allura, cursive",
              fontWeight: 400,
              fontSize: "36px",
              lineHeight: "100%",
              letterSpacing: "0.01em",
            }}
          >
            weAR
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-center md:pl-16 lg:pl-24">
        <div className="flex w-full flex-col md:flex-row md:items-stretch md:justify-center md:gap-[65px]">
          <section
            className="flex w-full shrink-0 flex-col justify-center rounded-[28px] bg-white px-8 py-8 md:w-[560px] md:px-11 md:py-10"
            style={{ boxShadow: "0px 0px 30px 0px rgba(182, 160, 146, 0.25)" }}
          >
            {children}
          </section>

          <section className="hidden w-full flex-1 overflow-hidden rounded-[28px] md:block max-h-[85vh]">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="h-full w-full object-cover"
            />
          </section>
        </div>

        <div className="mt-4 flex w-full flex-col md:flex-row md:justify-center md:gap-[65px]">
          <footer
            className="w-full text-center text-[#BFC7DE] md:w-[560px] shrink-0"
            style={{
              fontFamily: "Roboto, sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              letterSpacing: "0.02em",
            }}
          >
            © 2025 ALL RIGHTS RESERVED
          </footer>
          <div className="hidden w-full flex-1 md:block"></div>
        </div>
      </div>
    </div>
  );
}
