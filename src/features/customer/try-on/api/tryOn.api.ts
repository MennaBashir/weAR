import { apiClient } from "@/lib/axios";
import { unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import type { PaginatedCustomerResponse } from "@/features/customer/api/profileAvatar.api";
import type { CreateTryOnSessionPayload, TryOnSession } from "@/features/customer/try-on/types/tryOn";

type TryOnSessionResponse = Partial<TryOnSession> & {
  id: string;
  productId: string;
  confidenceScore?: number | null;
  durationSeconds?: number | null;
};

type TryOnSessionsPage = Partial<PaginatedCustomerResponse<TryOnSessionResponse>>;

const normalizeTryOnSession = (session: TryOnSessionResponse): TryOnSession => ({
  ...session,
  id: session.id,
  customerId: session.customerId ?? undefined,
  productId: session.productId,
  retailerId: session.retailerId ?? null,
  avatarId: session.avatarId ?? null,
  sessionType: session.sessionType,
  status: session.status ?? null,
  resultImageUrl: session.resultImageUrl ?? null,
  recommendedSize: session.recommendedSize ?? session.sizeRecommendation ?? null,
  confidenceScore: session.confidenceScore ?? null,
  durationSeconds: session.durationSeconds ?? null,
  createdAt: session.createdAt ?? null,
});

const normalizeTryOnPage = (payload: TryOnSessionResponse[] | TryOnSessionsPage) => {
  if (Array.isArray(payload)) return payload.map(normalizeTryOnSession);

  return {
    items: (payload.items ?? []).map(normalizeTryOnSession),
    pageNumber: payload.pageNumber,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
    totalPages: payload.totalPages,
    hasPreviousPage: payload.hasPreviousPage,
    hasNextPage: payload.hasNextPage,
  };
};

export const tryOnApi = {
  createSession: async (customerId: string, payload: CreateTryOnSessionPayload): Promise<TryOnSession> => {
    const response = await apiClient.post(`/api/customers/${customerId}/try-on`, payload);
    return normalizeTryOnSession(unwrapCustomerApiData<TryOnSessionResponse>(response.data));
  },
  listSessions: async (customerId: string, signal?: AbortSignal): Promise<TryOnSession[] | PaginatedCustomerResponse<TryOnSession>> => {
    const response = await apiClient.get(`/api/customers/${customerId}/try-on/sessions`, { signal });
    return normalizeTryOnPage(unwrapCustomerApiData<TryOnSessionResponse[] | TryOnSessionsPage>(response.data));
  },
  getSession: async (customerId: string, sessionId: string, signal?: AbortSignal): Promise<TryOnSession> => {
    const response = await apiClient.get(`/api/customers/${customerId}/try-on/sessions/${sessionId}`, { signal });
    return normalizeTryOnSession(unwrapCustomerApiData<TryOnSessionResponse>(response.data));
  },
  getProductSessions: async (customerId: string, productId: string, signal?: AbortSignal): Promise<TryOnSession[] | PaginatedCustomerResponse<TryOnSession>> => {
    const response = await apiClient.get(`/api/customers/${customerId}/products/${productId}/sessions`, { signal });
    return normalizeTryOnPage(unwrapCustomerApiData<TryOnSessionResponse[] | TryOnSessionsPage>(response.data));
  },
};
