import { useState } from "react";
import { Plus, LayoutTemplate, Copy, Trash2, Pencil } from "lucide-react";
import { useStore, LeadModelField } from "@/hooks/useStore";
import { EmptyState } from "@/components/EmptyState";
import { LeadTemplateEditor } from "@/components/lead/LeadTemplateEditor";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDraftStore } from "@/hooks/useDraftStore";

export default function LeadTemplates() {
  const { leadTemplates, addLeadTemplate, updateLeadTemplate, deleteLeadTemplate, duplicateLeadTemplate } = useStore();
  const {
    leadTemplateDraft, setLeadTemplateDraft,
    leadTemplateEditorOpen: showEditor, setLeadTemplateEditorOpen: setShowEditor,
    leadTemplateEditingId: editingId, setLeadTemplateEditingId: setEditingId,
    clearLeadTemplateDraft,
  } = useDraftStore();
  const [saving, setSaving] = useState(false);

  const editorName = leadTemplateDraft.editorName;
  const editorFields = leadTemplateDraft.editorFields;
  const setEditorName = (name: string) => setLeadTemplateDraft({ ...leadTemplateDraft, editorName: name });
  const setEditorFields = (fields: LeadModelField[]) => setLeadTemplateDraft({ ...leadTemplateDraft, editorFields: fields });

  const openNew = () => {
    setEditingId(null);
    setLeadTemplateDraft({ editorName: "", editorFields: [] });
    setShowEditor(true);
  };

  const openEdit = (id: string) => {
    const t = leadTemplates.find((t) => t.id === id);
    if (!t) return;
    setEditingId(id);
    setLeadTemplateDraft({ editorName: t.name, editorFields: [...t.fields] });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!editorName.trim()) { toast.error("Nome é obrigatório"); return; }
    if (editorFields.length === 0) { toast.error("Adicione pelo menos 1 campo"); return; }
    setSaving(true);
    if (editingId) {
      await updateLeadTemplate(editingId, editorName, editorFields);
      toast.success("Template atualizado");
    } else {
      await addLeadTemplate(editorName, editorFields);
      toast.success("Template criado");
    }
    setSaving(false);
    clearLeadTemplateDraft();
  };

  const handleCancel = () => { clearLeadTemplateDraft(); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Lead Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Modelos reutilizáveis para capturar dados de leads</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Novo Template
        </button>
      </div>

      {leadTemplates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="Nenhum template criado" description="Crie templates para definir a estrutura de dados dos seus leads" actionLabel="Criar Template" onAction={openNew} />
      ) : (
        <div className="grid gap-4">
          {leadTemplates.map((t) => (
            <div key={t.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{t.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{t.fields.length} campo{t.fields.length !== 1 ? "s" : ""} · Criado em {new Date(t.createdAt).toLocaleDateString("pt-BR")}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.fields.slice(0, 5).map((f) => (
                    <span key={f.id} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{f.label}</span>
                  ))}
                  {t.fields.length > 5 && <span className="text-xs text-muted-foreground">+{t.fields.length - 5}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-4">
                <button onClick={() => openEdit(t.id)} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Editar"><Pencil className="h-4 w-4" /></button>
                <button onClick={async () => { await duplicateLeadTemplate(t.id); toast.success("Template duplicado"); }} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Duplicar"><Copy className="h-4 w-4" /></button>
                <button onClick={async () => { await deleteLeadTemplate(t.id); toast.success("Template excluído"); }} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Excluir"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showEditor} onOpenChange={(open) => { if (!open) return; }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <LeadTemplateEditor modelName={editorName} fields={editorFields} onChangeModelName={setEditorName} onChangeFields={setEditorFields} onSave={handleSave} onCancel={handleCancel} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
