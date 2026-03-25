import { useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ConversionDetailDialog } from "./ConversionDetailDialog";
import type { StepConversion } from "./useConversionData";

interface Props {
  stepIndex: number;
  stepName: string;
  prevStepName?: string;
  leadsCount: number;
  conversion: StepConversion | null;
  dailyData: { date: string; leads: Record<number, number> }[];
  campaignId: string;
}

export function ColumnConversionBar({
  stepIndex, stepName, prevStepName, leadsCount, conversion, dailyData, campaignId
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);

  // First column — no conversion data
  if (stepIndex === 0 || !conversion) {
    return (
      <div
        className="mx-2 mt-1 px-2.5 py-1 rounded-md cursor-default"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11,
        }}
      >
        <span className="text-muted-foreground">Etapa inicial</span>
        <span className="text-muted-foreground mx-1">·</span>
        <span className="text-foreground font-medium">{leadsCount} leads</span>
      </div>
    );
  }

  const { rate, trend, trendDelta, leadsInB, lostLeads } = conversion;
  const rateDisplay = rate !== null ? `${Math.round(rate)}%` : "---";

  const rateColor =
    rate === null ? "#6b7280" :
    rate > 20 ? "#3B82F6" :
    rate >= 10 ? "#FFFFFF" :
    "#F59E0B";

  const trendColor =
    trend === "up" ? "#22c55e" :
    trend === "down" ? "#ef4444" :
    "#6b7280";

  const TrendIcon =
    trend === "up" ? TrendingUp :
    trend === "down" ? TrendingDown :
    Minus;

  const trendLabel =
    trend === "up" ? `+${trendDelta}%` :
    trend === "down" ? `${trendDelta}%` :
    "=";

  return (
    <>
      <button
        onClick={() => setDetailOpen(true)}
        className="mx-2 mt-1 px-2.5 py-1 rounded-md flex items-center gap-1.5 w-[calc(100%-16px)] hover:brightness-125 transition-all"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11,
        }}
      >
        <ArrowRight className="h-3 w-3 shrink-0" style={{ color: rateColor }} />
        <span className="font-semibold" style={{ color: rateColor }}>{rateDisplay}</span>

        <TrendIcon className="h-3 w-3 shrink-0 ml-0.5" style={{ color: trendColor }} />
        <span style={{ color: trendColor }}>{trendLabel}</span>

        <span className="text-muted-foreground mx-0.5">·</span>
        <span className="text-muted-foreground">{leadsInB} <span className="hidden sm:inline">recebidos</span></span>

        <span className="text-muted-foreground mx-0.5">·</span>
        <span className="text-muted-foreground">{lostLeads} <span className="hidden sm:inline">perdidos</span></span>
      </button>

      {detailOpen && conversion && (
        <ConversionDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          stepAName={prevStepName || ""}
          stepBName={stepName}
          stepAIndex={conversion.stepAIndex}
          stepBIndex={conversion.stepBIndex}
          dailyData={dailyData}
          conversion={conversion}
        />
      )}
    </>
  );
}
