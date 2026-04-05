import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function toneForPage(status) {
  if (status === "published") return "bg-primary/10 text-primary hover:bg-primary/10";
  if (status === "hidden") return "bg-slate-200 text-slate-700 hover:bg-slate-200";
  return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10";
}

export default function ProjectProfileRegistryTableCard({ profiles, onEdit }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Project page manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Developer</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Homepage</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{profile.project_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.slug}</p>
                </TableCell>
                <TableCell>{profile.developer_name || "Not linked"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={toneForPage(profile.page_status)}>{String(profile.page_status || "draft").replace(/_/g, " ")}</Badge>
                    {profile.page_status === "published" ? (
                      <Link to={`/projects/${profile.slug}`} className="text-xs text-primary underline-offset-4 hover:underline">
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
