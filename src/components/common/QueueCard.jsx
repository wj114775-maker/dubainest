import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function QueueCard({
  title,
  items = [],
  emptyMessage = "No records yet.",
  linkBase = "",
  actionLabel = "Open",
  renderActions,
  formatStatus = (value) => value,
  formatAmount
}) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => {
          const href = item.href || (linkBase ? `${linkBase}/${item.id}` : "");
          return (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="font-semibold">{item.title}</p>
                {item.meta ? <p className="text-sm text-muted-foreground">{item.meta}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {item.status ? <Badge variant="outline">{formatStatus(item.status)}</Badge> : null}
                  {(item.badges || []).map((badge) => <Badge key={`${item.id}-${badge}`} variant="outline">{formatStatus(badge)}</Badge>)}
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-3 md:items-end">
                {item.amount !== undefined && formatAmount ? <p className="text-lg font-semibold">{formatAmount(item.amount, item.currency)}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {renderActions ? renderActions(item) : null}
                  {!renderActions && href ? <Button variant="outline" asChild><Link to={href}>{actionLabel}</Link></Button> : null}
                </div>
              </div>
            </div>
          );
        }) : <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
      </CardContent>
    </Card>
  );
}
