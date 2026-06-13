import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";

const isSafeCustomerPath = (value: string): boolean =>
  value.startsWith(`${CUSTOMER_ROUTES.root}/`) && !value.startsWith("//") && !value.includes("://");

export const getSafeCustomerReturnRoute = (value: string | null | undefined, fallback = CUSTOMER_ROUTES.avatar): string => {
  if (!value) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    return isSafeCustomerPath(decoded) ? decoded : fallback;
  } catch {
    return fallback;
  }
};

export const appendReturnToCustomerRoute = (route: string, returnTo: string | null | undefined): string => {
  const safeReturn = getSafeCustomerReturnRoute(returnTo, "");
  return safeReturn ? `${route}?returnTo=${encodeURIComponent(safeReturn)}` : route;
};
