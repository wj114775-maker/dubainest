import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import PayoutLedgerTable from "@/components/partner/PayoutLedgerTable";

const entries = [
  { id: "1", reference: "COMM-22018", status: "approved", amount: 185000 },
  { id: "2", reference: "COMM-22019", status: "paid", amount: 92000 }
];

export default function PartnerPayouts() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Payouts" title="Commission accrual, invoice and payout visibility" description="The ledger is designed for enterprise payout control, dispute handling and immutable references." />
      <PayoutLedgerTable entries={entries} />
    </div>
  );
}