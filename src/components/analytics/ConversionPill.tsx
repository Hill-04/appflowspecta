import { useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConversionDetailDialog } from "./ConversionDetailDialog";
import type { StepConversion } from "./useConversionData";

interface Props {
  conversion: StepConversion;
  stepAName: string;
  stepBName: string;
  campaignId: string;
  dailyData: { date: string; leads: Record<number, number> }[];
}

function getRateColor(rate: number): string {
  if (rate > 20) return "#3B82F6";
  if (rate >= 10) return "#FFFFFF";
  return "#F59E0B";
}

function getTrendColor(trend: "up" | "down" | "neutral"): string {
  if (trend === "up") return "#22c55e";
  if (trend === "down") return "#ef4444";
  return "#6b7280";
}

export function ConversionPill({ conversion, stepAName, stepBName, campaignId, dailyData }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { rate, trend, trendDelta, lostLeads } = conversion;

  const rateText = rate !== null ? `${Math.round(rate)}%` : "—";
  const trendIcon = trend === "up" ? <TrendingUp className="h-2.5 w-2.5" /> : trend === "down" ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />;
  const trendText = trendDelta !== 0 ? `${trendDelta > 0 ? "+" : ""}${trendDelta}%` : "=";

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setDialogOpen(true)}
              className="hidden md:flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-full transition-all duration-500 ease-out hover:scale-105 pointer-events-auto cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span
                  className="text-[13px] font-bold leading-none"
                  style={{ color: rate !== null ? getRateColor(rate) : "#6b7280" }}
                >
                  {rateText}
                </span>
              </span>
              <span
                className="flex items-center gap-0.5 text-[10px] leading-none"
                style={{ color: getTrendColor(trend) }}
              >
                {trendIcon}
                {trendText}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {lostLeads} lead{lostLeads !== 1 ? "s" : ""} perdido{lostLeads !== 1 ? "s" : ""} nesta etapa nos últimos 7 dias
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ConversionDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stepAName={stepAName}
        stepBName={stepBName}
        stepAIndex={conversion.stepAIndex}
        stepBIndex={conversion.stepBIndex}
        dailyData={dailyData}
        conversion={conversion}
      />
    </>
  );
}
