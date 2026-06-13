import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AppLayout } from "@/components/layout/AppLayout";

import { RoleSelectionPage } from "@/features/common/pages/RoleSelectionPage";

import RetailerLoginPage from "@/features/auth/pages/RetailerLoginPage";
import RetailerSignupStep1Page from "@/features/auth/pages/RetailerSignupStep1Page";
import RetailerSignupStep2Page from "@/features/auth/pages/RetailerSignupStep2Page";
import RetailerPricingPage from "@/features/auth/pages/RetailerPricingPage";
import RetailerPaymentPage from "@/features/auth/pages/RetailerPaymentPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";

import { RequireAuth } from "../guards/RequireAuth";
import { RequireRole } from "../guards/RequireRole";

import { RetailerLayout } from "@/features/retailer/layouts/RetailerLayout";
import { RetailerDashboardPage } from "@/features/retailer/pages/RetailerDashboardPage";
import { RetailerProductsListPage } from "@/features/retailer/pages/RetailerProductsListPage";
import { RetailerOrdersPage } from "@/features/retailer/pages/RetailerOrdersPage";
import { RetailerOffersPage } from "@/features/retailer/pages/RetailerOffersPage";
import { RetailerCategoriesPage } from "@/features/retailer/pages/RetailerCategoriesPage";
import { RetailerEditPricingPage } from "@/features/retailer/pages/RetailerEditPricingPage";
import { RetailerHelpPage } from "@/features/retailer/pages/RetailerHelpPage";
import { RetailerSettingsPage } from "@/features/retailer/pages/RetailerSettingsPage";
import { RetailerInventoryPage } from "@/features/retailer/pages/RetailerInventoryPage";

import { CustomerLoginPage } from "@/features/customer/pages/CustomerLoginPage";
import { CustomerSignupPage } from "@/features/customer/pages/CustomerSignupPage";
import { CustomerLayout } from "@/features/customer/layouts/CustomerLayout";
import { CustomerHomePage } from "@/features/customer/pages/CustomerHomePage";
import { CustomerShopPage } from "@/features/customer/pages/CustomerShopPage";
import { CustomerPlaceholderPage } from "@/features/customer/pages/CustomerPlaceholderPage";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";

import { ComingSoonPage } from "@/features/common/pages/ComingSoonPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RoleSelectionPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Navigate to="/login/retailer" replace /> },

      { path: "/login/retailer", element: <RetailerLoginPage /> },
      { path: "/signup/retailer", element: <RetailerSignupStep1Page /> },
      { path: "/signup/retailer/step-2", element: <RetailerSignupStep2Page /> },
      { path: "/signup/retailer/pricing", element: <RetailerPricingPage /> },
      { path: "/signup/retailer/payment", element: <RetailerPaymentPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },

      { path: CUSTOMER_ROUTES.login, element: <CustomerLoginPage /> },
      { path: CUSTOMER_ROUTES.signup, element: <CustomerSignupPage /> },
    ],
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: "/retailer",
        element: (
          <RequireRole role="retailer">
            <RetailerLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <RetailerDashboardPage /> },
          { path: "offers", element: <RetailerOffersPage /> },
          { path: "categories", element: <RetailerCategoriesPage /> },
          { path: "products", element: <RetailerProductsListPage /> },
          { path: "orders", element: <RetailerOrdersPage /> },
          { path: "inventory", element: <RetailerInventoryPage /> },
          { path: "pricing", element: <RetailerEditPricingPage /> },
          { path: "help", element: <RetailerHelpPage /> },
          { path: "settings", element: <RetailerSettingsPage /> },
        ],
      },
      {
        path: CUSTOMER_ROUTES.root,
        element: (
          <RequireRole role="customer">
            <CustomerLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Navigate to={CUSTOMER_ROUTES.home} replace /> },
          { path: "dashboard", element: <Navigate to={CUSTOMER_ROUTES.home} replace /> },
          { path: "home", element: <CustomerHomePage /> },
          { path: "shop", element: <CustomerShopPage /> },
          {
            path: "try-on",
            element: (
              <CustomerPlaceholderPage
                title="Try On"
                description="Avatar and virtual try-on flows will be implemented in a later phase."
              />
            ),
          },
          {
            path: "favorites",
            element: (
              <CustomerPlaceholderPage
                title="Favorites"
                description="Saved products and outfit collections will be implemented later."
              />
            ),
          },
          {
            path: "account",
            element: (
              <CustomerPlaceholderPage
                title="Account"
                description="Customer profile, orders, and preferences will be implemented later."
              />
            ),
          },
        ],
      },
      { path: "/admin", element: <ComingSoonPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
