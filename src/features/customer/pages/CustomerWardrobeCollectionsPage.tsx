import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Image,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import {
  useWardrobeCollections,
  useCreateWardrobeCollection,
  useDeleteWardrobeCollection,
  useWardrobeCollectionItems,
  useRemoveWardrobeCollectionItem,
} from "@/features/customer/queries/wardrobeCollections.queries";
import { WardrobeCollectionApiError } from "@/features/customer/api/wardrobeCollections.api";
import type {
  WardrobeCollectionSummary,
  WardrobeCollectionItem,
} from "@/features/customer/types/wardrobeCollections.types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Collection card
// ---------------------------------------------------------------------------

interface CollectionCardProps {
  collection: WardrobeCollectionSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (collection: WardrobeCollectionSummary) => void;
}

function CollectionCard({
  collection,
  isSelected,
  onSelect,
  onDelete,
}: CollectionCardProps) {
  return (
    <article
      className={cn(
        customerTheme.card,
        "flex flex-col gap-4 p-5 cursor-pointer transition-all",
        isSelected && "ring-2 ring-[#A37E6B]",
      )}
      aria-label={collection.name}
      aria-pressed={isSelected}
      onClick={() => onSelect(collection.id)}
    >
      {collection.coverImageUrl ? (
        <img
          src={collection.coverImageUrl}
          alt=""
          className="aspect-video w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-[#F4EDE7]">
          <FolderOpen className="h-10 w-10 text-[#C4A99A]" aria-hidden="true" />
        </div>
      )}

      <div className="flex-1">
        <h2 className="text-base font-semibold text-[#2F2925]">{collection.name}</h2>
        {collection.description && (
          <p className="mt-0.5 text-sm text-[#6F625B] line-clamp-2">
            {collection.description}
          </p>
        )}
        {collection.itemCount != null && (
          <p className="mt-1 text-sm text-[#A37E6B]">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-center rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(collection);
        }}
        aria-label={`Delete collection ${collection.name}`}
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Delete
      </Button>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Collection item card
// ---------------------------------------------------------------------------

interface CollectionItemCardProps {
  item: WardrobeCollectionItem;
  onRemove: (item: WardrobeCollectionItem) => void;
}

function CollectionItemCard({ item, onRemove }: CollectionItemCardProps) {
  return (
    <article
      className={cn(customerTheme.card, "flex flex-col gap-3 p-4")}
      aria-label={item.productName ?? "Collection item"}
    >
      {item.primaryImageUrl ? (
        <img
          src={item.primaryImageUrl}
          alt={item.productName ?? ""}
          className="aspect-square w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center rounded-lg bg-[#F4EDE7]">
          <Image className="h-8 w-8 text-[#C4A99A]" aria-hidden="true" />
        </div>
      )}

      <div className="flex-1">
        <p className="text-sm font-medium text-[#2F2925] line-clamp-2">
          {item.productName ?? "Product"}
        </p>
        {item.price != null && (
          <p className="mt-0.5 text-sm text-[#A37E6B]">
            ${item.price.toFixed(2)}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-center rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${item.productName ?? "item"} from collection`}
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Remove
      </Button>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Create collection form
// ---------------------------------------------------------------------------

interface CreateCollectionFormProps {
  onClose: () => void;
}

function CreateCollectionForm({ onClose }: CreateCollectionFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const createMutation = useCreateWardrobeCollection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: "error", message: "Collection name is required." });
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
      });
      setFeedback({ type: "success", message: "Collection created successfully." });
      setTimeout(onClose, 1200);
    } catch (err) {
      const message =
        err instanceof WardrobeCollectionApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Collection creation failed. Please try again.";
      setFeedback({ type: "error", message });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create collection"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className={cn(customerTheme.card, "w-full max-w-md p-6")}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#2F2925]">Create Collection</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
            aria-label="Close create collection form"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="collection-name"
              className="mb-1 block text-sm font-medium text-[#2F2925]"
            >
              Name <span aria-hidden="true">*</span>
            </label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Wardrobe"
              required
            />
          </div>

          <div>
            <label
              htmlFor="collection-description"
              className="mb-1 block text-sm font-medium text-[#2F2925]"
            >
              Description (optional)
            </label>
            <Input
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Light and airy pieces for warm days"
            />
          </div>

          {feedback && (
            <p
              role={feedback.type === "error" ? "alert" : "status"}
              className={cn(
                "rounded-lg p-3 text-sm",
                feedback.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-700",
              )}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create Collection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
  collection: WardrobeCollectionSummary;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirmDialog({
  collection,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm collection deletion"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className={cn(customerTheme.card, "w-full max-w-sm p-6")}>
        <div className="mb-3 flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold text-[#2F2925]">Delete collection?</h2>
        </div>
        <p className="text-sm text-[#6F625B]">
          Are you sure you want to delete{" "}
          <strong>{collection.name}</strong>? This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 rounded-full"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remove item confirmation dialog
// ---------------------------------------------------------------------------

interface RemoveItemConfirmProps {
  item: WardrobeCollectionItem;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function RemoveItemConfirmDialog({
  item,
  onConfirm,
  onCancel,
  isPending,
}: RemoveItemConfirmProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm item removal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className={cn(customerTheme.card, "w-full max-w-sm p-6")}>
        <h2 className="text-lg font-semibold text-[#2F2925]">Remove item?</h2>
        <p className="mt-2 text-sm text-[#6F625B]">
          Remove <strong>{item.productName ?? "this item"}</strong> from the collection?
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 rounded-full"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collection items panel
// ---------------------------------------------------------------------------

interface CollectionItemsPanelProps {
  collection: WardrobeCollectionSummary;
  onClose: () => void;
}

function CollectionItemsPanel({ collection, onClose }: CollectionItemsPanelProps) {
  const [itemPage, setItemPage] = useState(1);
  const ITEM_PAGE_SIZE = 12;
  const [pendingRemove, setPendingRemove] = useState<WardrobeCollectionItem | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);

  const itemsQuery = useWardrobeCollectionItems(collection.id, itemPage, ITEM_PAGE_SIZE);
  const removeMutation = useRemoveWardrobeCollectionItem();

  const items = itemsQuery.data?.items ?? [];
  const itemTotalPages = itemsQuery.data?.totalPages ?? 0;
  const itemHasNext = itemsQuery.data?.hasNextPage ?? false;
  const itemHasPrev = itemsQuery.data?.hasPreviousPage ?? false;

  const handleRemoveClick = (item: WardrobeCollectionItem) => {
    setRemoveError(null);
    setRemoveSuccess(null);
    setPendingRemove(item);
  };

  const handleRemoveConfirm = async () => {
    if (!pendingRemove) return;
    try {
      await removeMutation.mutateAsync({
        collectionId: collection.id,
        itemId: pendingRemove.id,
      });
      setRemoveSuccess(`"${pendingRemove.productName ?? "Item"}" removed.`);
      setPendingRemove(null);
    } catch {
      setRemoveError("Could not remove the item. Please try again.");
      setPendingRemove(null);
    }
  };

  return (
    <>
      {pendingRemove && (
        <RemoveItemConfirmDialog
          item={pendingRemove}
          onConfirm={() => void handleRemoveConfirm()}
          onCancel={() => setPendingRemove(null)}
          isPending={removeMutation.isPending}
        />
      )}

      <section aria-label={`Items in ${collection.name}`} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
              Collection
            </p>
            <h2 className="text-2xl font-semibold text-[#2F2925]">{collection.name}</h2>
            {collection.description && (
              <p className="mt-1 text-sm text-[#6F625B]">{collection.description}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onClose}
            aria-label="Close collection items view"
          >
            <X className="mr-2 h-4 w-4" aria-hidden="true" />
            Close
          </Button>
        </div>

        {removeSuccess && (
          <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {removeSuccess}
          </p>
        )}
        {removeError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {removeError}
          </p>
        )}

        {itemsQuery.isLoading && (
          <p aria-busy="true" className="text-sm text-[#6F625B]">
            Loading items…
          </p>
        )}

        {itemsQuery.isError && (
          <div className="rounded-lg bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">Could not load collection items.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-full"
              onClick={() => void itemsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 && (
          <div
            className={cn(customerTheme.card, "p-8 text-center")}
            role="status"
            aria-label="No items in collection"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EDE7] text-[#A37E6B]">
              <FolderOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#2F2925]">
              No items in this collection
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#6F625B]">
              This collection is empty. Add products to organize your wardrobe.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div
              className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              role="list"
              aria-label="Collection items"
            >
              {items.map((item) => (
                <div key={item.id} role="listitem">
                  <CollectionItemCard item={item} onRemove={handleRemoveClick} />
                </div>
              ))}
            </div>

            {itemTotalPages > 1 && (
              <nav
                aria-label="Collection items pagination"
                className="flex items-center justify-center gap-4"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={!itemHasPrev}
                  onClick={() => setItemPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous items page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span className="text-sm text-[#6F625B]">
                  Page {itemPage} of {itemTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={!itemHasNext}
                  onClick={() => setItemPage((p) => p + 1)}
                  aria-label="Next items page"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CustomerWardrobeCollectionsPage() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WardrobeCollectionSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] =
    useState<WardrobeCollectionSummary | null>(null);

  const query = useWardrobeCollections(page, PAGE_SIZE);
  const deleteMutation = useDeleteWardrobeCollection();

  const collections = query.data?.items ?? [];
  const totalPages = query.data?.totalPages ?? 0;
  const hasNext = query.data?.hasNextPage ?? false;
  const hasPrev = query.data?.hasPreviousPage ?? false;

  const handleDeleteClick = (collection: WardrobeCollectionSummary) => {
    setDeleteError(null);
    setDeleteSuccess(null);
    setPendingDelete(collection);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      setDeleteSuccess(`"${pendingDelete.name}" deleted.`);
      if (selectedCollection?.id === pendingDelete.id) {
        setSelectedCollection(null);
      }
      setPendingDelete(null);
    } catch {
      setDeleteError("Could not delete the collection. Please try again.");
      setPendingDelete(null);
    }
  };

  const handleSelectCollection = (id: string) => {
    const collection = collections.find((c) => c.id === id) ?? null;
    setSelectedCollection((prev) => (prev?.id === id ? null : collection));
  };

  // ---- loading ----
  if (query.isLoading) {
    return (
      <section
        className={cn(customerTheme.card, "p-8")}
        aria-busy="true"
        aria-label="Loading collections"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          Wardrobe
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">
          Loading your collections…
        </h1>
      </section>
    );
  }

  // ---- error ----
  if (query.isError) {
    return (
      <section className={cn(customerTheme.card, "p-8")} role="alert">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          Wardrobe
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">
          Could not load collections
        </h1>
        <p className="mt-3 max-w-2xl text-[#6F625B]">
          Your collections are still safe. Refresh the page or try again later.
        </p>
        <Button
          type="button"
          className="mt-5 rounded-full"
          onClick={() => void query.refetch()}
        >
          Try Again
        </Button>
      </section>
    );
  }

  return (
    <>
      {/* Create collection form modal */}
      {showCreateForm && (
        <CreateCollectionForm onClose={() => setShowCreateForm(false)} />
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <DeleteConfirmDialog
          collection={pendingDelete}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setPendingDelete(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      <div className="space-y-8">
        {/* Collections section */}
        <section className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
                Wardrobe
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-[#2F2925]">
                My Collections
              </h1>
              {query.data && (
                <p className="mt-2 text-[#6F625B]">
                  {query.data.totalCount}{" "}
                  {query.data.totalCount === 1 ? "collection" : "collections"}
                </p>
              )}
            </div>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Collection
            </Button>
          </div>

          {/* Feedback */}
          {deleteSuccess && (
            <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              {deleteSuccess}
            </p>
          )}
          {deleteError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {deleteError}
            </p>
          )}

          {/* Empty state */}
          {collections.length === 0 ? (
            <div
              className={cn(customerTheme.card, "p-10 text-center")}
              role="status"
              aria-label="No collections"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4EDE7] text-[#A37E6B]">
                <FolderOpen className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
                Wardrobe
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#2F2925]">
                No collections yet
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[#6F625B]">
                Organize your wardrobe by creating collections. Group your favorite
                products by season, occasion, or style.
              </p>
              <Button
                type="button"
                className="mt-6 rounded-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Create your first collection
              </Button>
            </div>
          ) : (
            <>
              {/* Collection grid */}
              <div
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                role="list"
                aria-label="Wardrobe collections"
              >
                {collections.map((collection) => (
                  <div key={collection.id} role="listitem">
                    <CollectionCard
                      collection={collection}
                      isSelected={selectedCollection?.id === collection.id}
                      onSelect={handleSelectCollection}
                      onDelete={handleDeleteClick}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="Collections pagination"
                  className="flex items-center justify-center gap-4"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={!hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span className="text-sm text-[#6F625B]">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={!hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>

        {/* Selected collection items panel */}
        {selectedCollection && (
          <CollectionItemsPanel
            collection={selectedCollection}
            onClose={() => setSelectedCollection(null)}
          />
        )}
      </div>
    </>
  );
}
