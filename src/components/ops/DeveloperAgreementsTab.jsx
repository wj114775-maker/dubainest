import React from "react";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactLabel } from "@/lib/revenue";

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function DeveloperAgreementsTab({ agreements = [], organisations = [], prospects = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Developer agreements</CardTitle></CardHeader>
      <CardContent>
        {agreements.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signature</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Signed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((agreement) => {
                const organisation = organisations.find((item) => item.id === agreement.developer_organisation_id);
                const prospect = prospects.find((item) => item.id === agreement.developer_prospect_id);
                return (
                  <TableRow key={agreement.id}>
                    <TableCell>{agreement.agreement_code || agreement.agreement_type || "Developer agreement"}</TableCell>
                    <TableCell>{organisation?.trading_name || organisation?.legal_name || prospect?.company_name || "Prospect"}</TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(agreement.agreement_status)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(agreement.signature_status)}</Badge></TableCell>
                    <TableCell>{formatDateTime(agreement.sent_at)}</TableCell>
                    <TableCell>{formatDateTime(agreement.last_reminder_at)}</TableCell>
                    <TableCell>{formatDateTime(agreement.signed_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyStateCard title="No agreements yet" description="Send an agreement from the prospect workflow to populate this desk." />
        )}
      </CardContent>
    </Card>
  );
}
