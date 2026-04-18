import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "retailer" | "customer" | "admin";

export interface RetailerData {
  companyName: string;
  planName: string;
  planPrice: string;
  billingCycle: string;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  retailerData?: RetailerData;
};

type AuthState = {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  login: (payload: AuthUser) => void;
  updateUser: (payload: Partial<AuthUser>) => void;
  logout: () => void;
};

const STORAGE_KEY = "wear-auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      login: (user) => {
        set({
          user,
          role: user.role,
          isAuthenticated: true,
        });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      logout: () => {
        set({
          user: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({
        user: s.user,
        role: s.role,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectRole = (s: AuthState) => s.role;
export const selectUser = (s: AuthState) => s.user;
export const selectHasHydrated = (s: AuthState) => s.hasHydrated;

export const getHomePathForRole = (role: UserRole): string => {
  switch (role) {
    case "retailer":
      return "/retailer";
    case "customer":
      return "/customer/dashboard";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
};

export const isRoleAllowedForPath = (
  role: UserRole,
  pathname: string,
): boolean => {
  if (pathname.startsWith("/retailer")) return role === "retailer";
  if (pathname.startsWith("/customer")) return role === "customer";
  if (pathname.startsWith("/admin")) return role === "admin";
  return true;
};
