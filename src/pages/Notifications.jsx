import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications-inbox"],
    queryFn: async () => {
      const me = await base44.auth.me();
      const all = await base44.entities.Notification.list("-updated_date", 100);
      return all.filter((item) => !item.user_id || item.user_id === me.id);
    },
    initialData: []
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { status: "read" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] })
  });

  const getActionLink = (item) => {
    if (item.route_path) return item.route_path;
    if (item.lead_id) return `/ops/leads/${item.lead_id}`;
    if (item.concierge_case_id) return item.user_id ? "/partner/concierge" : `/ops/concierge/${item.concierge_case_id}`;
    if (item.private_inventory_request_id || item.nda_tracking_id || item.viewing_plan_id || item.service_referral_id) {
      return item.user_id ? "/partner/concierge" : `/ops/concierge/${item.concierge_case_id || ""}`;
    }
    if (item.listing_id) return item.user_id ? "/partner/listings" : `/ops/listings/${item.listing_id}`;
    if (item.entitlement_id) return item.user_id ? "/partner/payouts" : `/ops/revenue/${item.entitlement_id}`;
    if (item.invoice_id || item.dispute_id || item.settlement_id) return item.user_id ? "/partner/payouts" : "/ops/revenue";
    if (item.body?.includes("listing") && item.user_id) return "/partner/listings";
    if (/invoice|payment|revenue|settlement|dispute/i.test(`${item.title || ""} ${item.body || ""}`)) {
      return item.user_id ? "/partner/payouts" : "/ops/revenue";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <SeoMeta
        title="Notifications"
        description="Operational notification center."
        canonicalPath="/notifications"
        robots="noindex,nofollow"
      />
      <SectionHeading eyebrow="Inbox" title="Operational notifications" description="Review alerts, reminders and workflow notices linked to lead and supply operations." />
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Notification centre</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notifications.length ? notifications.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.status || "queued"}</p>
              </div>
              <div className="flex gap-2">
                {getActionLink(item) ? <Button variant="outline" asChild><Link to={getActionLink(item)}>Open</Link></Button> : null}
                {item.status !== "read" ? <Button variant="ghost" onClick={() => markRead.mutate(item.id)}>Mark read</Button> : null}
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No notifications yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
