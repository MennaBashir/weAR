import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { AppLayout } from "@/components/layout/AppLayout";

import { RequireAuth } from "@/app/guards/RequireAuth";
import { RequireRole } from "@/app/guards/RequireRole";

import { RoleSelectionPage } from "@/features/common/pages/RoleSelectionPage";
import { ComingSoonPage } from "@/features/common/pages/ComingSoonPage";

import RetailerLoginPage from "@/features/auth/pages/RetailerLoginPage";
import RetailerSignupStep1Page from "@/features/auth/pages/RetailerSignupStep1Page";
import RetailerSignupStep2Page from "@/features/auth/pages/RetailerSignupStep2Page";
import RetailerPricingPage from "@/features/auth/pages/RetailerPricingPage";
import RetailerPaymentPage from "@/features/auth/pages/RetailerPaymentPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";

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
import { CustomerForgotPasswordPage } from "@/features/customer/pages/CustomerForgotPasswordPage";
import { CustomerResetPasswordPage } from "@/features/customer/pages/CustomerResetPasswordPage";

import { CustomerLayout } from "@/features/customer/layouts/CustomerLayout";
import { CustomerHomePage } from "@/features/customer/pages/CustomerHomePage";
import { CustomerShopPage } from "@/features/customer/pages/CustomerShopPage";
import { CustomerProductDetailsPage } from "@/features/customer/pages/CustomerProductDetailsPage";
import { CustomerFavoritesPage } from "@/features/customer/pages/CustomerFavoritesPage";
import { CustomerTryOnPage } from "@/features/customer/try-on/pages/CustomerTryOnPage";
import { CustomerTryOnHistoryPage } from "@/features/customer/try-on/pages/CustomerTryOnHistoryPage";

import { CustomerAccountPage } from "@/features/customer/pages/CustomerAccountPage";
import { CustomerAddressesPage } from "@/features/customer/pages/CustomerAddressesPage";
import { CustomerAvatarPage } from "@/features/customer/pages/CustomerAvatarPage";
import { CustomerAvatarManualPage } from "@/features/customer/pages/CustomerAvatarManualPage";
import { CustomerAvatarPhotoPage } from "@/features/customer/pages/CustomerAvatarPhotoPage";
import { CustomerCartPage } from "@/features/customer/cart/pages/CustomerCartPage";
import { CustomerCheckoutPage } from "@/features/customer/cart/pages/CustomerCheckoutPage";
import { CustomerOutfitsPage } from "@/features/customer/pages/CustomerOutfitsPage";
import { CustomerAiSuggestionsPage } from "@/features/customer/pages/CustomerAiSuggestionsPage";
import { CustomerComparePage } from "@/features/customer/pages/CustomerComparePage";
import { CustomerAboutPage } from "@/features/customer/pages/CustomerAboutPage";
import { CustomerShippingReturnsPage } from "@/features/customer/pages/CustomerShippingReturnsPage";
import { CustomerBlogPage } from "@/features/customer/pages/CustomerBlogPage";

import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RoleSelectionPage />,
  },

  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <Navigate to="/login/retailer" replace />,
      },
      {
        path: "/login/retailer",
        element: <RetailerLoginPage />,
      },
      {
        path: "/signup/retailer",
        element: <RetailerSignupStep1Page />,
      },
      {
        path: "/signup/retailer/step-2",
        element: <RetailerSignupStep2Page />,
      },
      {
        path: "/signup/retailer/pricing",
        element: <RetailerPricingPage />,
      },
      {
        path: "/signup/retailer/payment",
        element: <RetailerPaymentPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: CUSTOMER_ROUTES.login,
        element: <CustomerLoginPage />,
      },
      {
        path: CUSTOMER_ROUTES.signup,
        element: <CustomerSignupPage />,
      },
      {
        path: CUSTOMER_ROUTES.forgotPassword,
        element: <CustomerForgotPasswordPage />,
      },
      {
        path: CUSTOMER_ROUTES.resetPassword,
        element: <CustomerResetPasswordPage />,
      },
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
          {
            index: true,
            element: <RetailerDashboardPage />,
          },
          {
            path: "offers",
            element: <RetailerOffersPage />,
          },
          {
            path: "categories",
            element: <RetailerCategoriesPage />,
          },
          {
            path: "products",
            element: <RetailerProductsListPage />,
          },
          {
            path: "orders",
            element: <RetailerOrdersPage />,
          },
          {
            path: "inventory",
            element: <RetailerInventoryPage />,
          },
          {
            path: "pricing",
            element: <RetailerEditPricingPage />,
          },
          {
            path: "help",
            element: <RetailerHelpPage />,
          },
          {
            path: "settings",
            element: <RetailerSettingsPage />,
          },
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
          {
            index: true,
            element: <Navigate to={CUSTOMER_ROUTES.home} replace />,
          },
          {
            path: "dashboard",
            element: <Navigate to={CUSTOMER_ROUTES.home} replace />,
          },
          {
            path: "home",
            element: <CustomerHomePage />,
          },
          {
            path: "shop",
            element: <CustomerShopPage />,
          },
          {
            path: "products/:productId",
            element: <CustomerProductDetailsPage />,
          },
          {
            path: "try-on",
            element: <CustomerTryOnPage />,
          },
          {
            path: "try-on/history",
            element: <CustomerTryOnHistoryPage />,
          },
          {
            path: "try-on/:productId",
            element: <CustomerTryOnPage />,
          },
          {
            path: "favorites",
            element: <CustomerFavoritesPage />,
          },
          {
            path: "account",
            element: <CustomerAccountPage />,
          },
          {
            path: "account/addresses",
            element: <CustomerAddressesPage />,
          },
          {
            path: "avatar",
            element: <CustomerAvatarPage />,
          },
          {
            path: "avatar/manual",
            element: <CustomerAvatarManualPage />,
          },
          {
            path: "avatar/photo",
            element: <CustomerAvatarPhotoPage />,
          },
          {
            path: "cart",
            element: <CustomerCartPage />,
          },
          {
            path: "checkout",
            element: <CustomerCheckoutPage />,
          },
          {
            path: "outfits",
            element: <CustomerOutfitsPage />,
          },
          {
            path: "ai-suggestions",
            element: <CustomerAiSuggestionsPage />,
          },
          {
            path: "compare",
            element: <CustomerComparePage />,
          },
          {
            path: "about",
            element: <CustomerAboutPage />,
          },
          {
            path: "shipping-returns",
            element: <CustomerShippingReturnsPage />,
          },
          {
            path: "blog",
            element: <CustomerBlogPage />,
          },
        ],
      },

      {
        path: "/admin",
        element: <ComingSoonPage />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
