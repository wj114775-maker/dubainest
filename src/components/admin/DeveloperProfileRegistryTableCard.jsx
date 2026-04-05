import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function toneForPartnership(status) {
  if (status === "partnered") return "bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/10";
  if (status === "paused") return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10";
  if (status === "archived") return "bg-slate-200 text-slate-600 hover:bg-slate-200";
  return "bg-slate-100 text-slate-600 hover:bg-slate-100";
}

function toneForPage(status) {
  if (status === "published") return "bg-primary/10 text-primary hover:bg-primary/10";
  if (status === "hidden") return "bg-slate-200 text-slate-700 hover:bg-slate-200";
  return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10";
}

export default function DeveloperProfileRegistryTableCard({ profiles, onEdit }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Developer page manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Developer</TableHead>
              <TableHead>Partnership</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Homepage</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{profile.developer_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge className={toneForPartnership(profile.partnership_status)}>
                    {String(profile.partnership_status || "not_partnered").replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={toneForPage(profile.page_status)}>
                      {String(profile.page_status || "draft").replace(/_/g, " ")}
                    </Badge>
                    {profile.page_status === "published" && profile.partnership_status === "partnered" ? (
                      <Link to={`/developers/${profile.slug}`} className="text-xs text-primary underline-offset-4 hover:underline">
                        View
                      </Link>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{profile.show_on_homepage ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onEdit(profile)}>Edit</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
