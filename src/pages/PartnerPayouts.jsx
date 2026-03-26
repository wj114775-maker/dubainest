import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import PayoutLedgerTable from "@/components/partner/PayoutLedgerTable";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";

export default function PartnerPayouts() {
  const { data: current } = useCurrentUserRole();

  const { data: entries = [] } = useQuery({
    queryKey: ["partner-payouts", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, ledgers, invoices, payouts] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.CommissionLedger.list("-updated_date", 200),
        base44.entities.Invoice.list("-updated_date", 200),
        base44.entities.Payout.list("-updated_date", 200),
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id;
      return ledgers
        .filter((entry) => entry.partner_agency_id === partnerAgencyId)
        .map((entry) => {
          const invoice = invoices.find((item) => item.id === entry.invoice_id);
          const payout = payouts.find((item) => item.id === entry.payout_id);
          return {
            id: entry.id,
            reference: entry.immutable_reference || invoice?.invoice_number || payout?.immutable_reference || entry.id,
            status: payout?.status || invoice?.status || entry.status,
            amount: Number(entry.amount || payout?.amount || invoice?.amount || 0),
          };
        });
    },
    initialData: [],
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Payouts" title="Commission accrual, invoice and payout visibility" description="The ledger is designed for enterprise payout control, dispute handling and immutable references." />
      <PayoutLedgerTable entries={entries} />
    </div>
  );
}