import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminModuleCard({ title, description, href, meta }) {
  return (
    <Link to={href}>
      <Card className="h-full rounded-[2rem] border-white/10 bg-card/80 transition hover:-translate-y-0.5 hover:shadow-xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            {meta ? <Badge variant="outline">{meta}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}