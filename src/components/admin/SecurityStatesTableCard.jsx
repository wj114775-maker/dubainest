import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SecurityStatesTableCard({ rows }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>User security states</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Suspended</TableHead>
              <TableHead>Locked</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </TableCell>
                <TableCell><Badge className="bg-primary/10 text-primary hover:bg-primary/10">{row.security_status}</Badge></TableCell>
                <TableCell>{row.is_suspended ? "Yes" : "No"}</TableCell>
                <TableCell>{row.is_locked ? "Yes" : "No"}</TableCell>
                <TableCell><Link to={`/ops/users/${row.user_id}`} className="text-sm text-primary underline-offset-4 hover:underline">Open user</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}