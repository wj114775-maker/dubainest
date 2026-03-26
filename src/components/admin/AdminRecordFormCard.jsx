import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AdminRecordFormCard({ title, fields, values, onChange, onSubmit, submitLabel = "Save" }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => field.multiline ? (
            <div key={field.key} className="md:col-span-2">
              <Textarea value={values[field.key] || ""} onChange={(e) => onChange(field.key, e.target.value)} placeholder={field.label} />
            </div>
          ) : (
            <Input key={field.key} value={values[field.key] || ""} onChange={(e) => onChange(field.key, e.target.value)} placeholder={field.label} />
          ))}
        </div>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </CardContent>
    </Card>
  );
}