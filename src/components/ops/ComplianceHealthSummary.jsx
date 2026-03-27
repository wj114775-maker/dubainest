import React from "react";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";

export default function ComplianceHealthSummary({ listings = [], cases = [] }) {
  const items = [
    { label: "Flagged listings", value: String(listings.filter((item) => item.status === 'flagged').length) },
    { label: "Frozen listings", value: String(listings.filter((item) => item.status === 'frozen').length) },
    { label: "Stale supply", value: String(listings.filter((item) => item.freshness_status === 'stale' || item.freshness_status === 'expired').length) },
    { label: "Awaiting evidence", value: String(cases.filter((item) => item.status === 'awaiting_evidence').length) }
  ];

  return <AdminSummaryStrip items={items} />;
}