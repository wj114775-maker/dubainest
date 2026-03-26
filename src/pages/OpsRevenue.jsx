import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import PayoutLedgerTable from "@/components/partner/PayoutLedgerTable";
import AccessGuard from "@/components/admin/AccessGuard";

export default function OpsRevenue() {
  const { data: entries = [] } = useQuery({
    queryKey: ["ops-revenue-payouts"],
    queryFn: () => base44.entities.Payout.list(),
    initialData: []
  });

  const rows = entries.map((item) => ({
    id: item.id,
    reference: item.reference || item.invoice_number || item.id,
    status: item.status || "draft",
    amount: Number(item.amount || 0)
  }));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Revenue" title="Commission ledger, invoice and payout control" description="Finance teams manage accruals, approvals, payment state and dispute exposure from one ledger surface." />
      <AccessGuard permission="payouts.read">
        <PayoutLedgerTable entries={rows} />
      </AccessGuard>
    </div>
  );
}