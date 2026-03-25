import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CalendarConnection {
  connected: boolean;
  expired: boolean;
  connection: {
    id: string;
    provider: string;
    calendar_id: string;
    connected_at: string;
    expiry_date: string;
  } | null;
}

interface CalendarEvent {
  id: string;
  lead_id: string;
  campaign_id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  location: string | null;
  start_datetime: string;
  end_datetime: string | null;
  duration_minutes: number;
  status: string;
  priority: string;
  source: string;
  sync_status: string;
  google_event_id: string | null;
  is_overdue: boolean;
  completed_at: string | null;
  created_at: string;
}

export function useGoogleCalendar() {
  const { session } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<CalendarConnection | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth?action=status");
      if (error) throw error;
      setConnectionStatus(data as CalendarConnection);
    } catch (err: any) {
      console.error("Status check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const connect = useCallback(async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/google-calendar/callback`;
      const { data, error } = await supabase.functions.invoke("google-calendar-auth?action=auth-url", {
        method: "POST",
        body: { redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
        toast.error("Não foi possível gerar URL de autorização");
      }
    } catch (err: any) {
      toast.error("Erro ao conectar: " + err.message);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke("google-calendar-auth?action=disconnect", { method: "POST" });
      if (error) throw error;
      setConnectionStatus({ connected: false, expired: false, connection: null });
      toast.success("Google Calendar desconectado");
    } catch (err: any) {
      toast.error("Erro ao desconectar: " + err.message);
    }
  }, []);

  const retrySync = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-events?action=retry-sync", { method: "POST" });
      if (error) throw error;
      toast.success(`Sincronização: ${data.synced} eventos sincronizados, ${data.failed} falhas`);
      return data;
    } catch (err: any) {
      toast.error("Erro na sincronização: " + err.message);
    }
  }, []);

  const createEvent = useCallback(async (event: {
    lead_id: string;
    campaign_id: string;
    type: string;
    title: string;
    description?: string;
    location?: string;
    start_datetime: string;
    end_datetime?: string;
    duration_minutes?: number;
    priority?: string;
    source?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-events?action=create", {
        method: "POST",
        body: event,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Evento criado!");
      return data as CalendarEvent;
    } catch (err: any) {
      toast.error("Erro ao criar evento: " + err.message);
      return null;
    }
  }, []);

  const completeEvent = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-events?action=complete", {
        method: "POST",
        body: { id },
      });
      if (error) throw error;
      toast.success("Evento concluído!");
      return data as CalendarEvent;
    } catch (err: any) {
      toast.error("Erro ao concluir evento: " + err.message);
      return null;
    }
  }, []);

  const cancelEvent = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-events?action=cancel", {
        method: "POST",
        body: { id },
      });
      if (error) throw error;
      toast.success("Evento cancelado");
      return data as CalendarEvent;
    } catch (err: any) {
      toast.error("Erro ao cancelar evento: " + err.message);
      return null;
    }
  }, []);

  const listEvents = useCallback(async (params: { lead_id?: string; campaign_id?: string }) => {
    try {
      const query = new URLSearchParams();
      if (params.lead_id) query.set("lead_id", params.lead_id);
      if (params.campaign_id) query.set("campaign_id", params.campaign_id);
      const { data, error } = await supabase.functions.invoke(`google-calendar-events?action=list&${query.toString()}`);
      if (error) throw error;
      return (data || []) as CalendarEvent[];
    } catch (err: any) {
      console.error("List events failed:", err);
      return [];
    }
  }, []);

  return {
    connectionStatus,
    loading,
    checkStatus,
    connect,
    disconnect,
    retrySync,
    createEvent,
    completeEvent,
    cancelEvent,
    listEvents,
  };
}

export type { CalendarEvent, CalendarConnection };
