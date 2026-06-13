import { Outlet } from "react-router-dom";

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#2F2925]">
      <header className="border-b border-[#E4DCD1] bg-white px-6 py-4">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#A37E6B]">
          weAR Customer
        </p>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
