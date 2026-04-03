import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function buildInitialState(fields, initialValues = {}) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.key] = initialValues[field.key] ?? (field.type === "checkbox" ? false : "");
    return accumulator;
  }, {});
}

export default function WorkflowDialog({
  title,
  description,
  actionLabel,
  fields = [],
  initialValues = {},
  loading = false,
  onSubmit,
  children
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => buildInitialState(fields, initialValues));
  const defaultState = useMemo(() => buildInitialState(fields, initialValues), [fields, initialValues]);

  useEffect(() => {
    if (open) {
      setForm(defaultState);
    }
  }, [open, defaultState]);

  const requiredFieldsValid = fields.every((field) => {
    if (!field.required) return true;
    if (field.type === "checkbox") return Boolean(form[field.key]);
    return String(form[field.key] ?? "").trim().length > 0;
  });

  const handleSubmit = async () => {
    await onSubmit?.(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => {
            if (field.type === "textarea") {
              return (
                <div key={field.key} className={field.fullWidth === false ? "" : "md:col-span-2"}>
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Textarea
                    id={field.key}
                    value={form[field.key] || ""}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    placeholder={field.placeholder || field.label}
                    className="mt-2 min-h-28"
                  />
                </div>
              );
            }

            if (field.type === "select") {
              return (
                <div key={field.key} className={field.fullWidth ? "md:col-span-2" : ""}>
                  <Label>{field.label}</Label>
                  <Select value={String(form[field.key] || "")} onValueChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={field.placeholder || field.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options || []).map((option) => {
                        const value = typeof option === "string" ? option : option.value;
                        const label = typeof option === "string" ? option : option.label;
                        return <SelectItem key={value} value={value}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (field.type === "checkbox") {
              return (
                <div key={field.key} className={field.fullWidth === false ? "flex items-center gap-3 pt-6" : "flex items-center gap-3 pt-6 md:col-span-2"}>
                  <Checkbox id={field.key} checked={Boolean(form[field.key])} onCheckedChange={(value) => setForm((current) => ({ ...current, [field.key]: Boolean(value) }))} />
                  <Label htmlFor={field.key}>{field.label}</Label>
                </div>
              );
            }

            return (
              <div key={field.key} className={field.fullWidth ? "md:col-span-2" : ""}>
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || "text"}
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder || field.label}
                  className="mt-2"
                />
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!requiredFieldsValid || loading}>{actionLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
