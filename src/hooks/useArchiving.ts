import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";

export function useArchiving() {
  const { user } = useAuth();
  const { refreshCampaigns } = useStore();

  const checkAndArchive = async () => {
    if (!user) return;

    const { data: settings } = await supabase
      .from("archive_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!settings) return;

    const today = new Date();

    // 1. Archive converted leads
    if ((settings as any).archive_converted !== "manual") {
      let shouldArchiveConverted = false;
      const archiveConverted = (settings as any).archive_converted;
      const customDay = (settings as any).archive_converted_custom_day;

      if (archiveConverted === "first_of_month" && today.getDate() === 1) {
        shouldArchiveConverted = true;
      } else if (archiveConverted === "custom_date" && today.getDate() === customDay) {
        shouldArchiveConverted = true;
      }

      if (shouldArchiveConverted || archiveConverted === "after_30_days") {
        const { data: convertedLeads } = await (supabase
          .from("campaign_leads")
          .select("id, converted_at, campaign_id") as any)
          .is("archived_at", null)
          .not("converted_at", "is", null);

        for (const lead of convertedLeads || []) {
          let shouldArchive = shouldArchiveConverted;
          if (archiveConverted === "after_30_days" && lead.converted_at) {
            const convertedDate = new Date(lead.converted_at);
            const daysSince = Math.floor(
              (today.getTime() - convertedDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            shouldArchive = daysSince >= 30;
          }
          if (shouldArchive) {
            await supabase
              .from("campaign_leads")
              .update({ archived_at: new Date().toISOString(), archive_reason: "converted" } as any)
              .eq("id", lead.id);
          }
        }
      }
    }

    // 2. Archive inactive leads
    const inactiveDays = (settings as any).archive_inactive_days;
    if (inactiveDays && inactiveDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      const { data: inactiveLeads } = await (supabase
        .from("campaign_leads")
        .select("id, created_at, campaign_id") as any)
        .is("archived_at", null)
        .is("converted_at", null)
        .lt("created_at", cutoffDate.toISOString());

      for (const lead of inactiveLeads || []) {
        await supabase
          .from("campaign_leads")
          .update({ archived_at: new Date().toISOString(), archive_reason: "inactive" } as any)
          .eq("id", lead.id);
      }
    }

    await refreshCampaigns();
  };

  useEffect(() => {
    checkAndArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { checkAndArchive };
}
