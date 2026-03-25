import { useState } from "react";
import { Plus, Edit2, Trash2, Shield, Search } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UpgradeGate } from "@/components/UpgradeGate";
import { useDraftStore } from "@/hooks/useDraftStore";

export default function Objections() {
  const { objections, addObjection, updateObjection, deleteObjection } = useStore();
  const {
    objectionDraft: form, setObjectionDraft: setForm,
    objectionDialogOpen: dialogOpen, setObjectionDialogOpen: setDialogOpen,
    objectionEditing: editing, setObjectionEditing: setEditing,
    clearObjectionDraft,
  } = useDraftStore();
  const [search, setSearch] = useState("");

  const filtered = objections.filter((o) =>
    o.objection.toLowerCase().includes(search.toLowerCase()) ||
    o.category.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm({ title: "", response: "", category: "" }); setDialogOpen(true); };
  const openEdit = (o: any) => {
    setEditing({ id: o.id });
    setForm({ title: o.objection, response: o.response, category: o.category });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editing) {
      await updateObjection(editing.id, form);
      toast.success("Objeção atualizada");
    } else {
      await addObjection(form);
      toast.success("Objeção criada");
    }
    clearObjectionDraft();
  };

  const handleCancel = () => { clearObjectionDraft(); };

  return (
    <UpgradeGate feature="objection_library" fallbackMessage="Biblioteca de Objeções disponível a partir do plano Growth">
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Biblioteca de Objeções</h1>
          <p className="text-sm text-muted-foreground mt-1">Respostas prontas para objeções comuns</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nova Objeção
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar objeções..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="Nenhuma objeção encontrada" description="Cadastre objeções e respostas para sua equipe" actionLabel="Criar Objeção" onAction={openNew} />
      ) : (
        <>
          <div className="glass-card overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoria</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Objeção</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resposta</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Freq.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                    <td className="px-4 py-3"><span className="rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">{o.category}</span></td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-xs">{o.objection}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-sm truncate">{o.response}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{o.frequency}x</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(o)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={async () => { await deleteObjection(o.id); toast.success("Objeção excluída"); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((o) => (
              <div key={o.id} className="glass-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">{o.category}</span>
                      <span className="text-xs text-muted-foreground">{o.frequency}x</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{o.objection}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{o.response}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(o)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={async () => { await deleteObjection(o.id); toast.success("Objeção excluída"); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) return; }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Editar Objeção" : "Nova Objeção"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <input placeholder="Categoria (ex: Preço, Tempo)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <textarea placeholder="Objeção do prospect" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} rows={2} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
            <textarea placeholder="Resposta sugerida" value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
          </div>
          <DialogFooter>
            <button onClick={handleCancel} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
            <button onClick={handleSave} disabled={!form.title.trim()} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">{editing ? "Salvar" : "Criar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </UpgradeGate>
  );
}
