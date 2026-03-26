import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { trustTone } from "@/lib/appShell";

export default function TrustBadge({ score = 0 }) {
  return (
    <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
      Trust {score} · {trustTone(score)}
    </Badge>
  );
}