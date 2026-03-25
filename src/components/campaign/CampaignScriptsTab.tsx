import { useState } from "react";
import { Copy, FileText, ChevronDown, Plus, Trash2, Edit2, GripVertical, ChevronUp, ChevronDown as ChevronDownIcon } from "lucide-react";
import { Campaign, useStore } from "@/hooks/useStore";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDraftStore } from "@/hooks/useDraftStore";

interface Props {
  campaign: Campaign;
}

export function CampaignScriptsTab({ campaign }: Props) {
  const { scriptSets, updateCampaign, addScriptSet, addScriptSetItem, updateScriptSetItem, deleteScriptSetItem } = useStore();
  const {
    campaignScriptDraft, setCampaignScriptDraft,
    campaignScriptDialogOpen: dialogOpen, setCampaignScriptDialogOpen: setDialogOpen,
    clearCampaignScriptDraft,
  } = useDraftStore();
  const [selectedSetId, setSelectedSetId] = useState<string>(campaign.scriptSetId || "");

  const newSetName = campaignScriptDraft.newSetName;
  const initialScriptTitle = campaignScriptDraft.initialScriptTitle;
  const initialScriptContent = campaignScriptDraft.initialScriptContent;

  // Inline editing state (local, not draft-persisted)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemContent, setNewItemContent] = useState("");

  const handleSelectSet = async (setId: string) => {
    setSelectedSetId(setId);
    await updateCampaign(campaign.id, { script_set_id: setId || null } as any);
  };

  const handleCopy = (content: string) => { navigator.clipboard.writeText(content); toast.success("Script copiado!"); };

  const handleCreateSet = async () => {
    if (!newSetName.trim() || !initialScriptTitle.trim()) return;
    const newId = await addScriptSet(newSetName.trim());
    if (newId) {
      await addScriptSetItem(newId, 1, initialScriptTitle.trim(), initialScriptContent.trim());
      await handleSelectSet(newId);
      toast.success("Conjunto criado com script inicial!");
    }
    clearCampaignScriptDraft();
  };

  const handleCancelCreate = () => { clearCampaignScriptDraft(); };

  const handleOpenCreate = () => {
    setCampaignScriptDraft({ newSetName: "", initialScriptTitle: "Abordagem Inicial", initialScriptContent: "" });
    setDialogOpen(true);
  };

  const handleStartEdit = (item: { id: string; title: string; content: string }) => { setEditingItemId(item.id); setEditTitle(item.title); setEditContent(item.content); };
  const handleSaveEdit = async () => { if (!editingItemId) return; await updateScriptSetItem(editingItemId, { title: editTitle, content: editContent }); setEditingItemId(null); toast.success("Script atualizado!"); };
  const handleCancelEdit = () => { setEditingItemId(null); };
  const handleDeleteItem = async (itemId: string) => { await deleteScriptSetItem(itemId); toast.success("Script removido!"); };

  const handleAddItem = async () => {
    if (!activeSet || !newItemTitle.trim()) return;
    const nextOrder = activeSet.items.length + 1;
    await addScriptSetItem(activeSet.id, nextOrder, newItemTitle.trim(), newItemContent.trim());
    setAddingItem(false); setNewItemTitle(""); setNewItemContent("");
    toast.success("Script adicionado!");
  };

  const handleMoveItem = async (itemId: string, direction: "up" | "down") => {
    if (!activeSet) return;
    const sorted = [...activeSet.items].sort((a, b) => a.stepOrder - b.stepOrder);
    const idx = sorted.findIndex((i) => i.id === itemId);
    if (direction === "up" && idx > 0) {
      const itemA = sorted[idx - 1]; const itemB = sorted[idx];
      await Promise.all([
        updateScriptSetItem(itemA.id, { title: itemB.title, content: itemB.content }),
        updateScriptSetItem(itemB.id, { title: itemA.title, content: itemA.content }),
      ]);
      toast.success("Ordem atualizada!");
    } else if (direction === "down" && idx < sorted.length - 1) {
      const itemA = sorted[idx]; const itemB = sorted[idx + 1];
      await Promise.all([
        updateScriptSetItem(itemA.id, { title: itemB.title, content: itemB.content }),
        updateScriptSetItem(itemB.id, { title: itemA.title, content: itemA.content }),
      ]);
      toast.success("Ordem atualizada!");
    }
  };

  const activeSet = scriptSets.find((s) => s.id === selectedSetId);
  const sortedSteps = [...campaign.funnel].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Scripts da Campanha</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={selectedSetId} onChange={(e) => handleSelectSet(e.target.value)} className="appearance-none rounded-lg border border-border bg-card pl-3 pr-8 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition">
              <option value="">Selecionar conjunto...</option>
              {scriptSets.map((set) => (<option key={set.id} value={set.id}>{set.name}</option>))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <button onClick={handleOpenCreate} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-primary/40 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition">
            <Plus className="h-3.5 w-3.5" /> Novo
          </button>
        </div>
      </div>

      {!activeSet ? (
        <EmptyState icon={FileText} title="Nenhum conjunto selecionado" description={scriptSets.length === 0 ? "Crie um conjunto de scripts para usar na campanha" : "Selecione um conjunto de scripts acima"} actionLabel={scriptSets.length === 0 ? "Criar Conjunto" : undefined} onAction={scriptSets.length === 0 ? handleOpenCreate : undefined} />
      ) : (
        <div className="space-y-3">
          {activeSet.items.sort((a, b) => a.stepOrder - b.stepOrder).map((item, idx, arr) => {
            const matchingStep = sortedSteps[item.stepOrder - 1];
            const isEditing = editingItemId === item.id;

            if (isEditing) {
              return (
                <div key={item.id} className="glass-card p-4 border-primary/30">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md gradient-primary text-primary-foreground text-[10px] font-bold shrink-0">{item.stepOrder}</span>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary/30 focus:border-primary transition" placeholder="Título do script" />
                    </div>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="Conteúdo do script..." />
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={handleCancelEdit} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition">Cancelar</button>
                      <button onClick={handleSaveEdit} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition">Salvar</button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="glass-card p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md gradient-primary text-primary-foreground text-[10px] font-bold shrink-0">{item.stepOrder}</span>
                      <h5 className="text-sm font-semibold text-foreground">{item.title || "Sem título"}</h5>
                      {matchingStep && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{matchingStep.name}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-4 whitespace-pre-wrap pl-7">{item.content || "Sem conteúdo"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      {idx > 0 && <button onClick={() => handleMoveItem(item.id, "up")} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Mover para cima"><ChevronUp className="h-3 w-3" /></button>}
                      {idx < arr.length - 1 && <button onClick={() => handleMoveItem(item.id, "down")} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Mover para baixo"><ChevronDownIcon className="h-3 w-3" /></button>}
                    </div>
                    <button onClick={() => handleStartEdit(item)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition opacity-0 group-hover:opacity-100" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleCopy(item.content)} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"><Copy className="h-3 w-3" /> Copiar</button>
                  </div>
                </div>
              </div>
            );
          })}

          {addingItem ? (
            <div className="glass-card p-4 border-primary/30">
              <div className="space-y-3">
                <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary/30 focus:border-primary transition" placeholder="Título do script" autoFocus />
                <textarea value={newItemContent} onChange={(e) => setNewItemContent(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="Conteúdo do script..." />
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => { setAddingItem(false); setNewItemTitle(""); setNewItemContent(""); }} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition">Cancelar</button>
                  <button onClick={handleAddItem} disabled={!newItemTitle.trim()} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">Adicionar</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingItem(true)} className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition">
              <Plus className="inline h-4 w-4 mr-1" /> Adicionar script
            </button>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) return; }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Novo Conjunto de Scripts</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome do conjunto</label>
              <input placeholder="Ex: Roteiros Prospecção B2B" value={newSetName} onChange={(e) => setCampaignScriptDraft({ ...campaignScriptDraft, newSetName: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            </div>
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-3">Script inicial (obrigatório)</p>
              <input placeholder="Título do primeiro script" value={initialScriptTitle} onChange={(e) => setCampaignScriptDraft({ ...campaignScriptDraft, initialScriptTitle: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 mb-2" />
              <textarea placeholder="Conteúdo do script (opcional)" value={initialScriptContent} onChange={(e) => setCampaignScriptDraft({ ...campaignScriptDraft, initialScriptContent: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={handleCancelCreate} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
            <button onClick={handleCreateSet} disabled={!newSetName.trim() || !initialScriptTitle.trim()} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">Criar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
