import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function SideRail({ title, items }) {
  const location = useLocation();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-card/40 p-4 md:block">
      <div className="mb-6 px-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Workspace</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-2xl px-4 py-3 text-sm transition ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}