import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { selectCustomerId } from "@/features/customer/utils/customerSelectors";
import { tryOnApi } from "@/features/customer/try-on/api/tryOn.api";
import type { CreateTryOnSessionPayload } from "@/features/customer/try-on/types/tryOn";

export const customerTryOnKeys = {
  all: ["customer", "try-on"] as const,
  sessions: (customerId: string | null) => [...customerTryOnKeys.all, customerId, "sessions"] as const,
  session: (customerId: string | null, sessionId: string | null | undefined) => [...customerTryOnKeys.sessions(customerId), sessionId] as const,
  productSessions: (customerId: string | null, productId: string | null | undefined) => [...customerTryOnKeys.all, customerId, "products", productId, "sessions"] as const,
};

const useRequiredCustomerId = () => {
  const customerId = useAuthStore(selectCustomerId);
  const requireCustomerId = () => {
    if (!customerId) throw new Error("Customer session is required");
    return customerId;
  };
  return { customerId, requireCustomerId };
};

export const useCreateTryOnSession = () => {
  const { customerId, requireCustomerId } = useRequiredCustomerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTryOnSessionPayload) => tryOnApi.createSession(requireCustomerId(), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerTryOnKeys.sessions(customerId) }),
  });
};

export const useCustomerTryOnSessions = () => {
  const { customerId } = useRequiredCustomerId();
  return useQuery({ queryKey: customerTryOnKeys.sessions(customerId), queryFn: ({ signal }) => tryOnApi.listSessions(customerId ?? "", signal), enabled: !!customerId });
};

export const useCustomerTryOnSession = (sessionId: string | null | undefined) => {
  const { customerId } = useRequiredCustomerId();
  return useQuery({ queryKey: customerTryOnKeys.session(customerId, sessionId), queryFn: ({ signal }) => tryOnApi.getSession(customerId ?? "", sessionId ?? "", signal), enabled: !!customerId && !!sessionId });
};

export const useProductTryOnSessions = (productId: string | null | undefined) => {
  const { customerId } = useRequiredCustomerId();
  return useQuery({ queryKey: customerTryOnKeys.productSessions(customerId, productId), queryFn: ({ signal }) => tryOnApi.getProductSessions(customerId ?? "", productId ?? "", signal), enabled: !!customerId && !!productId });
};
