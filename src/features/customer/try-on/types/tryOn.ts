import type { CustomerProduct } from "@/features/customer/types/catalog";

export type TryOnSessionType = "Overlay2D" | "Model3D" | "ARLiveView";

export interface CreateTryOnSessionPayload {
  productId: string;
  sessionType: "Overlay2D";
}

export interface TryOnSession {
  id: string;
  customerId?: string;
  productId: string;
  sessionType: TryOnSessionType;
  status?: string | null;
  resultImageUrl?: string | null;
  avatar3dModelUrl?: string | null;
  sizeRecommendation?: string | null;
  recommendedSize?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  product?: CustomerProduct | null;
}

export type TryOnFlowStatus =
  | "entry"
  | "checking-avatar"
  | "ready"
  | "submitting"
  | "processing"
  | "completed-2d"
  | "error-retryable"
  | "error-avatar-required";

export interface TryOnSelections { selectedSize: string; selectedColor: string; }

export interface TryOnFlowState extends TryOnSelections {
  status: TryOnFlowStatus;
  productId: string | null;
  session: TryOnSession | null;
  errorMessage: string | null;
}

export type TryOnFlowAction =
  | { type: "ENTER_ROOM" }
  | { type: "AVATAR_MISSING"; message?: string }
  | { type: "AVATAR_READY"; productId: string | null }
  | { type: "SELECT_SIZE"; size: string }
  | { type: "SELECT_COLOR"; color: string }
  | { type: "SUBMIT" }
  | { type: "PROCESSING" }
  | { type: "COMPLETE_2D"; session: TryOnSession }
  | { type: "RETRYABLE_ERROR"; message: string }
  | { type: "CHANGE_PRODUCT"; productId?: string | null }
  | { type: "RESET_ENTRY" };

export const initialTryOnFlowState = (productId: string | null, selections?: Partial<TryOnSelections>): TryOnFlowState => ({
  status: "entry",
  productId,
  selectedSize: selections?.selectedSize ?? "",
  selectedColor: selections?.selectedColor ?? "",
  session: null,
  errorMessage: null,
});

export const tryOnFlowReducer = (state: TryOnFlowState, action: TryOnFlowAction): TryOnFlowState => {
  switch (action.type) {
    case "ENTER_ROOM": return { ...state, status: "checking-avatar", errorMessage: null };
    case "AVATAR_MISSING": return { ...state, status: "error-avatar-required", errorMessage: action.message ?? "Create an avatar before trying on products." };
    case "AVATAR_READY": return { ...state, status: "ready", productId: action.productId, errorMessage: null };
    case "SELECT_SIZE": return { ...state, selectedSize: action.size };
    case "SELECT_COLOR": return { ...state, selectedColor: action.color };
    case "SUBMIT": return state.status === "ready" || state.status === "error-retryable" ? { ...state, status: "submitting", errorMessage: null } : state;
    case "PROCESSING": return { ...state, status: "processing" };
    case "COMPLETE_2D": return { ...state, status: "completed-2d", session: action.session, errorMessage: null };
    case "RETRYABLE_ERROR": return { ...state, status: "error-retryable", errorMessage: action.message };
    case "CHANGE_PRODUCT": return { ...state, status: "ready", productId: action.productId ?? null, session: null, errorMessage: null };
    case "RESET_ENTRY": return { ...state, status: "entry", session: null, errorMessage: null };
    default: return state;
  }
};
