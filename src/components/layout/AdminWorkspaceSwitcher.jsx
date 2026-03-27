import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminWorkspaceSwitcher({ items = [] }) {
  const location = useLocation();
  const inInternal = location.pathname.startsWith("/ops");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={inInternal ? "default" : "outline"} className="hidden rounded-full px-4 md:inline-flex">
          <ShieldCheck className="h-4 w-4" />
          Internal
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem asChild>
          <Link to="/ops" className="flex w-full items-center justify-between">
            <span>Dashboard</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </DropdownMenuItem>
        {items.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link to={item.path} className="flex w-full items-center justify-between">
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}