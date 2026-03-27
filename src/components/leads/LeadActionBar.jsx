import React from "react";
import { Button } from "@/components/ui/button";

export default function LeadActionBar({ actions = [] }) {
  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant || "outline"}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}