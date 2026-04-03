import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function SideRail({ title, items }) {
  const location = useLocation();
  const sections = items.reduce((acc, item) => {
    const key = item.section || "Workspace";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  const isActive = (path) => location.pathname === path || (path !== "/ops" && location.pathname.startsWith(`${path}/`));

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-card/35 p-4 md:block">
      <div className="mb-6 px-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Menu</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-5">
        {Object.entries(sections).map(([section, sectionItems]) => (
          <div key={section} className="space-y-2">
            <p className="px-2 text-[11px] font-medium uppercase tracking-[0.26em] text-muted-foreground/80">{section}</p>
            <div className="space-y-1">
              {sectionItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-sm transition ${
                      active
                        ? "border-primary/25 bg-primary/10 text-foreground shadow-lg shadow-primary/10"
                        : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-[0.95rem] ${active ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground"}`}>
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{item.label}</div>
                      {active && item.description ? <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
