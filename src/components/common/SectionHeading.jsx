import React from "react";

export default function SectionHeading({ eyebrow, title, description, action, titleAs: TitleTag = "h2" }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl space-y-3">
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</p> : null}
        <TitleTag className="text-[2rem] font-semibold leading-tight tracking-tight text-slate-950 md:text-[2.6rem]">
          {title}
        </TitleTag>
        {description ? <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-[0.98rem]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
