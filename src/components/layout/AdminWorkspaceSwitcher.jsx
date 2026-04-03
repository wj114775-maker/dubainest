import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminWorkspaceSwitcher({ items = [] }) {
  const location = useLocation();
  const inInternal = location.pathname.startsWith("/ops");
  const sections = items.reduce((acc, item) => {
    const key = item.section || "Workspace";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={inInternal ? "default" : "outline"} className="hidden rounded-full px-4 md:inline-flex">
          <ShieldCheck className="h-4 w-4" />
          Ops Menu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {Object.entries(sections).map(([section, sectionItems], index) => (
          <React.Fragment key={section}>
            {index ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{section}</DropdownMenuLabel>
            {sectionItems.map((item) => (
              <DropdownMenuItem key={item.path} asChild>
                <Link to={item.path} className="flex w-full items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/70">
                      {item.icon ? <item.icon className="h-4 w-4" /> : null}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4" />
                </Link>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
