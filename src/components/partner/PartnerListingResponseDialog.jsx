import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function PartnerListingResponseDialog({ open, onOpenChange, listing, mode = "response", loading, onSubmit }) {
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [resubmit, setResubmit] = useState(true);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setEvidenceUrl("");
    setResubmit(true);
  }, [open, listing, mode]);

  const isResponse = mode === "response";

  const handleSubmit = async () => {
    await onSubmit?.({ notes: note.trim(), evidenceUrl: evidenceUrl.trim(), resubmit, mode });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isResponse ? "Respond to review" : "Upload evidence"}</DialogTitle>
          <DialogDescription>
            {isResponse
              ? `Reply to governance feedback for ${listing?.title || "this listing"} and push it back into review.`
              : `Attach new evidence for ${listing?.title || "this listing"} so internal reviewers can re-check readiness.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {listing?.missing_requirements?.length ? (
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-3 text-sm text-muted-foreground">
              Open requirements: {listing.missing_requirements.join(", ")}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="listing-response-note">Partner note</Label>
            <Textarea id="listing-response-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain what changed, what evidence is attached, or what review question you are answering." className="min-h-32" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-response-url">Evidence URL</Label>
            <Input id="listing-response-url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="listing-response-resubmit" checked={resubmit} onCheckedChange={(value) => setResubmit(Boolean(value))} />
            <Label htmlFor="listing-response-resubmit">Return listing to review queue after submitting this response</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !note.trim()}>
            {isResponse ? "Send response" : "Submit evidence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
