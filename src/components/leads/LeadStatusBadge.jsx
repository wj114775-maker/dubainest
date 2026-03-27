import React from "react";
import { Badge } from "@/components/ui/badge";

export default function LeadStatusBadge({ status }) {
  return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{status || "new"}</Badge>;
}