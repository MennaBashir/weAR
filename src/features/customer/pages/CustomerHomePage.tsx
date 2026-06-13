import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { selectCustomerDisplayName } from "@/features/customer/utils/customerSelectors";

export function CustomerHomePage() {
  const displayName = useAuthStore(selectCustomerDisplayName);

  return (
    <Card className={`${customerTheme.card} overflow-hidden`}>
      <CardContent className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className={`mb-3 text-sm font-semibold uppercase tracking-[0.18em] ${customerTheme.primaryText}`}>
            Customer home
          </p>
          <h1 className={`text-3xl font-bold sm:text-4xl ${customerTheme.darkText}`}>
            Welcome, {displayName}
          </h1>
          <p className={`mt-4 max-w-2xl text-base leading-7 ${customerTheme.mutedText}`}>
            Your customer storefront shell is ready. Catalog, avatar,
            recommendations, and checkout experiences will be added in later
            phases.
          </p>
        </div>
        <div className={`${customerTheme.softCard} p-6`}>
          <p className="text-sm font-semibold text-[#A37E6B]">
            Shell verification
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6F625B]">
            This lightweight page confirms nested customer routes render inside
            the responsive storefront layout.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
