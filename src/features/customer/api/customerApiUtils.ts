import type { ApiEnvelope } from "@/features/customer/types/customer";

export type CustomerApiListEnvelope<T> =
  | ApiEnvelope<T>
  | ApiEnvelope<ApiEnvelope<T>>
  | T;

export const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const unwrapCustomerApiData = <T>(
  payload: CustomerApiListEnvelope<T>,
): T => {
  if (!isRecord(payload) || !("data" in payload)) {
    return payload as T;
  }

  const data = payload.data;

  if (isRecord(data) && "data" in data) {
    return data.data as T;
  }

  return data as T;
};

/**
 * Normalizes list endpoints that may return:
 *
 * - a direct array
 * - { data: [...] }
 * - { data: { data: [...] } }
 * - { data: { items: [...] } }
 * - { items: [...] }
 * - casing variants such as Items or Results
 *
 * Malformed or unsupported responses safely return an empty array.
 */
export const unwrapCustomerApiList = <T>(payload: unknown): T[] => {
  const unwrapped = unwrapCustomerApiData<unknown>(
    payload as CustomerApiListEnvelope<unknown>,
  );

  if (Array.isArray(unwrapped)) {
    return unwrapped as T[];
  }

  if (!isRecord(unwrapped)) {
    return [];
  }

  const candidates: unknown[] = [
    unwrapped.items,
    unwrapped.Items,
    unwrapped.results,
    unwrapped.Results,
    unwrapped.data,
    unwrapped.Data,
  ];

  const list = candidates.find((candidate) => Array.isArray(candidate));

  return Array.isArray(list) ? (list as T[]) : [];
};

export const stripEmptyParams = <T extends Record<string, unknown>>(
  params: T,
): Partial<T> =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === "") {
        return false;
      }

      if (Array.isArray(value) && value.length === 0) {
        return false;
      }

      return true;
    }),
  ) as Partial<T>;
