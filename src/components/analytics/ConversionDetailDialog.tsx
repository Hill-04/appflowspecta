import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { StepConversion } from "./useConversionData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepAName: string;
  stepBName: string;
  stepAIndex: number;
  stepBIndex: number;
  dailyData: { date: string; leads: Record<number, number> }[];
  conversion: StepConversion;
}

export function ConversionDetailDialog({
  open, onOpenChange, stepAName, stepBName, stepAIndex, stepBIndex, dailyData, conversion
}: Props) {
  const chartData = useMemo(() => {
    return dailyData.map(day => {
      const a = day.leads[stepAIndex] || 0;
      const b = day.leads[stepBIndex] || 0;
      const total = a + b;
      const rate = total > 0 ? Math.round((b / total) * 100) : 0;
      const dateParts = day.date.split("-");
      return {
        label: `${dateParts[2]}/${dateParts[1]}`,
        rate,
        received: a + b,
        converted: b,
      };
    });
  }, [dailyData, stepAIndex, stepBIndex]);

  const totals = useMemo(() => {
    const received = chartData.reduce((s, d) => s + d.received, 0);
    const converted = chartData.reduce((s, d) => s + d.converted, 0);
    const avgRate = received > 0 ? Math.round((converted / received) * 100) : 0;
    return { received, converted, avgRate };
  }, [chartData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border" style={{ background: "#0D0E14" }}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-foreground">
            Conversão: {stepAName} → {stepBName}
          </DialogTitle>
        </DialogHeader>

        <div className="h-48 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1b23",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value}%`, "Taxa"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4, fill: "#3B82F6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Leads Recebidos</p>
            <p className="text-lg font-bold text-foreground">{totals.received}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Leads Convertidos</p>
            <p className="text-lg font-bold text-foreground">{totals.converted}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Taxa Média</p>
            <p className="text-lg font-bold" style={{ color: "#3B82F6" }}>{totals.avgRate}%</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
