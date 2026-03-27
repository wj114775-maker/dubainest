import React from "react";
import { Button } from "@/components/ui/button";

export default function PartnerListingActionBar({ listing, onSubmit, loading }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => onSubmit?.(listing, "refresh")} disabled={loading}>Refresh listing</Button>
      <Button variant="outline" onClick={() => onSubmit?.(listing, "submit")} disabled={loading}>Submit update</Button>
      <Button variant="outline" onClick={() => onSubmit?.(listing, "evidence")} disabled={loading}>Upload evidence note</Button>
      <Button onClick={() => onSubmit?.(listing, "republish")} disabled={loading}>Request republish</Button>
    </div>
  );
}