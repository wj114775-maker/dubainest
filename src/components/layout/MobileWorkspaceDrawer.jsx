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
          Back Office
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 border-white/10 bg-background/95">
        <SheetHeader>
          <SheetTitle>Back Office</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {Object.entries(sections).map(([section, sectionItems]) => (
            <div key={section} className="space-y-2">
              <p className="px-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{section}</p>
              <div className="space-y-2">
                {sectionItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-sm transition ${
                        active
                          ? "border-primary/20 bg-primary/10 text-foreground"
                          : "border-white/10 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] ${active ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground"}`}>
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                      </div>
                      <div className="font-medium">{item.label}</div>
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
