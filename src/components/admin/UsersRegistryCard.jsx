import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function UsersRegistryCard({ users }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Identity and access registry</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Legacy role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link to={`/ops/users/${user.id}`} className="block hover:opacity-80">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </Link>
                </TableCell>
                <TableCell><Badge variant="outline">{user.legacyRole}</Badge></TableCell>
                <TableCell><Badge className="bg-primary/10 text-primary hover:bg-primary/10">{user.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{user.assignmentCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}