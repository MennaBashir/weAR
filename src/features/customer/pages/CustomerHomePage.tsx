import { useAuthStore } from "@/features/auth/useAuthStore";
import { selectCustomerDisplayName } from "@/features/customer/utils/customerSelectors";

export function CustomerHomePage() {
  const displayName = useAuthStore(selectCustomerDisplayName);

  return (
    <section className="rounded-3xl border border-[#E4DCD1] bg-white p-8 shadow-sm">
      <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#A37E6B]">
        Customer home
      </p>
      <h1 className="text-3xl font-bold text-[#2F2925]">
        Welcome, {displayName}
      </h1>
      <p className="mt-3 max-w-2xl text-[#6F625B]">
        Your customer foundation is ready. Catalog, avatar, recommendations, and
        checkout experiences will be added in later phases.
      </p>
    </section>
  );
}
