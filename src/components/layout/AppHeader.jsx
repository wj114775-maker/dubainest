import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Building2, Menu, ShieldCheck } from "lucide-react";
import AdminWorkspaceSwitcher from "@/components/layout/AdminWorkspaceSwitcher";
import MobileWorkspaceDrawer from "@/components/layout/MobileWorkspaceDrawer";
import { cn } from "@/lib/utils";

export default function AppHeader({
  appName,
  tagline,
  onMenuClick,
  internalItems = [],
  buyerItems = [],
  showInternalAccess = false,
  homePath = "/",
  mode = "buyer",
  sticky = true
}) {
  const workspaceTitle = mode === "internal" ? "Back Office" : mode === "partner" ? "Partner Workspace" : mode === "developer" ? "Developer Portal" : "Workspace";
  const workspacePathPrefix = mode === "internal" ? "/ops" : mode === "partner" ? "/partner" : mode === "developer" ? "/developer" : "/ops";
  const showWorkspaceNavigation = mode !== "buyer" || showInternalAccess;

  return (
    <header className={`bg-[#ff6666] z-40 border-b border-slate-200/80 shadow-[0_10px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 ${sticky ? "sticky top-0" : ""}`}>


      
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to={homePath} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{appName}</h1>
              <p className="text-sm text-muted-foreground">
                {showInternalAccess && mode === "buyer" ? "Workspace access available" : tagline}
              </p>
            </div>
          </Link>
        </div>

        {mode === "buyer" ?
        <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {buyerItems.map((item) =>
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
            cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              isActive ?
              "bg-primary/10 text-foreground" :
              "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )
            }>
            
                {item.label}
              </NavLink>
          )}
            {showInternalAccess ?
          <Badge variant="outline" className="ml-3 rounded-full border-primary/20 bg-primary/5 px-4 py-2 text-xs text-foreground">
                <ShieldCheck className="mr-2 h-3.5 w-3.5 text-primary" />
                Internal access active
              </Badge> :
          null}
          </nav> :

        <div className="hidden flex-1 items-center justify-center md:flex">
            {showInternalAccess ?
          <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-4 py-2 text-xs text-foreground">
                <ShieldCheck className="mr-2 h-3.5 w-3.5 text-primary" />
                Internal operations access
              </Badge> :
          null}
          </div>
        }

        <div className="flex items-center gap-2">
          {showWorkspaceNavigation ? <MobileWorkspaceDrawer items={internalItems} title={workspaceTitle} buttonLabel={workspaceTitle} /> : null}
          {showWorkspaceNavigation ? <AdminWorkspaceSwitcher items={internalItems} label={workspaceTitle} activeMatchPrefix={workspacePathPrefix} /> : null}
          {showInternalAccess && mode === "buyer" ?
          <Button asChild className="hidden rounded-full px-5 md:inline-flex">
              <Link to="/workspace">Workspace</Link>
            </Button> :
          null}
          <Button variant="ghost" size="icon" asChild><Link to="/notifications"><Bell className="h-4 w-4" /></Link></Button>
          <Button asChild variant={showInternalAccess ? "outline" : "default"} className="rounded-full px-5">
            <Link to="/account">{showInternalAccess ? "Profile" : "Account"}</Link>
          </Button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
      
    </header>);

}
