import React from "react";
import { NavLink } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function OpsDeskNav({ items = [] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <NavLink key={item.path} to={item.path}>
          {({ isActive }) => (
            <Card className={cn(
              "h-full rounded-[1.75rem] border-white/10 transition-colors",
              isActive ? "border-primary/40 bg-primary/5" : "bg-card/80 hover:bg-card"
            )}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                  {item.value !== undefined ? (
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {item.value}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}
        </NavLink>
      ))}
    </div>
  );
}
