import React from "react";
import QueueCard from "@/components/common/QueueCard";
import { compactLabel, formatCurrency } from "@/lib/revenue";

export default function RevenueQueueCard({
  title,
  items = [],
  emptyMessage = "No records yet.",
  linkBase = "",
  actionLabel = "Open",
  renderActions
}) {
  return (
    <QueueCard
      title={title}
      items={items}
      emptyMessage={emptyMessage}
      linkBase={linkBase}
      actionLabel={actionLabel}
      renderActions={renderActions}
      formatStatus={compactLabel}
      formatAmount={(amount, currency) => formatCurrency(amount, currency || "AED")}
    />
  );
}
