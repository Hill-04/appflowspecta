import { useState } from "react";
import { Plus, Edit2, Trash2, Users, Search } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useDraftStore } from "@/hooks/useDraftStore";

export default function Audiences() {
  const { audiences, addAudience, updateAudience, deleteAudience } = useStore();
  const { canCreateAudience } = useSubscription();
  const {
    audienceDraft: form, setAudienceDraft: setForm,
    audienceDialogOpen: dialogOpen, setAudienceDialogOpen: setDialogOpen,
    audienceEditing: editing, setAudienceEditing: setEditing,
    clearAudienceDraft,
  } = useDraftStore();
  const [search, setSearch] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const filtered = audiences.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    if (!canCreateAudience(audiences.length)) { setUpgradeOpen(true); return; }
    setEditing(null); setForm({ name: "", description: "", segment: "", criteria: "" }); setDialogOpen(true);
  };
  const openEdit = (a: any) => {
    setEditing({ id: a.id });
    setForm({ name: a.name, description: a.description, segment: a.segment, criteria: a.criteria.join(", ") });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const criteria = form.criteria.split(",").map((c) => c.trim()).filter(Boolean);
    if (editing) {
      await updateAudience(editing.id, { name: form.name, description: form.description, segment: form.segment, criteria });
      toast.success("Público atualizado");
    } else {
      await addAudience({ name: form.name, description: form.description, segment: form.segment, criteria });
      toast.success("Público criado");
    }
    clearAudienceDraft();
  };

  const handleCancel = () => { clearAudienceDraft(); };
  const handleDelete = async (id: string) => { await deleteAudience(id); toast.success("Público excluído"); };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Biblioteca de Públicos</h1>
          <p className="text-sm text-muted-foreground mt-1">Públicos reutilizáveis para suas campanhas</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Novo Público
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar públicos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum público encontrado" description="Crie públicos-alvo para usar nas suas campanhas" actionLabel="Criar Público" onAction={openNew} />
      ) : (
        <>
          <div className="glass-card overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Critérios</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{a.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{a.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.criteria.map((c, i) => (
                          <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((a) => (
              <div key={a.id} className="glass-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.criteria.map((c, i) => (
                    <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) return; }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Editar Público" : "Novo Público"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
            <input placeholder="Segmento" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <input placeholder="Critérios (separados por vírgula)" value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <DialogFooter>
            <button onClick={handleCancel} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
            <button onClick={handleSave} disabled={!form.name.trim()} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">{editing ? "Salvar" : "Criar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} message="Você atingiu o limite de públicos do seu plano. Faça upgrade para criar mais públicos." />
    </div>
  );
}
