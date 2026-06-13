import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccountLinks, CustomerPageHeader, Field, InlineState } from "@/features/customer/components/account/AccountAvatarShared";
import { useChangeCustomerPassword, useCustomerProfile, useDeleteCustomerAccount, useUpdateCustomerProfile } from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";

export function CustomerAccountPage() {
  const navigate = useNavigate();
  const profile = useCustomerProfile();
  const update = useUpdateCustomerProfile();
  const changePassword = useChangeCustomerPassword();
  const deleteAccount = useDeleteCustomerAccount();
  const [message, setMessage] = useState<string | null>(null);


  const onProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("fullName") || "").trim();
    if (!fullName) { setMessage("Full name is required."); return; }
    update.mutate({ fullName, phoneNumber: String(data.get("phoneNumber") || "") || null, age: data.get("age") ? Number(data.get("age")) : null, gender: String(data.get("gender") || "") || null }, { onSuccess: () => setMessage("Profile updated successfully.") });
  };

  const onPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = { currentPassword: String(data.get("currentPassword") || ""), newPassword: String(data.get("newPassword") || ""), confirmPassword: String(data.get("confirmPassword") || "") };
    if (payload.newPassword !== payload.confirmPassword) { setMessage("New passwords must match."); return; }
    changePassword.mutate(payload, { onSuccess: () => setMessage("Password changed successfully.") });
  };

  const onDeleteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!window.confirm("Delete your customer account? This action cannot be undone.")) return;
    const data = new FormData(event.currentTarget);
    deleteAccount.mutate({ password: String(data.get("deletePassword") || ""), reason: String(data.get("reason") || "") || null }, { onSuccess: () => navigate(CUSTOMER_ROUTES.login) });
  };

  if (profile.isLoading) return <InlineState title="Loading profile" description="Fetching your customer profile." />;
  if (profile.isError) return <InlineState tone="error" title="Profile unavailable" description="We could not load your account profile." />;
  const customer = profile.data;
  if (!customer) return <InlineState tone="error" title="Profile unavailable" />;

  return <div><CustomerPageHeader title="Account" description="Manage your customer profile, password, addresses, and avatar setup." actions={<AccountLinks />} />{message ? <div className="mb-4"><InlineState tone={message.includes("success") ? "success" : "error"} title={message} /></div> : null}<div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><Card><CardHeader><CardTitle>Profile details</CardTitle><CardDescription>Your email is shown for reference and cannot be edited here.</CardDescription></CardHeader><CardContent><form onSubmit={onProfileSubmit} className="grid gap-4 md:grid-cols-2"><Field id="fullName" label="Full name"><Input id="fullName" name="fullName" required defaultValue={customer.fullName} /></Field><Field id="email" label="Email"><Input id="email" value={customer.email} readOnly /></Field><Field id="phoneNumber" label="Phone number"><Input id="phoneNumber" name="phoneNumber" defaultValue={customer.phoneNumber ?? ""} /></Field><Field id="age" label="Age"><Input id="age" name="age" type="number" min={1} max={120} defaultValue={customer.age ?? ""} /></Field><Field id="gender" label="Gender"><select id="gender" name="gender" defaultValue={customer.gender ?? ""} className="h-9 rounded-md border px-3"><option value="">Prefer not to say</option><option value="Male">Male</option><option value="Female">Female</option></select></Field><div className="md:col-span-2"><Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save profile"}</Button></div></form>{update.isError ? <div className="mt-4"><InlineState tone="error" title="Could not update profile" /></div> : null}</CardContent></Card><div className="grid gap-6"><Card><CardHeader><CardTitle>Profile summary</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-[#4D433D]"><p><strong>Name:</strong> {customer.fullName}</p><p><strong>Email:</strong> {customer.email}</p><p><strong>Phone:</strong> {customer.phoneNumber || "—"}</p><p><strong>Age:</strong> {customer.age ?? "—"}</p><p><strong>Gender:</strong> {customer.gender || "—"}</p></CardContent></Card><Card><CardHeader><CardTitle>Change password</CardTitle></CardHeader><CardContent><form onSubmit={onPasswordSubmit} className="grid gap-3"><Input aria-label="Current password" name="currentPassword" type="password" required placeholder="Current password" /><Input aria-label="New password" name="newPassword" type="password" required placeholder="New password" /><Input aria-label="Confirm new password" name="confirmPassword" type="password" required placeholder="Confirm new password" /><Button type="submit" disabled={changePassword.isPending}>Change password</Button></form></CardContent></Card><Card><CardHeader><CardTitle>Delete account</CardTitle><CardDescription>Confirm with your password before deleting.</CardDescription></CardHeader><CardContent><form onSubmit={onDeleteSubmit} className="grid gap-3"><Input aria-label="Delete account password" name="deletePassword" type="password" required placeholder="Password" /><Input aria-label="Delete account reason" name="reason" placeholder="Reason (optional)" /><Button type="submit" variant="destructive" disabled={deleteAccount.isPending}>Delete account</Button></form></CardContent></Card></div></div></div>;
}
