import { useState } from "react";
import { Plus, Trash2, Copy, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { useDraftStore } from "@/hooks/useDraftStore";

export default function ScriptSets() {
  const { scriptSets, addScriptSet, deleteScriptSet, addScriptSetItem, updateScriptSetItem, deleteScriptSetItem } = useStore();
  const {
    scriptSetDraft, setScriptSetDraft,
    scriptSetFormOpen: showNewForm, setScriptSetFormOpen: setShowNewForm,
    clearScriptSetDraft,
  } = useDraftStore();
  const [expandedSet, setExpandedSet] = useState<string | null>(null);

  const newSetName = scriptSetDraft.newSetName;
  const setNewSetName = (val: string) => setScriptSetDraft({ newSetName: val });

  const handleCreate = async () => {
    if (!newSetName.trim()) return;
    await addScriptSet(newSetName.trim());
    clearScriptSetDraft();
    toast.success("Conjunto criado!");
  };

  const handleCancel = () => { clearScriptSetDraft(); };

  const handleAddItem = async (setId: string, order: number) => {
    await addScriptSetItem(setId, order, "", "");
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Scripts</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize seus scripts em conjuntos reutilizáveis</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition glow-primary w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Novo Conjunto
        </button>
      </div>

      {showNewForm && (
        <div className="glass-card p-4 flex items-center gap-3">
          <input value={newSetName} onChange={(e) => setNewSetName(e.target.value)} placeholder="Nome do conjunto" className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" onKeyDown={(e) => e.key === "Enter" && handleCreate()} autoFocus />
          <button onClick={handleCreate} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">Criar</button>
          <button onClick={handleCancel} className="text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
        </div>
      )}

      {scriptSets.length === 0 && !showNewForm ? (
        <EmptyState icon={FileText} title="Nenhum conjunto de scripts" description="Crie conjuntos de scripts para organizar suas mensagens" actionLabel="Novo Conjunto" onAction={() => setShowNewForm(true)} />
      ) : (
        <div className="space-y-3">
          {scriptSets.map((set) => {
            const isExpanded = expandedSet === set.id;
            return (
              <div key={set.id} className="glass-card overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition" onClick={() => setExpandedSet(isExpanded ? null : set.id)}>
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="font-semibold text-foreground">{set.name}</h3>
                    <span className="text-xs text-muted-foreground">({set.items.length} scripts)</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteScriptSet(set.id); toast.success("Conjunto excluído"); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    {set.items.sort((a, b) => a.stepOrder - b.stepOrder).map((item) => (
                      <ScriptItemEditor key={item.id} item={item}
                        onUpdateTitle={(val) => updateScriptSetItem(item.id, { title: val })}
                        onUpdateContent={(val) => updateScriptSetItem(item.id, { content: val })}
                        onCopy={() => handleCopy(item.content)}
                        onDelete={() => { deleteScriptSetItem(item.id); toast.success("Script removido"); }}
                      />
                    ))}
                    <button onClick={() => handleAddItem(set.id, set.items.length + 1)} className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition">
                      <Plus className="inline h-4 w-4 mr-1" /> Adicionar Script
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScriptItemEditor({ item, onUpdateTitle, onUpdateContent, onCopy, onDelete }: {
  item: { id: string; stepOrder: number; title: string; content: string };
  onUpdateTitle: (val: string) => void; onUpdateContent: (val: string) => void; onCopy: () => void; onDelete: () => void;
}) {
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localContent, setLocalContent] = useState(item.content);

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md gradient-primary text-primary-foreground text-xs font-bold shrink-0">{item.stepOrder}</span>
        <input value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} onBlur={() => { if (localTitle !== item.title) onUpdateTitle(localTitle); }} placeholder="Título do script" className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none border-b border-transparent focus:border-primary transition" />
        <button onClick={onCopy} className="inline-flex items-center gap-1 rounded-md gradient-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition"><Copy className="h-3 w-3" /> Copiar</button>
        <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <textarea value={localContent} onChange={(e) => setLocalContent(e.target.value)} onBlur={() => { if (localContent !== item.content) onUpdateContent(localContent); }} placeholder="Conteúdo do script..." rows={3} className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none transition" />
    </div>
  );
}
