import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function InternalLeadConfirmationDialog({ open, onOpenChange, actionLabel, summary, requiresConfirmation, confirmed, onConfirmedChange, loading, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>{actionLabel} will update this lead immediately.</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-white/10 bg-muted/40 p-4 text-sm text-muted-foreground">
          {summary}
        </div>

        {requiresConfirmation ? (
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 p-4">
            <Checkbox id="lead-action-confirm" checked={confirmed} onCheckedChange={(value) => onConfirmedChange(Boolean(value))} />
            <div className="space-y-1">
              <Label htmlFor="lead-action-confirm">I understand this is a sensitive action</Label>
              <p className="text-sm text-muted-foreground">This action affects ownership, protection, duplicate handling, or risk review.</p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} disabled={loading || (requiresConfirmation && !confirmed)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}