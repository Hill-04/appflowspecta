import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeadRow {
  step_index: number;
  updated_at: string;
  archived_at: string | null;
}

export interface StepConversion {
  stepAIndex: number;
  stepBIndex: number;
  leadsInA: number;
  leadsInB: number;
  rate: number | null; // null = no data
  previousRate: number | null;
  trend: "up" | "down" | "neutral";
  trendDelta: number;
  lostLeads: number;
}

export function useConversionData(campaignId: string) {
  const [leads7, setLeads7] = useState<LeadRow[]>([]);
  const [leads14, setLeads14] = useState<LeadRow[]>([]);
  const [oldestDate, setOldestDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const fetchData = async () => {
      setLoading(true);
      // Fetch last 14 days in one query
      const { data } = await supabase
        .from("campaign_leads")
        .select("step_index, updated_at, archived_at")
        .eq("campaign_id", campaignId)
        .is("archived_at", null)
        .gte("updated_at", fourteenDaysAgo);

      const rows = (data || []) as LeadRow[];
      
      const recent = rows.filter(r => r.updated_at >= sevenDaysAgo);
      const older = rows.filter(r => r.updated_at < sevenDaysAgo);
      
      setLeads7(recent);
      setLeads14(older);

      // Get oldest lead date for "days of data" calculation
      const { data: oldestRow } = await supabase
        .from("campaign_leads")
        .select("created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true })
        .limit(1);
      
      if (oldestRow && oldestRow.length > 0) {
        setOldestDate(oldestRow[0].created_at);
      }
      setLoading(false);
    };

    fetchData();
  }, [campaignId]);

  const stepCounts7 = useMemo(() => {
    const map: Record<number, number> = {};
    for (const row of leads7) {
      map[row.step_index] = (map[row.step_index] || 0) + 1;
    }
    return map;
  }, [leads7]);

  const stepCounts14 = useMemo(() => {
    const map: Record<number, number> = {};
    for (const row of leads14) {
      map[row.step_index] = (map[row.step_index] || 0) + 1;
    }
    return map;
  }, [leads14]);

  const daysOfData = useMemo(() => {
    if (!oldestDate) return 0;
    const diff = Date.now() - new Date(oldestDate).getTime();
    return Math.min(7, Math.floor(diff / (24 * 60 * 60 * 1000)));
  }, [oldestDate]);

  // Daily data for chart (last 7 days)
  const dailyData = useMemo(() => {
    const days: { date: string; leads: Record<number, number> }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, leads: {} });
    }
    for (const row of leads7) {
      const dateStr = row.updated_at.slice(0, 10);
      const day = days.find(d => d.date === dateStr);
      if (day) {
        day.leads[row.step_index] = (day.leads[row.step_index] || 0) + 1;
      }
    }
    return days;
  }, [leads7]);

  function getConversion(stepAIndex: number, stepBIndex: number): StepConversion {
    const a7 = stepCounts7[stepAIndex] || 0;
    const b7 = stepCounts7[stepBIndex] || 0;
    const total7 = a7 + b7;
    const rate = total7 > 0 ? (b7 / total7) * 100 : null;

    const a14 = stepCounts14[stepAIndex] || 0;
    const b14 = stepCounts14[stepBIndex] || 0;
    const total14 = a14 + b14;
    const previousRate = total14 > 0 ? (b14 / total14) * 100 : null;

    let trend: "up" | "down" | "neutral" = "neutral";
    let trendDelta = 0;
    if (rate !== null && previousRate !== null) {
      trendDelta = Math.round(rate - previousRate);
      if (trendDelta > 0) trend = "up";
      else if (trendDelta < 0) trend = "down";
    }

    return {
      stepAIndex,
      stepBIndex,
      leadsInA: a7,
      leadsInB: b7,
      rate,
      previousRate,
      trend,
      trendDelta,
      lostLeads: a7, // leads that stayed in A
    };
  }

  return { stepCounts7, stepCounts14, dailyData, daysOfData, loading, getConversion };
}
