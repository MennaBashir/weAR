import type React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { cn } from "@/lib/utils";
import { formatNullableMeasurement, measurementFieldConfigs } from "@/features/customer/types/profileAvatar";
import type { BodyMeasurements, CustomerAddress, CustomerAddressPayload } from "@/features/customer/types/profileAvatar";

export function CustomerPageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A37E6B]">Customer account</p><h1 className="mt-2 text-3xl font-bold text-[#2F2925] md:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-[#6F625B]">{description}</p></div>{actions}</div>;
}

export function InlineState({ title, description, tone = "info" }: { title: string; description?: string; tone?: "info" | "error" | "success" }) {
  return <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-2xl border p-4 text-sm", tone === "error" ? "border-red-200 bg-red-50 text-red-700" : tone === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-[#E4DCD1] bg-white text-[#6F625B]")}><p className="font-semibold">{title}</p>{description ? <p className="mt-1">{description}</p> : null}</div>;
}

export function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><label htmlFor={id} className="text-sm font-medium text-[#2F2925]">{label}</label>{children}{error ? <p id={`${id}-error`} className="text-sm text-red-600">{error}</p> : null}</div>;
}

export function AvatarMeasurementGrid({ measurements }: { measurements: Partial<BodyMeasurements> }) {
  return <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{measurementFieldConfigs.map((field) => <div key={field.key} className="rounded-2xl border border-[#E4DCD1] bg-white p-4"><dt className="text-sm text-[#6F625B]">{field.label}</dt><dd className="mt-1 text-lg font-semibold text-[#2F2925]">{formatNullableMeasurement(measurements[field.key])}{measurements[field.key] == null ? "" : ` ${field.unit}`}</dd></div>)}</dl>;
}

export function AddressCard({ address, onEdit, onDelete, onDefault, busy }: { address: CustomerAddress; onEdit: () => void; onDelete: () => void; onDefault: () => void; busy?: boolean }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2">{address.fullName}{address.isDefault ? <span className="rounded-full bg-[#F4EDE7] px-2 py-1 text-xs text-[#A37E6B]">Default</span> : null}</CardTitle><CardDescription>{address.phoneNumber}</CardDescription></CardHeader><CardContent className="space-y-4"><address className="not-italic text-sm text-[#4D433D]">{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}<br />{address.country}</address><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={onEdit}>Edit address</Button><Button type="button" variant="outline" onClick={onDefault} disabled={address.isDefault || busy}>Set as default</Button><Button type="button" variant="destructive" onClick={onDelete} disabled={busy}>Delete</Button></div></CardContent></Card>;
}

export function AddressForm({ initial, onSubmit, onCancel, pending }: { initial?: Partial<CustomerAddress>; onSubmit: (payload: CustomerAddressPayload) => void; onCancel?: () => void; pending?: boolean }) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ fullName: String(data.get("fullName") || ""), phoneNumber: String(data.get("phoneNumber") || ""), line1: String(data.get("line1") || ""), line2: String(data.get("line2") || "") || null, city: String(data.get("city") || ""), state: String(data.get("state") || "") || null, postalCode: String(data.get("postalCode") || ""), country: String(data.get("country") || ""), type: "shipping", isDefault: data.get("isDefault") === "on" }); };
  return <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2"><Field id="fullName" label="Full name"><Input id="fullName" name="fullName" required defaultValue={initial?.fullName ?? ""} /></Field><Field id="phoneNumber" label="Phone number"><Input id="phoneNumber" name="phoneNumber" required defaultValue={initial?.phoneNumber ?? ""} /></Field><Field id="line1" label="Address line 1"><Input id="line1" name="line1" required defaultValue={initial?.line1 ?? ""} /></Field><Field id="line2" label="Address line 2"><Input id="line2" name="line2" defaultValue={initial?.line2 ?? ""} /></Field><Field id="city" label="City"><Input id="city" name="city" required defaultValue={initial?.city ?? ""} /></Field><Field id="state" label="State / region"><Input id="state" name="state" defaultValue={initial?.state ?? ""} /></Field><Field id="postalCode" label="Postal code"><Input id="postalCode" name="postalCode" required defaultValue={initial?.postalCode ?? ""} /></Field><Field id="country" label="Country"><Input id="country" name="country" required defaultValue={initial?.country ?? ""} /></Field><label className="flex items-center gap-2 text-sm text-[#4D433D]"><input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} /> Use as default address</label><div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save address"}</Button>{onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}</div></form>;
}

export const AccountLinks = () => <div className="grid gap-3 sm:grid-cols-2"><Button asChild variant="outline"><Link to={CUSTOMER_ROUTES.addresses}>Manage addresses</Link></Button><Button asChild variant="outline"><Link to={CUSTOMER_ROUTES.avatar}>Manage avatar</Link></Button></div>;
