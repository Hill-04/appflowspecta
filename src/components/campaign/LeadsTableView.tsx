import { useState, useMemo } from "react";
import { ArrowUpDown, Copy, Trash2, Pencil, ChevronDown, Check, Plus } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Campaign, CampaignLeadFull, useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FieldDef {
  id: string;
  field_name: string;
  field_type: string;
  field_order: number;
}

interface FieldValueRow {
  lead_id: string;
  field_id: string;
  value: string;
}

const PRIORITIES = [
  { value: "high", label: "Alta", color: "bg-destructive/20 text-destructive border-destructive/30" },
  { value: "medium", label: "Média", color: "bg-warning/20 text-warning border-warning/30" },
  { value: "low", label: "Baixa", color: "bg-muted text-muted-foreground border-border" },
];

interface Props {
  campaign: Campaign;
  fieldDefs: FieldDef[];
  fieldValues: FieldValueRow[];
  searchQuery: string;
  onSelectLead: (clf: CampaignLeadFull) => void;
  onDuplicate: (clf: CampaignLeadFull) => void;
  onDelete: (clf: CampaignLeadFull) => void;
  onAddLead: (stepIndex: number) => void;
}

type SortKey = "name" | "step" | "priority" | string;
type SortDir = "asc" | "desc";

export function LeadsTableView({ campaign, fieldDefs, fieldValues, searchQuery, onSelectLead, onDuplicate, onDelete, onAddLead }: Props) {
  const { updateCampaignLeadStatus } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedSteps = useMemo(() => [...campaign.funnel].sort((a, b) => a.order - b.order), [campaign.funnel]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filteredLeads = useMemo(() => {
    let leads = campaign.leads.filter(clf => !clf.campaignLead.archivedAt);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      leads = leads.filter(clf => clf.lead.name.toLowerCase().includes(q));
    }
    return leads;
  }, [campaign.leads, searchQuery]);

  const getFieldValue = (leadId: string, fieldId: string) => {
    return fieldValues.find(fv => fv.lead_id === leadId && fv.field_id === fieldId)?.value || "";
  };

  const sortedLeads = useMemo(() => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...filteredLeads].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.lead.name.localeCompare(b.lead.name);
      else if (sortKey === "step") cmp = a.campaignLead.stepIndex - b.campaignLead.stepIndex;
      else if (sortKey === "priority") {
        const pa = (a.campaignLead as any).priority || "medium";
        const pb = (b.campaignLead as any).priority || "medium";
        cmp = (priorityOrder[pa] ?? 1) - (priorityOrder[pb] ?? 1);
      } else {
        const va = getFieldValue(a.lead.id, sortKey);
        const vb = getFieldValue(b.lead.id, sortKey);
        cmp = va.localeCompare(vb);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredLeads, sortKey, sortDir, fieldValues]);

  const handleMoveStep = async (clf: CampaignLeadFull, stepIndex: number) => {
    const step = sortedSteps[stepIndex];
    await updateCampaignLeadStatus(clf.campaignLead.id, {
      step_index: stepIndex,
      current_step_id: step?.id,
    });
  };

  const cyclePriority = async (clf: CampaignLeadFull) => {
    const current = (clf.campaignLead as any).priority || "medium";
    const order = ["low", "medium", "high"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    await supabase.from("campaign_leads").update({ priority: next }).eq("id", clf.campaignLead.id);
    toast.success("Prioridade atualizada");
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition"
      onClick={() => toggleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === sortKeyName ? "text-primary" : "text-muted-foreground/50"}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortHeader label="Nome" sortKeyName="name" />
            <SortHeader label="Etapa" sortKeyName="step" />
            <SortHeader label="Prioridade" sortKeyName="priority" />
            {fieldDefs.map(fd => (
              <SortHeader key={fd.id} label={fd.field_name} sortKeyName={fd.id} />
            ))}
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
          {fieldDefs.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableHead colSpan={4} className="text-center text-xs text-muted-foreground font-normal py-1">
                Adicione campos no lead para ver mais colunas
              </TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {sortedLeads.map(clf => {
            const step = sortedSteps[clf.campaignLead.stepIndex];
            const pri = PRIORITIES.find(p => p.value === ((clf.campaignLead as any).priority || "medium")) || PRIORITIES[1];

            return (
              <TableRow key={clf.campaignLead.id} className="hover:bg-white/[0.02] transition">
                <TableCell>
                  <button
                    onClick={() => onSelectLead(clf)}
                    className="text-sm font-medium text-foreground hover:text-primary transition truncate max-w-[200px] block text-left"
                  >
                    {clf.lead.name}
                  </button>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition">
                        {step?.name || `Etapa ${clf.campaignLead.stepIndex + 1}`}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {sortedSteps.map((s, idx) => (
                        <DropdownMenuItem key={s.id} onClick={() => handleMoveStep(clf, idx)}>
                          {s.name || `Etapa ${idx + 1}`}
                          {idx === clf.campaignLead.stepIndex && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => cyclePriority(clf)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${pri.color}`}
                  >
                    {pri.label}
                  </button>
                </TableCell>
                {fieldDefs.map(fd => (
                  <TableCell key={fd.id} className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {getFieldValue(clf.lead.id, fd.id) || "—"}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onSelectLead(clf)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDuplicate(clf)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Duplicar">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDelete(clf)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {sortedLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={4 + fieldDefs.length} className="text-center text-sm text-muted-foreground py-8">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="px-4 py-3 border-t border-border/50">
        <button
          onClick={() => onAddLead(0)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar lead
        </button>
      </div>
    </div>
  );
}
