import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "retailer" | "customer" | "admin";

export interface RetailerProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  brandName: string;
  businessType: string;
  has3DModels?: boolean;
  avatarUrl?: string | null;
  brandLogoUrl?: string | null;
  accountStatus?: string;
  isEmailVerified?: boolean;
  subscriptionId?: string | null;
  availableBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthState = {
  user: RetailerProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  login: (profile: RetailerProfile, tokens: { accessToken: string; refreshToken: string }, role: UserRole) => void;
  updateUser: (payload: Partial<RetailerProfile>) => void;
  logout: () => void;
};

const STORAGE_KEY = "wear-auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      login: (profile, tokens, role) => {
        set({
          user: profile,
          role: role,
          isAuthenticated: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
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
          accessToken: null,
          refreshToken: null,
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
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// selectors
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectRole = (s: AuthState) => s.role;
export const selectUser = (s: AuthState) => s.user;
export const selectHasHydrated = (s: AuthState) => s.hasHydrated;

export const getHomePathForRole = (role: UserRole): string => {
  switch (role) {
    case "retailer":
      return "/retailer";
    case "customer":
      return "/customer/home";
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