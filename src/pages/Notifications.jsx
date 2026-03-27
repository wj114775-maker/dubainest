import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
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

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Inbox" title="Operational notifications" description="Review alerts, reminders and workflow notices linked to lead operations." />
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
                {item.lead_id ? <Button variant="outline" asChild><Link to={`/ops/leads/${item.lead_id}`}>Open lead</Link></Button> : null}
                {item.status !== "read" ? <Button variant="ghost" onClick={() => markRead.mutate(item.id)}>Mark read</Button> : null}
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No notifications yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}