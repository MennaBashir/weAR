import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressesApi, avatarApi, profileApi } from "@/features/customer/api/profileAvatar.api";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { selectCustomerId } from "@/features/customer/utils/customerSelectors";
import type { BodyMeasurements, ChangeCustomerPasswordPayload, CustomerAddressPayload, DeleteCustomerAccountPayload, ExtractAvatarFromImageInput, UpdateCustomerProfilePayload } from "@/features/customer/types/profileAvatar";

export const customerProfileKeys = {
  all: ["customer", "profile"] as const,
  detail: () => [...customerProfileKeys.all, "detail"] as const,
};

export const customerAddressKeys = {
  all: ["customer", "addresses"] as const,
  lists: () => [...customerAddressKeys.all, "list"] as const,
  detail: (id: string | null | undefined) => [...customerAddressKeys.all, "detail", id] as const,
};

export const customerAvatarKeys = {
  all: ["customer", "avatar"] as const,
  detail: (customerId: string | null) => [...customerAvatarKeys.all, customerId, "detail"] as const,
  history: (customerId: string | null) => [...customerAvatarKeys.all, customerId, "history"] as const,
  sizeRecommendation: (customerId: string | null, productId: string | null | undefined) =>
    [...customerAvatarKeys.all, customerId, "size-recommendation", productId] as const,
};

export const useCustomerProfile = () =>
  useQuery({ queryKey: customerProfileKeys.detail(), queryFn: ({ signal }) => profileApi.getProfile(signal) });

export const useUpdateCustomerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomerProfilePayload) => profileApi.updateProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerProfileKeys.all }),
  });
};

export const useChangeCustomerPassword = () =>
  useMutation({ mutationFn: (payload: ChangeCustomerPasswordPayload) => profileApi.changePassword(payload) });

export const useDeleteCustomerAccount = () =>
  useMutation({ mutationFn: (payload: DeleteCustomerAccountPayload) => profileApi.deleteAccount(payload) });

export const useCustomerAddresses = () =>
  useQuery({ queryKey: customerAddressKeys.lists(), queryFn: ({ signal }) => addressesApi.list(signal) });

export const useCustomerAddress = (id: string | null | undefined) =>
  useQuery({ queryKey: customerAddressKeys.detail(id), queryFn: ({ signal }) => addressesApi.get(id ?? "", signal), enabled: !!id });

export const useCreateCustomerAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerAddressPayload) => addressesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerAddressKeys.all }),
  });
};

export const useUpdateCustomerAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerAddressPayload }) => addressesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerAddressKeys.all });
      queryClient.invalidateQueries({ queryKey: customerAddressKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCustomerAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: addressesApi.delete, onSuccess: () => queryClient.invalidateQueries({ queryKey: customerAddressKeys.all }) });
};

export const useSetDefaultCustomerAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: addressesApi.setDefault, onSuccess: () => queryClient.invalidateQueries({ queryKey: customerAddressKeys.all }) });
};

const useRequiredCustomerId = () => {
  const customerId = useAuthStore(selectCustomerId);
  const requireCustomerId = () => {
    if (!customerId) throw new Error("Customer session is required");
    return customerId;
  };
  return { customerId, requireCustomerId };
};

export const useCustomerAvatar = () => {
  const { customerId } = useRequiredCustomerId();
  return useQuery({ queryKey: customerAvatarKeys.detail(customerId), queryFn: ({ signal }) => avatarApi.getAvatar(customerId ?? "", signal), enabled: !!customerId });
};

export const useCreateCustomerAvatar = () => {
  const { customerId, requireCustomerId } = useRequiredCustomerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (measurements: BodyMeasurements) => avatarApi.createAvatar(requireCustomerId(), measurements),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerAvatarKeys.detail(customerId) }),
        queryClient.invalidateQueries({ queryKey: customerAvatarKeys.history(customerId) }),
      ]);
      await queryClient.refetchQueries({ queryKey: customerAvatarKeys.detail(customerId) });
    },
  });
};

export const useDeleteCustomerAvatar = () => {
  const { customerId, requireCustomerId } = useRequiredCustomerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const active = queryClient.getQueryData<{ id: string } | null>(customerAvatarKeys.detail(customerId));
      if (!active?.id) throw new Error("Active avatar is required");
      return avatarApi.deleteAvatar(requireCustomerId(), active.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerAvatarKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerAvatarKeys.history(customerId) });
      queryClient.invalidateQueries({ queryKey: [...customerAvatarKeys.all, customerId, "size-recommendation"] });
    },
  });
};

export const useCustomerAvatarHistory = () => {
  const { customerId } = useRequiredCustomerId();
  return useQuery({ queryKey: customerAvatarKeys.history(customerId), queryFn: ({ signal }) => avatarApi.getHistory(customerId ?? "", signal), enabled: !!customerId });
};

export const useUpdateCustomerAvatarMeasurements = () => {
  const { customerId, requireCustomerId } = useRequiredCustomerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (measurements: BodyMeasurements) => {
      const active = queryClient.getQueryData<{ id: string } | null>(customerAvatarKeys.detail(customerId));
      if (!active?.id) throw new Error("Active avatar is required");
      return avatarApi.updateMeasurements(requireCustomerId(), active.id, measurements);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerAvatarKeys.detail(customerId) }),
        queryClient.invalidateQueries({ queryKey: customerAvatarKeys.history(customerId) }),
      ]);
      await queryClient.refetchQueries({ queryKey: customerAvatarKeys.detail(customerId) });
    },
  });
};

export const useCustomerSizeRecommendation = (productId: string | null | undefined) => {
  const { customerId } = useRequiredCustomerId();
  return useQuery({ queryKey: customerAvatarKeys.sizeRecommendation(customerId, productId), queryFn: ({ signal }) => avatarApi.getSizeRecommendation(customerId ?? "", productId ?? "", signal), enabled: !!customerId && !!productId });
};

export const useExtractCustomerAvatarFromImage = () => {
  const { customerId, requireCustomerId } = useRequiredCustomerId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExtractAvatarFromImageInput) => avatarApi.extractFromImage(requireCustomerId(), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerAvatarKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerAvatarKeys.history(customerId) });
    },
  });
};
