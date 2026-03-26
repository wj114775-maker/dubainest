import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import { Button } from '@/components/ui/button';
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';

export default function AreaDetail() {
  const { slug } = useParams();
  const [open, setOpen] = useState(false);

  const { data: area } = useQuery({
    queryKey: ["area", slug],
    enabled: !!slug,
    queryFn: async () => {
      const areas = await base44.entities.Area.filter({ slug });
      return areas[0] || null;
    },
    initialData: null,
  });

  return (
    <>
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Area intelligence" title={area?.name || slug?.replace(/-/g, " ") || "Dubai area"} description={area?.description || `City: ${area?.city || 'Dubai'}`} actions={<Button onClick={() => setOpen(true)}>Request area consultation</Button>} />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Demand score" value={String(area?.investor_score || 0)} />
        <MetricCard label="Median price" value={area?.avg_sale_price ? `AED ${Number(area.avg_sale_price).toLocaleString()}` : 'On request'} />
        <MetricCard label="Average yield" value={area?.avg_rental_yield ? `${area.avg_rental_yield}%` : '—'} />
        <MetricCard label="Family fit" value={`${area?.family_score || 0}/100`} />
      </div>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="area_consultation" areaId={area?.id || ''} title="Area consultation" />
    </>
  );
}