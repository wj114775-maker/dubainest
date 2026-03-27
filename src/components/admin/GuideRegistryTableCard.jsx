import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function GuideRegistryTableCard({ guides, onEdit }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Guide registry</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guides.map((guide) => (
              <TableRow key={guide.id}>
                <TableCell>
                  <p className="font-medium">{guide.title}</p>
                  <p className="text-xs text-muted-foreground">{guide.slug}</p>
                </TableCell>
                <TableCell className="capitalize">{guide.category?.replace(/_/g, " ")}</TableCell>
                <TableCell><Badge className="bg-primary/10 text-primary hover:bg-primary/10">{guide.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onEdit(guide)}>Edit</Button>
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