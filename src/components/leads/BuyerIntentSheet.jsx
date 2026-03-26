import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { captureBuyerIntent } from '@/components/leads/buyerLeadActions';

const defaultForm = {
  full_name: '',
  email: '',
  mobile: '',
  whatsapp: '',
  country: '',
  budget_max: '',
};

export default function BuyerIntentSheet({ open, onOpenChange, intentType, listingId = '', projectId = '', areaId = '', title }) {
  const [form, setForm] = useState(defaultForm);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => captureBuyerIntent({
      ...form,
      budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      intent_type: intentType,
      listing_id: listingId,
      project_id: projectId,
      area_id: areaId,
      source_channel: 'web',
      source: 'enquiry',
      lead_type: 'buyer',
      is_private_inventory: intentType === 'request_private_inventory',
      is_concierge: intentType === 'request_concierge',
      is_high_value: intentType === 'request_private_inventory',
    }),
    onSuccess: () => {
      toast({ title: 'Request captured' });
      setForm(defaultForm);
      onOpenChange(false);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Your request will be routed with attribution and ownership protection.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid gap-3">
          <Input placeholder="Full name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Input placeholder="Mobile" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
          <Input placeholder="WhatsApp" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
          <Input placeholder="Country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
          <Input placeholder="Budget ceiling" value={form.budget_max} onChange={(event) => setForm({ ...form, budget_max: event.target.value })} />
          <Select value={intentType} disabled>
            <SelectTrigger><SelectValue placeholder="Intent type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={intentType}>{intentType}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? 'Submitting...' : 'Submit request'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}