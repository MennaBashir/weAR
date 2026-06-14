/**
 * Wardrobe Collections query hooks — Command 20
 *
 * customerId sourced exclusively from authenticated Customer state.
 * Queries disabled without authenticated Customer ID.
 * Does NOT invalidate Favorites or Saved Outfits caches.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { selectCustomerId } from "@/features/customer/utils/customerSelectors";
import { wardrobeCollectionsApi } from "@/features/customer/api/wardrobeCollections.api";
import type {
  CreateWardrobeCollectionPayload,
  RenameWardrobeCollectionPayload,
  AddWardrobeCollectionItemPayload,
} from "@/features/customer/types/wardrobeCollections.types";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const wardrobeCollectionKeys = {
  all: ["customer", "wardrobeCollections"] as const,

  lists: (customerId: string | null) =>
    [...wardrobeCollectionKeys.all, customerId, "list"] as const,

  list: (customerId: string | null, pageNumber: number, pageSize: number) =>
    [...wardrobeCollectionKeys.lists(customerId), { pageNumber, pageSize }] as const,

  itemLists: (customerId: string | null, collectionId: string) =>
    [...wardrobeCollectionKeys.all, customerId, collectionId, "items"] as const,

  itemList: (
    customerId: string | null,
    collectionId: string,
    pageNumber: number,
    pageSize: number,
  ) =>
    [
      ...wardrobeCollectionKeys.itemLists(customerId, collectionId),
      { pageNumber, pageSize },
    ] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const useWardrobeCollections = (pageNumber = 1, pageSize = 10) => {
  const customerId = useAuthStore(selectCustomerId);

  return useQuery({
    queryKey: wardrobeCollectionKeys.list(customerId, pageNumber, pageSize),
    queryFn: () =>
      wardrobeCollectionsApi.listCollections(customerId ?? "", {
        pageNumber,
        pageSize,
      }),
    enabled: !!customerId,
  });
};

export const useCreateWardrobeCollection = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWardrobeCollectionPayload) => {
      if (!customerId) throw new Error("Customer session is required");
      return wardrobeCollectionsApi.createCollection(customerId, payload);
    },
    onSuccess: () => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.lists(customerId),
      });
    },
  });
};

export const useRenameWardrobeCollection = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      payload,
    }: {
      collectionId: string;
      payload: RenameWardrobeCollectionPayload;
    }) => {
      if (!customerId) throw new Error("Customer session is required");
      return wardrobeCollectionsApi.renameCollection(
        customerId,
        collectionId,
        payload,
      );
    },
    onSuccess: (_data, { collectionId }) => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.lists(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.itemLists(customerId, collectionId),
      });
    },
  });
};

export const useDeleteWardrobeCollection = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => {
      if (!customerId) throw new Error("Customer session is required");
      return wardrobeCollectionsApi.deleteCollection(customerId, collectionId);
    },
    onSuccess: (_data, collectionId) => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.lists(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.itemLists(customerId, collectionId),
      });
    },
  });
};

export const useWardrobeCollectionItems = (
  collectionId: string,
  pageNumber = 1,
  pageSize = 10,
) => {
  const customerId = useAuthStore(selectCustomerId);

  return useQuery({
    queryKey: wardrobeCollectionKeys.itemList(
      customerId,
      collectionId,
      pageNumber,
      pageSize,
    ),
    queryFn: () =>
      wardrobeCollectionsApi.listCollectionItems(
        customerId ?? "",
        collectionId,
        { pageNumber, pageSize },
      ),
    enabled: !!customerId && !!collectionId,
  });
};

export const useAddWardrobeCollectionItem = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      payload,
    }: {
      collectionId: string;
      payload: AddWardrobeCollectionItemPayload;
    }) => {
      if (!customerId) throw new Error("Customer session is required");
      return wardrobeCollectionsApi.addCollectionItem(
        customerId,
        collectionId,
        payload,
      );
    },
    onSuccess: (_data, { collectionId }) => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.itemLists(customerId, collectionId),
      });
      // Also refresh collection list to update itemCount
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.lists(customerId),
      });
    },
  });
};

export const useRemoveWardrobeCollectionItem = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      itemId,
    }: {
      collectionId: string;
      itemId: string;
    }) => {
      if (!customerId) throw new Error("Customer session is required");
      return wardrobeCollectionsApi.removeCollectionItem(
        customerId,
        collectionId,
        itemId,
      );
    },
    onSuccess: (_data, { collectionId }) => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.itemLists(customerId, collectionId),
      });
      // Also refresh collection list to update itemCount
      queryClient.invalidateQueries({
        queryKey: wardrobeCollectionKeys.lists(customerId),
      });
    },
  });
};
