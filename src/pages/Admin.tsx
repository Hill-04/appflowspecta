import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminUsers, type AdminUser } from "@/hooks/useAdminUsers";
import { useAdminCoupons, type AdminCoupon } from "@/hooks/useAdminCoupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, RefreshCw, Search, XCircle, Trash2, Tag, Plus, Power } from "lucide-react";
import { format } from "date-fns";

const ROLES = ["owner", "admin", "member"] as const;
const PLANS = ["starter", "growth", "scale"] as const;

function roleBadge(role: string | null) {
  if (!role) return <Badge variant="outline">Sem role</Badge>;
  const colors: Record<string, string> = {
    owner: "bg-accent/20 text-accent border-accent/40",
    admin: "bg-primary/20 text-primary border-primary/40",
    member: "bg-muted text-muted-foreground border-border",
  };
  return <Badge className={colors[role] || ""}>{role}</Badge>;
}

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="outline">—</Badge>;
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/40",
    canceled: "bg-destructive/20 text-destructive border-destructive/40",
    past_due: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  };
  return <Badge className={colors[status] || ""}>{status}</Badge>;
}

export default function Admin() {
  const { isOwner, loading: roleLoading } = useUserRole();
  const { users, loading, fetchUsers, changeRole, changePlan, cancelSubscription, inviteUser, deleteUser } = useAdminUsers();
  const { coupons, loading: couponsLoading, fetchCoupons, createCoupon, toggleCoupon, deleteCoupon } = useAdminCoupons();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Invite modal state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [invitePlan, setInvitePlan] = useState("starter");
  const [inviteOpen, setInviteOpen] = useState(false);

  // Create coupon modal state
  const [couponOpen, setCouponOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percent" | "amount">("percent");
  const [newCouponDiscount, setNewCouponDiscount] = useState("10");
  const [newCouponAmountVal, setNewCouponAmountVal] = useState("");
  const [newCouponPlans, setNewCouponPlans] = useState<string[]>([]);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState("");
  const [newCouponExpires, setNewCouponExpires] = useState("");

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!isOwner) return <Navigate to="/" replace />;

  const filtered = users.filter((u) => {
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterPlan !== "all" && u.plan !== filterPlan) return false;
    if (filterStatus !== "all" && u.subscription_status !== filterStatus) return false;
    return true;
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    await inviteUser(inviteEmail, inviteRole, invitePlan);
    setInviteEmail("");
    setInviteOpen(false);
  };

  const handleCreateCoupon = async () => {
    if (!newCouponCode) return;
    await createCoupon({
      code: newCouponCode,
      discount_type: newCouponType,
      discount_percent: newCouponType === "percent" ? parseInt(newCouponDiscount) || 0 : 0,
      discount_amount: newCouponType === "amount" ? parseFloat(newCouponAmountVal) || 0 : 0,
      applies_to_plans: newCouponPlans.length > 0 ? newCouponPlans : [],
      max_uses: newCouponMaxUses ? parseInt(newCouponMaxUses) : null,
      expires_at: newCouponExpires || null,
    });
    setNewCouponCode("");
    setNewCouponType("percent");
    setNewCouponDiscount("10");
    setNewCouponAmountVal("");
    setNewCouponPlans([]);
    setNewCouponMaxUses("");
    setNewCouponExpires("");
    setCouponOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchUsers(); fetchCoupons(); }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Email</Label>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plano</Label>
                  <Select value={invitePlan} onValueChange={setInvitePlan}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleInvite}>Criar Usuário</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos planos</SelectItem>
            {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="canceled">canceled</SelectItem>
            <SelectItem value="past_due">past_due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiração</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onChangeRole={changeRole}
                  onChangePlan={changePlan}
                  onCancel={cancelSubscription}
                  onDelete={deleteUser}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Coupons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Cupons de Desconto</h2>
          </div>
          <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Criar Cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Cupom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Código</Label>
                  <Input
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="EX: TEST100"
                  />
                </div>
                <div>
                  <Label>Tipo de desconto</Label>
                  <Select value={newCouponType} onValueChange={(v: any) => setNewCouponType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentual (%)</SelectItem>
                      <SelectItem value="amount">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newCouponType === "percent" ? (
                  <div>
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Valor do desconto (R$)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newCouponAmountVal}
                      onChange={(e) => setNewCouponAmountVal(e.target.value)}
                      placeholder="Ex: 50"
                    />
                  </div>
                )}
                <div>
                  <Label>Planos aplicáveis (vazio = todos)</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PLANS.map((p) => (
                      <label key={p} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={newCouponPlans.includes(p)}
                          onChange={(e) => {
                            if (e.target.checked) setNewCouponPlans([...newCouponPlans, p]);
                            else setNewCouponPlans(newCouponPlans.filter((x) => x !== p));
                          }}
                          className="rounded border-border"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Máximo de usos (vazio = ilimitado)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <Label>Expira em (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={newCouponExpires}
                    onChange={(e) => setNewCouponExpires(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleCreateCoupon}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiração</TableHead>
                <TableHead>Planos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum cupom cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell>
                      {c.discount_type === "amount" ? `R$ ${c.discount_amount}` : `${c.discount_percent}%`}
                    </TableCell>
                    <TableCell>
                      {c.used_count}{c.max_uses !== null ? `/${c.max_uses}` : " / ∞"}
                    </TableCell>
                    <TableCell>
                      <Badge className={c.active ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-muted text-muted-foreground border-border"}>
                        {c.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.expires_at ? format(new Date(c.expires_at), "dd/MM/yyyy HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.applies_to_plans && c.applies_to_plans.length > 0 ? c.applies_to_plans.join(", ") : "Todos"}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCoupon(c.id)}
                        title={c.active ? "Desativar" : "Ativar"}
                      >
                        <Power className={`h-4 w-4 ${c.active ? "text-green-400" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteCoupon(c.id)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onChangeRole,
  onChangePlan,
  onCancel,
  onDelete,
}: {
  user: AdminUser;
  onChangeRole: (id: string, role: string) => void;
  onChangePlan: (id: string, plan: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <TableRow>
      <TableCell className="font-medium">{user.email}</TableCell>
      <TableCell>
        <Select value={user.role || ""} onValueChange={(v) => onChangeRole(user.id, v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue>{roleBadge(user.role)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select value={user.plan || ""} onValueChange={(v) => onChangePlan(user.id, v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue>{user.plan || "—"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>{statusBadge(user.subscription_status)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {user.current_period_end ? format(new Date(user.current_period_end), "dd/MM/yyyy") : "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {user.billing_period === "annual" ? "Anual" : user.billing_period === "monthly" ? "Mensal" : "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground capitalize">
        {user.payment_method || "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "—"}
      </TableCell>
      <TableCell className="text-right flex items-center justify-end gap-1">
        {user.subscription_status === "active" && (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onCancel(user.id)} title="Cancelar assinatura">
            <XCircle className="h-4 w-4" />
          </Button>
        )}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <Button variant="destructive" size="sm" onClick={() => { onDelete(user.id); setConfirmDelete(false); }}>
              Confirmar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Não
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} title="Remover usuário">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
