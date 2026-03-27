import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function LeadNotesCard({ leadId }) {
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ["lead-notes", leadId],
    enabled: !!leadId,
    queryFn: async () => base44.entities.AccountNote.filter({ user_id: leadId }),
    initialData: []
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.AccountNote.create({
        user_id: leadId,
        note,
        created_by: me.id,
        visibility: "internal",
        category: "general"
      });
    },
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["lead-notes", leadId] });
    }
  });

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Textarea placeholder="Add internal note or evidence" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button onClick={() => createNote.mutate()} disabled={!note || createNote.isPending}>Save note</Button>
        <div className="space-y-2">
          {notes.length ? notes.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm">{item.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.category} · {item.created_by}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No notes yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}