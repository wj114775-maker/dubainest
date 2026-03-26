import React from "react";

export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.32em] text-primary">{eyebrow}</p> : null}
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground md:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}