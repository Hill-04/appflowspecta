import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  role: string | null;
  role_id: string | null;
  plan: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  billing_period: string | null;
  payment_method: string | null;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const callAdmin = useCallback(async (action: string, userId?: string, data?: Record<string, string>) => {
    const { data: result, error } = await supabase.functions.invoke("admin-manage-user", {
      body: { action, userId, data },
    });
    if (error) throw new Error(error.message);
    if (result?.error) throw new Error(result.error);
    return result;
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdmin("list_users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar usuários", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [callAdmin, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const changeRole = async (userId: string, role: string) => {
    try {
      await callAdmin("change_role", userId, { role });
      toast({ title: "Role alterada com sucesso" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao alterar role", description: err.message, variant: "destructive" });
    }
  };

  const changePlan = async (userId: string, plan: string) => {
    try {
      await callAdmin("change_plan", userId, { plan });
      toast({ title: "Plano alterado com sucesso" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao alterar plano", description: err.message, variant: "destructive" });
    }
  };

  const cancelSubscription = async (userId: string) => {
    try {
      await callAdmin("cancel_subscription", userId);
      toast({ title: "Assinatura cancelada com sucesso" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao cancelar assinatura", description: err.message, variant: "destructive" });
    }
  };

  const inviteUser = async (email: string, role: string, plan: string) => {
    try {
      await callAdmin("invite_user", undefined, { email, role, plan });
      toast({ title: "Usuário convidado com sucesso" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao convidar usuário", description: err.message, variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await callAdmin("delete_user", userId);
      toast({ title: "Usuário removido com sucesso" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao remover usuário", description: err.message, variant: "destructive" });
    }
  };

  return { users, loading, fetchUsers, changeRole, changePlan, cancelSubscription, inviteUser, deleteUser };
}
