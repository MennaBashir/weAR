import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressCard, AddressForm, CustomerPageHeader, InlineState } from "@/features/customer/components/account/AccountAvatarShared";
import { useCreateCustomerAddress, useCustomerAddresses, useDeleteCustomerAddress, useSetDefaultCustomerAddress, useUpdateCustomerAddress } from "@/features/customer/queries/profileAvatar.queries";
import type { CustomerAddress } from "@/features/customer/types/profileAvatar";

export function CustomerAddressesPage() {
  const addresses = useCustomerAddresses();
  const createAddress = useCreateCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const setDefault = useSetDefaultCustomerAddress();
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  return <div><CustomerPageHeader title="Addresses" description="Create, edit, delete, and choose your default shipping address." actions={<Button onClick={() => setShowCreate((open) => !open)}>{showCreate ? "Close form" : "Add address"}</Button>} />{addresses.isLoading ? <InlineState title="Loading addresses" /> : null}{addresses.isError ? <InlineState tone="error" title="Could not load addresses" /> : null}{showCreate ? <Card className="mb-6"><CardHeader><CardTitle>Create address</CardTitle></CardHeader><CardContent><AddressForm pending={createAddress.isPending} onSubmit={(payload) => createAddress.mutate(payload, { onSuccess: () => setShowCreate(false) })} /></CardContent></Card> : null}{editing ? <Card className="mb-6"><CardHeader><CardTitle>Edit address</CardTitle></CardHeader><CardContent><AddressForm initial={editing} pending={updateAddress.isPending} onCancel={() => setEditing(null)} onSubmit={(payload) => updateAddress.mutate({ id: editing.id, payload }, { onSuccess: () => setEditing(null) })} /></CardContent></Card> : null}{addresses.data?.length === 0 ? <InlineState title="No addresses yet" description="Add a shipping address to speed up future checkout flows." /> : null}<div className="grid gap-4 md:grid-cols-2">{addresses.data?.map((address) => <AddressCard key={address.id} address={address} busy={deleteAddress.isPending || setDefault.isPending} onEdit={() => setEditing(address)} onDelete={() => { if (window.confirm("Delete this address?")) deleteAddress.mutate(address.id); }} onDefault={() => setDefault.mutate(address.id)} />)}</div>{createAddress.isError || updateAddress.isError || deleteAddress.isError || setDefault.isError ? <div className="mt-4"><InlineState tone="error" title="Address action failed" /></div> : null}</div>;
}
