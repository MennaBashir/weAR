import { Link } from "react-router-dom";
import { AlertCircle, Clock3, RotateCcw, Shirt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { useCustomerTryOnSessions } from "@/features/customer/try-on/hooks/tryOn.queries";
import type { TryOnSession } from "@/features/customer/try-on/types/tryOn";
import { cn } from "@/lib/utils";

const processingStatuses = new Set(["processing", "pending", "queued", "running", "in_progress", "created"]);
const failedStatuses = new Set(["failed", "error", "cancelled", "canceled", "rejected"]);
const completedStatuses = new Set(["completed", "complete", "succeeded", "success", "done", "ready"]);

type SessionState = "processing" | "completed" | "failed";

const getSessionState = (session: TryOnSession): SessionState => {
  const status = session.status?.toLowerCase().trim();
  if (status && failedStatuses.has(status)) return "failed";
  if (status && processingStatuses.has(status)) return "processing";
  if (status && completedStatuses.has(status)) return "completed";
  if (session.resultImageUrl || session.result3dModelUrl || session.model3dUrl) return "completed";
  return "processing";
};

const formatDate = (value?: string | null) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const statusStyles: Record<SessionState, { label: string; className: string; icon: typeof Clock3 }> = {
  processing: { label: "Processing", className: "bg-[#F4EDE7] text-[#6F625B]", icon: Clock3 },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700", icon: Sparkles },
  failed: { label: "Failed", className: "bg-red-50 text-red-700", icon: AlertCircle },
};

const getProductName = (session: TryOnSession) => session.product?.name ?? `Product ${session.productId}`;

function SessionCard({ session }: { session: TryOnSession }) {
  const state = getSessionState(session);
  const style = statusStyles[state];
  const StatusIcon = style.icon;
  const imageUrl = session.resultImageUrl ?? session.product?.primaryImageUrl ?? session.product?.imageUrls?.[0] ?? null;

  return (
    <article className={`${customerTheme.card} grid gap-4 p-5 sm:grid-cols-[140px_minmax(0,1fr)]`}>
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-3xl bg-[#F4EDE7]">
        {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <Shirt className="h-12 w-12 text-[#A37E6B]" aria-hidden="true" />}
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">{session.sessionType}</p>
            <h2 className="text-xl font-semibold text-[#2F2925]">{getProductName(session)}</h2>
            <p className="text-sm text-[#6F625B]">Started {formatDate(session.createdAt)}</p>
          </div>
          <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold", style.className)}>
            <StatusIcon className="h-4 w-4" aria-hidden="true" />{style.label}
          </span>
        </div>
        {state === "processing" && <p role="status" className="text-sm text-[#6F625B]">Your fitting result is still being prepared. Check back soon for the completed render.</p>}
        {state === "failed" && <p role="alert" className="text-sm text-[#6F625B]">This try-on could not be completed. You can reopen the product and start a new try-on.</p>}
        {state === "completed" && <p className="text-sm text-[#6F625B]">Your try-on result is ready{session.sizeRecommendation || session.recommendedSize ? ` with recommended size ${session.sizeRecommendation ?? session.recommendedSize}` : ""}.</p>}
        <div className="flex flex-wrap gap-2">
          {session.productId && <Button asChild type="button" variant={state === "completed" ? "default" : "outline"} className="rounded-full"><Link to={CUSTOMER_ROUTES.tryOnProduct(session.productId)} state={{ productId: session.productId }}> <RotateCcw className="mr-2 h-4 w-4" />Reopen try-on</Link></Button>}
          {session.productId && <Button asChild type="button" variant="ghost" className="rounded-full"><Link to={CUSTOMER_ROUTES.productDetails(session.productId)}>View product</Link></Button>}
        </div>
      </div>
    </article>
  );
}

export function CustomerTryOnHistoryPage() {
  const sessions = useCustomerTryOnSessions();
  const sessionItems = Array.isArray(sessions.data) ? sessions.data : sessions.data?.items ?? [];
  const sortedSessions = [...sessionItems].sort((a, b) => new Date(b.createdAt ?? b.updatedAt ?? 0).getTime() - new Date(a.createdAt ?? a.updatedAt ?? 0).getTime());

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#A37E6B]">Try-on history</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">Your fitting room sessions</h1>
          <p className="mt-2 max-w-2xl text-[#6F625B]">Review processing, completed, and failed try-ons from your authenticated customer account.</p>
        </div>
        <Button asChild className={cn("rounded-full", customerTheme.focusRing)}><Link to={CUSTOMER_ROUTES.tryOn}>Start a try-on</Link></Button>
      </div>

      {sessions.isLoading && <div className={`${customerTheme.softCard} p-8 text-center`} role="status">Loading try-on history…</div>}
      {sessions.isError && <div className={`${customerTheme.softCard} p-8`} role="alert"><h2 className="font-semibold">Try-on history unavailable</h2><p className="mt-1 text-sm text-[#6F625B]">We could not load your sessions. Please try again.</p></div>}
      {!sessions.isLoading && !sessions.isError && sortedSessions.length === 0 && <div className={`${customerTheme.card} p-10 text-center`}><Shirt className="mx-auto h-12 w-12 text-[#A37E6B]" aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold">No try-ons yet</h2><p className="mt-2 text-[#6F625B]">Choose a product to create your first virtual fitting.</p><Button asChild className="mt-5 rounded-full"><Link to={CUSTOMER_ROUTES.shop}>Browse products</Link></Button></div>}
      {sortedSessions.length > 0 && <div className="space-y-4">{sortedSessions.map((session) => <SessionCard key={session.id} session={session} />)}</div>}
    </section>
  );
}
