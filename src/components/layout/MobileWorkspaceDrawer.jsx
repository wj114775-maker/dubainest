import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function MobileWorkspaceDrawer({ items = [] }) {
  const location = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full px-3 md:hidden">
          <ShieldCheck className="h-4 w-4" />
          Internal
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 border-white/10 bg-background/95">
        <SheetHeader>
          <SheetTitle>Internal OS</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded-2xl px-4 py-3 text-sm transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}