import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import PayoutLedgerTable from "@/components/partner/PayoutLedgerTable";

const entries = [
  { id: "1", reference: "LEDGER-9111", status: "accrued", amount: 215000 },
  { id: "2", reference: "LEDGER-9112", status: "disputed", amount: 132000 }
];

export default function OpsRevenue() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Revenue" title="Commission ledger, invoice and payout control" description="Finance teams manage accruals, approvals, payment state and dispute exposure from one ledger surface." />
      <PayoutLedgerTable entries={entries} />
    </div>
  );
}