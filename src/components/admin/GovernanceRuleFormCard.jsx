import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function GovernanceRuleFormCard({ title, fields, initialValues, record, onSubmit, submitLabel, onCancel }) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    if (!record) {
      setForm(initialValues);
      return;
    }

    const nextForm = { ...initialValues };
    fields.forEach((field) => {
      const value = record[field.key];
      if (field.json) nextForm[field.key] = JSON.stringify(value || {}, null, 2);
      else nextForm[field.key] = value === undefined || value === null ? "" : String(value);
    });
    setForm(nextForm);
  }, [record, initialValues, fields]);

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{record ? `Edit ${title.toLowerCase()}` : title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => field.multiline ? (
            <div key={field.key} className="md:col-span-2">
              <Textarea
                value={form[field.key] || ""}
                onChange={(e) => setForm((current) => ({ ...current, [field.key]: e.target.value }))}
                placeholder={field.label}
                className={field.json ? "min-h-[160px]" : undefined}
              />
            </div>
          ) : (
            <Input
              key={field.key}
              value={form[field.key] || ""}
              onChange={(e) => setForm((current) => ({ ...current, [field.key]: e.target.value }))}
              placeholder={field.label}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onSubmit(form)}>{record ? "Save changes" : submitLabel}</Button>
          {record ? <Button variant="outline" onClick={onCancel}>Cancel</Button> : null}
        </div>
      </CardContent>
    </Card>
  );
}