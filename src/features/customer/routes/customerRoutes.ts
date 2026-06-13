export const CUSTOMER_ROUTES = {
  root: "/customer",
  home: "/customer/home",
  dashboard: "/customer/dashboard",
  login: "/login/customer",
  signup: "/signup/customer",
} as const;

export type CustomerRouteKey = keyof typeof CUSTOMER_ROUTES;
export type CustomerRoutePath = (typeof CUSTOMER_ROUTES)[CustomerRouteKey];
