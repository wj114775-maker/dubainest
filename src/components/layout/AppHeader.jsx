import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Building2, Menu, ShieldCheck } from "lucide-react";
import AdminWorkspaceSwitcher from "@/components/layout/AdminWorkspaceSwitcher";
import MobileWorkspaceDrawer from "@/components/layout/MobileWorkspaceDrawer";

export default function AppHeader({ appName, tagline, onMenuClick, internalItems = [], showInternalAccess = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to={showInternalAccess ? "/ops" : "/"} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{appName}</h1>
              <p className="text-sm text-muted-foreground">{showInternalAccess ? "Operations workspace available" : tagline}</p>
            </div>
          </Link>
        </div>
        <div className="hidden flex-1 items-center justify-center md:flex">
          {showInternalAccess ? (
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-4 py-2 text-xs text-foreground">
              <ShieldCheck className="mr-2 h-3.5 w-3.5 text-primary" />
              Internal operations access
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {showInternalAccess ? <MobileWorkspaceDrawer items={internalItems} /> : null}
          {showInternalAccess ? <AdminWorkspaceSwitcher items={internalItems} /> : null}
          <Button variant="ghost" size="icon" asChild><Link to="/notifications"><Bell className="h-4 w-4" /></Link></Button>
          <Button asChild variant={showInternalAccess ? "outline" : "default"} className="rounded-full px-5"><Link to="/account">Account</Link></Button>
        </div>
      </div>
    </header>
  );
}
