import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, Heart, Scale, BookOpen, User, LayoutDashboard, Briefcase, Users, ShieldCheck, ScrollText, Settings } from "lucide-react";

const icons = {
  Explore: Building2,
  Shortlist: Heart,
  Compare: Scale,
  Guides: BookOpen,
  Account: User,
  Dashboard: LayoutDashboard,
  Leads: Briefcase,
  Admin: ShieldCheck,
  Users: Users,
  Audit: ScrollText,
  Settings: Settings,
};

export default function MobileBottomNav({ items }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-background/95 backdrop-blur-xl md:hidden">
      <div className={`grid px-2 py-2 ${items.length <= 5 ? "grid-cols-5" : "grid-cols-4"}`}>
        {items.map((item) => {
          const Icon = icons[item.label] || Building2;
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}