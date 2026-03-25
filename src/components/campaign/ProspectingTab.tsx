import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, HelpCircle, Clock, ThumbsDown, Keyboard, User, Building2, Phone, Mail, Copy, ExternalLink } from "lucide-react";
import { useStore, Campaign, CampaignLeadFull, LeadModelField, LeadTemplate, groupFieldsByRole, getContactAction } from "@/hooks/useStore";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

type Result = "interested" | "info_requested" | "no_response" | "not_interested";

const resultConfig: { key: Result; label: string; icon: any; shortcut: string; className: string }[] = [
  { key: "interested", label: "Interessado", icon: ThumbsUp, shortcut: "1", className: "bg-success/10 text-success border-success/20 hover:bg-success/20" },
  { key: "info_requested", label: "Pediu info", icon: HelpCircle, shortcut: "2", className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20" },
  { key: "no_response", label: "Sem resposta", icon: Clock, shortcut: "3", className: "bg-muted text-muted-foreground border-border hover:bg-secondary" },
  { key: "not_interested", label: "Não interessado", icon: ThumbsDown, shortcut: "4", className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" },
];

const contactIcons: Record<string, any> = {
  Phone,
  Mail,
  ExternalLink,
};

interface Props {
  campaign: Campaign;
}

// Renders the legacy card for leads without a template
function LegacyLeadCard({ clf }: { clf: CampaignLeadFull }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-3">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">{clf.lead.name}</p>
          <p className="text-xs text-muted-foreground">{clf.lead.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-foreground">{clf.lead.company}</p>
      </div>
      <div className="flex items-center gap-3">
        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-foreground">{clf.lead.phone}</p>
      </div>
      <div className="flex items-center gap-3">
        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-foreground">{clf.lead.email}</p>
      </div>
    </div>
  );
}

// Renders a field section (profile, qualification, etc.)
function FieldSection({ title, fields, customData }: { title: string; fields: LeadModelField[]; customData: Record<string, any> }) {
  const filledFields = fields.filter((f) => customData[f.id]);
  if (filledFields.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {filledFields.map((f) => (
          <div key={f.id} className="text-sm">
            <span className="text-muted-foreground">{f.label}: </span>
            <span className="text-foreground">{String(customData[f.id])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Renders contact fields with contextual action buttons
function ContactSection({ fields, customData }: { fields: LeadModelField[]; customData: Record<string, any> }) {
  const filledFields = fields.filter((f) => customData[f.id]);
  if (filledFields.length === 0) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contato</p>
      <div className="space-y-2">
        {filledFields.map((f) => {
          const value = String(customData[f.id]);
          const action = getContactAction(f, value);
          const IconComponent = action ? contactIcons[action.icon] || ExternalLink : null;

          return (
            <div key={f.id} className="flex items-center justify-between gap-2">
              <div className="text-sm min-w-0">
                <span className="text-muted-foreground">{f.label}: </span>
                <span className="text-foreground truncate">{value}</span>
              </div>
              {action ? (
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 shrink-0 px-2 py-1 rounded-md hover:bg-primary/10 transition"
                >
                  {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
                  {action.label}
                </a>
              ) : (
                <button
                  onClick={() => handleCopy(value)}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0 px-2 py-1 rounded-md hover:bg-secondary transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Renders the template-based card organized by action_role
function TemplateLeadCard({ clf, template }: { clf: CampaignLeadFull; template: LeadTemplate }) {
  const customData = clf.lead.customData || {};
  const groups = groupFieldsByRole(template.fields);
  const primaryValue = groups.primary ? customData[groups.primary.id] : null;
  const title = primaryValue || clf.lead.name;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <FieldSection title="Perfil" fields={groups.profile} customData={customData} />
      <FieldSection title="Qualificação" fields={groups.qualification} customData={customData} />
      <ContactSection fields={groups.contact} customData={customData} />
      <FieldSection title="Outros" fields={groups.none} customData={customData} />
    </div>
  );
}

export function ProspectingTab({ campaign }: Props) {
  const { updateCampaignLeadStatus, addInteraction, getTemplateForLead } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const pendingLeads = campaign.leads.filter((clf) => clf.campaignLead.status === "pending" || clf.campaignLead.status === "contacted");
  const currentClf = pendingLeads[currentIndex];
  const currentStep = campaign.funnel[currentClf?.campaignLead.stepIndex || 0];

  // Resolve template for the current lead
  const leadTemplate = currentClf ? getTemplateForLead(currentClf.lead) : null;

  const handleResult = useCallback(async (result: Result) => {
    if (!currentClf) return;
    const nextStep = Math.min(currentClf.campaignLead.stepIndex + 1, Math.max(campaign.funnel.length - 1, 0));

    await Promise.all([
      updateCampaignLeadStatus(currentClf.campaignLead.id, {
        status: result,
        step_index: nextStep,
      }),
      addInteraction(currentClf.lead.id, result),
    ]);

    toast.success(`${currentClf.lead.name}: ${resultConfig.find((r) => r.key === result)?.label}`);

    if (currentIndex < pendingLeads.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentClf, currentIndex, pendingLeads.length, campaign.funnel.length, updateCampaignLeadStatus, addInteraction]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") handleResult("interested");
      if (e.key === "2") handleResult("info_requested");
      if (e.key === "3") handleResult("no_response");
      if (e.key === "4") handleResult("not_interested");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleResult]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Mensagem copiada!");
  };

  if (pendingLeads.length === 0) {
    return (
      <EmptyState
        icon={User}
        title="Sem leads na fila"
        description="Todos os leads foram processados ou não há leads pendentes"
      />
    );
  }

  if (!currentClf) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <p className="text-lg font-semibold text-foreground mb-2">Fila concluída! 🎉</p>
        <p className="text-sm text-muted-foreground">Todos os leads pendentes foram processados.</p>
      </div>
    );
  }

  const messageContent = currentStep?.variations[0]?.content
    .replace("{nome}", currentClf.lead.name)
    .replace("{empresa}", currentClf.lead.company) || "";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Keyboard className="h-4 w-4" />
            <span>Use teclas 1-4 para registrar</span>
          </div>
          <span className="text-foreground font-medium">
            {currentIndex + 1} / {pendingLeads.length} leads
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full gradient-primary transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / pendingLeads.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Próximo Lead</h2>
          <StatusBadge status={currentClf.campaignLead.status} />
        </div>
        {leadTemplate ? (
          <TemplateLeadCard clf={currentClf} template={leadTemplate} />
        ) : (
          <LegacyLeadCard clf={currentClf} />
        )}
      </div>

      {currentStep && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">
              Mensagem Sugerida — {currentStep.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary font-medium">
                Etapa {currentStep.order} de {campaign.funnel.length}
              </span>
              <button
                onClick={() => handleCopy(messageContent)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                title="Copiar mensagem"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4 text-sm text-foreground/80 leading-relaxed">
            {messageContent}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {resultConfig.map((r) => (
          <button
            key={r.key}
            onClick={() => handleResult(r.key)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${r.className}`}
          >
            <r.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{r.label}</span>
            <kbd className="rounded bg-background/50 px-1.5 py-0.5 text-[10px] font-mono">{r.shortcut}</kbd>
          </button>
        ))}
      </div>
    </div>
  );
}
