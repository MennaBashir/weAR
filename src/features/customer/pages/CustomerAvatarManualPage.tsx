import type React from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomerPageHeader, Field, InlineState } from "@/features/customer/components/account/AccountAvatarShared";
import { useCreateCustomerAvatar, useCustomerAvatar, useUpdateCustomerAvatarMeasurements } from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { getSafeCustomerReturnRoute } from "@/features/customer/utils/customerReturnRoute";
import { manualMeasurementSchema, mapManualMeasurementsToPayload, measurementFieldConfigs } from "@/features/customer/types/profileAvatar";

export function CustomerAvatarManualPage() {
  const navigate = useNavigate(); const location = useLocation();
  const returnTo = getSafeCustomerReturnRoute(new URLSearchParams(location.search).get("returnTo"), CUSTOMER_ROUTES.avatar);
  const avatar = useCustomerAvatar(); const createAvatar = useCreateCustomerAvatar(); const updateMeasurements = useUpdateCustomerAvatarMeasurements();
  const [error, setError] = useState<string | null>(null);
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const raw = Object.fromEntries(measurementFieldConfigs.map((field) => [field.key, data.get(field.key) ? Number(data.get(field.key)) : undefined])); const parsed = manualMeasurementSchema.safeParse(raw); if (!parsed.success) { setError("Please enter a valid required height and supported measurements."); return; } const payload = mapManualMeasurementsToPayload(parsed.data); const options = { onSuccess: () => navigate(returnTo) }; if (avatar.data) updateMeasurements.mutate(payload, options); else createAvatar.mutate(payload, options); };
  const pending = createAvatar.isPending || updateMeasurements.isPending;
  return <div><CustomerPageHeader title="Manual measurements" description="Enter only the backend-supported measurements used by your customer avatar." />{avatar.isLoading ? <InlineState title="Loading current avatar" /> : null}{error ? <div className="mb-4"><InlineState tone="error" title={error} /></div> : null}<Card><CardHeader><CardTitle>{avatar.data ? "Update measurements" : "Create avatar"}</CardTitle></CardHeader><CardContent><form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">{measurementFieldConfigs.map((field) => <Field key={field.key} id={field.key} label={`${field.label}${field.required ? " *" : ""}`}><Input id={field.key} name={field.key} type="number" min={field.min} max={field.max} required={field.required} defaultValue={avatar.data?.measurements[field.key] ?? ""} aria-describedby={`${field.key}-hint`} /><p id={`${field.key}-hint`} className="text-xs text-[#6F625B]">{field.unit}, {field.min}–{field.max}</p></Field>)}<div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving..." : avatar.data ? "Update measurements" : "Create avatar"}</Button><Button type="button" variant="outline" onClick={() => navigate(CUSTOMER_ROUTES.avatar)}>Cancel</Button></div></form>{createAvatar.isError || updateMeasurements.isError ? <div className="mt-4"><InlineState tone="error" title="Backend validation failed" description="Please review your measurements and try again." /></div> : null}</CardContent></Card></div>;
}
