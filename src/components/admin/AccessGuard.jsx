import React from "react";
import useAccessControl from "@/hooks/useAccessControl";
import { Card, CardContent } from "@/components/ui/card";

export default function AccessGuard({ permission, children, fallback = null }) {
  const { data } = useAccessControl();

  if (!data.can(permission)) {
    return fallback ?? (
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="p-6 text-sm text-muted-foreground">
          You do not have permission to view this section.
        </CardContent>
      </Card>
    );
  }

  return children;
}