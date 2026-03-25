import { useState } from "react";
import { Plus, Edit2, Trash2, FileText, Search, Copy, Wand2, Sparkles } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SCRIPT_OBJECTIVES } from "@/lib/scriptBlocks";
import ScriptChat from "@/components/script/ScriptChat";
import { useDraftStore } from "@/hooks/useDraftStore";

const typeLabels: Record<string, string> = {
  opening: "Abertura",
  follow_up: "Follow-up",
  closing: "Fechamento",
  objection_response: "Resposta a objeção",
};

const typeColors: Record<string, string> = {
  opening: "bg-primary/15 text-primary",
  follow_up: "bg-warning/15 text-warning",
  closing: "bg-success/15 text-success",
  objection_response: "bg-destructive/15 text-destructive",
};

const objectiveLabels: Record<string, string> = Object.fromEntries(
  SCRIPT_OBJECTIVES.map((o) => [o.value, o.label])
);

export default function Scripts() {
  const { scripts, addScript, updateScript, deleteScript, duplicateScript, refreshScripts } = useStore();
  const {
    scriptDraft: form, setScriptDraft: setForm,
    scriptDialogOpen: dialogOpen, setScriptDialogOpen: setDialogOpen,
    scriptEditing: editing, setScriptEditing: setEditing,
    clearScriptDraft,
  } = useDraftStore();
  const [search, setSearch] = useState("");
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [improveScript, setImproveScript] = useState<string | undefined>(undefined);

  const filtered = scripts.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const openChoice = () => setChoiceOpen(true);
  const openManual = () => {
    setChoiceOpen(false);
    setEditing(null);
    setForm({ name: "", type: "opening", content: "", tags: "" });
    setDialogOpen(true);
  };
  const openCopilot = () => { setChoiceOpen(false); setCopilotOpen(true); };
  const openEdit = (s: any) => {
    setEditing({ id: s.id });
    setForm({ name: s.name, type: s.type, content: s.content, tags: s.tags.join(", ") });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (editing) {
      await updateScript(editing.id, { name: form.name, type: form.type, content: form.content, tags });
      toast.success("Script atualizado");
    } else {
      await addScript({ name: form.name, type: form.type, content: form.content, tags });
      toast.success("Script criado");
    }
    clearScriptDraft();
  };

  const handleCancel = () => {
    clearScriptDraft();
  };

  const handleCopilotComplete = () => {
    setCopilotOpen(false);
    setImproveScript(undefined);
    refreshScripts();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Biblioteca de Scripts</h1>
          <p className="text-sm text-muted-foreground mt-1">Mensagens reutilizáveis para seus funis</p>
        </div>
        <button onClick={openChoice} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition">
          <Plus className="h-4 w-4" /> Novo Script
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar scripts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum script encontrado" description="Crie scripts para usar nos funis das suas campanhas" actionLabel="Criar Script" onAction={openChoice} />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Objetivo</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[s.type] || ""}`}>{typeLabels[s.type] || s.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {s.objective ? objectiveLabels[s.objective] || s.objective : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-sm truncate">{s.content}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setImproveScript(s.content); setCopilotOpen(true); }} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition" title="Melhorar com IA"><Sparkles className="h-3.5 w-3.5" /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={async () => { await duplicateScript(s.id); toast.success("Script duplicado"); }} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Duplicar"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={async () => { await deleteScript(s.id); toast.success("Script excluído"); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Choice dialog */}
      <Dialog open={choiceOpen} onOpenChange={setChoiceOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Como quer criar o script?</DialogTitle>
            <DialogDescription className="text-muted-foreground">Escolha entre criar manualmente ou usar o Copiloto de IA</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2">
            <button onClick={openCopilot} className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left hover:bg-primary/10 transition">
              <Wand2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Criar com Copiloto IA</p>
                <p className="text-xs text-muted-foreground mt-0.5">A IA conversa com você e cria o script sob medida</p>
              </div>
            </button>
            <button onClick={openManual} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4 text-left hover:bg-secondary transition">
              <Edit2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Criar manualmente</p>
                <p className="text-xs text-muted-foreground mt-0.5">Escreva o script do zero no editor</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Copilot fullscreen dialog */}
      <Dialog open={copilotOpen} onOpenChange={(open) => { setCopilotOpen(open); if (!open) setImproveScript(undefined); }}>
        <DialogContent className="bg-background border-border sm:max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-foreground">{improveScript ? "Melhorar Script com IA" : "Copiloto de Scripts"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{improveScript ? "A IA vai analisar e sugerir melhorias" : "Converse com a IA para criar seu script"}</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 flex-1 min-h-0">
            <ScriptChat onComplete={handleCopilotComplete} existingScript={improveScript} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) return; }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Editar Script" : "Novo Script"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input placeholder="Título" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              <option value="opening">Abertura</option>
              <option value="follow_up">Follow-up</option>
              <option value="closing">Fechamento</option>
              <option value="objection_response">Resposta a objeção</option>
            </select>
            <textarea placeholder="Conteúdo do script" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
            <input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <DialogFooter>
            <button onClick={handleCancel} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
            <button onClick={handleSave} disabled={!form.name.trim()} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">{editing ? "Salvar" : "Criar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
