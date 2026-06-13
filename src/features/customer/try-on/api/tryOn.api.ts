import { apiClient } from "@/lib/axios";
import { unwrapCustomerApiData, unwrapCustomerApiList } from "@/features/customer/api/customerApiUtils";
import type { CreateTryOnSessionPayload, TryOnSession } from "@/features/customer/try-on/types/tryOn";

export const tryOnApi = {
  createSession: async (customerId: string, payload: CreateTryOnSessionPayload): Promise<TryOnSession> => {
    const response = await apiClient.post(`/api/customers/${customerId}/try-on`, payload);
    return unwrapCustomerApiData<TryOnSession>(response.data);
  },
  listSessions: async (customerId: string, signal?: AbortSignal): Promise<TryOnSession[]> => {
    const response = await apiClient.get(`/api/customers/${customerId}/try-on/sessions`, { signal });
    return unwrapCustomerApiList<TryOnSession>(response.data);
  },
  getSession: async (customerId: string, sessionId: string, signal?: AbortSignal): Promise<TryOnSession> => {
    const response = await apiClient.get(`/api/customers/${customerId}/try-on/sessions/${sessionId}`, { signal });
    return unwrapCustomerApiData<TryOnSession>(response.data);
  },
  getProductSessions: async (customerId: string, productId: string, signal?: AbortSignal): Promise<TryOnSession[]> => {
    const response = await apiClient.get(`/api/customers/${customerId}/products/${productId}/sessions`, { signal });
    return unwrapCustomerApiList<TryOnSession>(response.data);
  },
};
