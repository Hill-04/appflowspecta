import { useState } from "react";
import { Plus, Trash2, GripVertical, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadModelField, ActionRole } from "@/hooks/useStore";
import { toast } from "sonner";

const FIELD_TYPES = [
  { value: "short_text", label: "Texto curto" },
  { value: "long_text", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "link", label: "Link" },
  { value: "date", label: "Data" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
] as const;

const ACTION_ROLES: { value: ActionRole; label: string }[] = [
  { value: "none", label: "Nenhum" },
  { value: "profile", label: "Perfil do lead (abrir antes)" },
  { value: "contact", label: "Meio de contato" },
  { value: "qualification", label: "Informação de qualificação" },
];

interface Props {
  modelName: string;
  fields: LeadModelField[];
  onChangeModelName: (name: string) => void;
  onChangeFields: (fields: LeadModelField[]) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export function LeadTemplateEditor({ modelName, fields, onChangeModelName, onChangeFields, onSave, onCancel, saving }: Props) {
  const addField = () => {
    if (fields.length >= 20) {
      toast.error("Máximo 20 campos por modelo");
      return;
    }
    const newField: LeadModelField = {
      id: crypto.randomUUID(),
      label: "",
      type: "short_text",
      required: false,
      used_in_script: false,
      is_primary: fields.length === 0,
      action_role: "none",
    };
    onChangeFields([...fields, newField]);
  };

  const updateField = (id: string, patch: Partial<LeadModelField>) => {
    let updated = fields.map((f) => (f.id === id ? { ...f, ...patch } : f));
    // Enforce single is_primary
    if (patch.is_primary === true) {
      updated = updated.map((f) => (f.id === id ? f : { ...f, is_primary: false }));
    }
    onChangeFields(updated);
  };

  const removeField = (id: string) => {
    const removed = fields.find((f) => f.id === id);
    let updated = fields.filter((f) => f.id !== id);
    // If removed was primary, assign first field
    if (removed?.is_primary && updated.length > 0) {
      updated = [{ ...updated[0], is_primary: true }, ...updated.slice(1)];
    }
    onChangeFields(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="model-name" className="text-sm font-medium">Nome do Modelo</Label>
        <Input
          id="model-name"
          value={modelName}
          onChange={(e) => onChangeModelName(e.target.value)}
          placeholder="Ex: Leads Instagram, Leads B2B..."
          className="mt-1"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Campos</h3>
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar campo
          </Button>
        </div>

        {fields.map((field, idx) => (
          <div key={field.id} className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                placeholder="Nome do campo"
                className="flex-1"
              />
              <Select
                value={field.type}
                onValueChange={(v) => updateField(field.id, { type: v as LeadModelField["type"] })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeField(field.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={field.required}
                  onCheckedChange={(v) => updateField(field.id, { required: v })}
                />
                <span>Obrigatório</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={field.used_in_script}
                  onCheckedChange={(v) => updateField(field.id, { used_in_script: v })}
                />
                <span>Usar em scripts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={field.is_primary}
                  onCheckedChange={(v) => updateField(field.id, { is_primary: v })}
                />
                <Star className={`h-4 w-4 ${field.is_primary ? "text-warning" : "text-muted-foreground"}`} />
                <span>Campo principal</span>
              </label>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Papel na prospecção</Label>
              <Select
                value={field.action_role}
                onValueChange={(v) => updateField(field.id, { action_role: v as ActionRole })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Modelo"}
        </Button>
      </div>
    </div>
  );
}
