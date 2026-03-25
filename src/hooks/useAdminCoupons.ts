import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_percent: number;
  discount_amount: number;
  applies_to_plans: string[] | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function useAdminCoupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const callAdmin = useCallback(async (action: string, data?: Record<string, any>) => {
    const { data: result, error } = await supabase.functions.invoke("admin-manage-user", {
      body: { action, data },
    });
    if (error) throw new Error(error.message);
    if (result?.error) throw new Error(result.error);
    return result;
  }, []);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdmin("list_coupons");
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar cupons", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [callAdmin, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const createCoupon = async (coupon: {
    code: string;
    discount_type: string;
    discount_percent: number;
    discount_amount: number;
    applies_to_plans: string[];
    max_uses?: number | null;
    expires_at?: string | null;
  }) => {
    try {
      await callAdmin("create_coupon", coupon);
      toast({ title: "Cupom criado com sucesso" });
      await fetchCoupons();
    } catch (err: any) {
      toast({ title: "Erro ao criar cupom", description: err.message, variant: "destructive" });
    }
  };

  const toggleCoupon = async (couponId: string) => {
    try {
      await callAdmin("toggle_coupon", { coupon_id: couponId });
      toast({ title: "Cupom atualizado" });
      await fetchCoupons();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar cupom", description: err.message, variant: "destructive" });
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await callAdmin("delete_coupon", { coupon_id: couponId });
      toast({ title: "Cupom removido" });
      await fetchCoupons();
    } catch (err: any) {
      toast({ title: "Erro ao remover cupom", description: err.message, variant: "destructive" });
    }
  };

  return { coupons, loading, fetchCoupons, createCoupon, toggleCoupon, deleteCoupon };
}
