import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function MobileWorkspaceDrawer({ items = [] }) {
  const location = useLocation();
  const sections = items.reduce((acc, item) => {
    const key = item.section || "Workspace";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  const isActive = (path) => location.pathname === path || (path !== "/ops" && location.pathname.startsWith(`${path}/`));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full px-3 md:hidden">
          <ShieldCheck className="h-4 w-4" />
          Operations
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 border-white/10 bg-background/95">
        <SheetHeader>
          <SheetTitle>Operations workspace</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {Object.entries(sections).map(([section, sectionItems]) => (
            <div key={section} className="space-y-2">
              <p className="px-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{section}</p>
              <div className="space-y-2">
                {sectionItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block rounded-[1.4rem] border px-4 py-3 text-sm transition ${
                        active
                          ? "border-primary/20 bg-primary text-primary-foreground"
                          : "border-white/10 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="font-medium">{item.label}</div>
                      {item.description ? <p className={`mt-1 text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{item.description}</p> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
