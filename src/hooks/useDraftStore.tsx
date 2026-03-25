import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { LeadModelField } from "@/hooks/useStore";

// ─── Draft shapes ───────────────────────────────────────────────
export interface ScriptDraft {
  name: string;
  type: string;
  content: string;
  tags: string;
}

export interface ObjectionDraft {
  title: string;
  response: string;
  category: string;
}

export interface AudienceDraft {
  name: string;
  description: string;
  segment: string;
  criteria: string;
}

export interface FunnelStepDraft {
  _key: string;
  name: string;
  isConversion: boolean;
}

export interface CampaignDraft {
  step: 1 | 2 | 3;
  selectedAudience: string;
  campaignName: string;
  funnelSteps: FunnelStepDraft[];
}

export interface ScriptSetDraft {
  newSetName: string;
}

export interface LeadTemplateDraft {
  editorName: string;
  editorFields: LeadModelField[];
}

export interface CampaignScriptDraft {
  newSetName: string;
  initialScriptTitle: string;
  initialScriptContent: string;
}

export interface CampaignLeadDraft {
  fixedForm: { name: string; company: string; role: string; phone: string; email: string };
  dynamicValues: Record<string, any>;
  selectedTemplateId: string;
}

// ─── Store shape ────────────────────────────────────────────────
interface DraftStoreContextType {
  // Script
  scriptDraft: ScriptDraft;
  scriptDialogOpen: boolean;
  scriptEditing: { id: string } | null;
  setScriptDraft: (d: ScriptDraft) => void;
  setScriptDialogOpen: (open: boolean) => void;
  setScriptEditing: (e: { id: string } | null) => void;
  clearScriptDraft: () => void;

  // Objection
  objectionDraft: ObjectionDraft;
  objectionDialogOpen: boolean;
  objectionEditing: { id: string } | null;
  setObjectionDraft: (d: ObjectionDraft) => void;
  setObjectionDialogOpen: (open: boolean) => void;
  setObjectionEditing: (e: { id: string } | null) => void;
  clearObjectionDraft: () => void;

  // Audience
  audienceDraft: AudienceDraft;
  audienceDialogOpen: boolean;
  audienceEditing: { id: string } | null;
  setAudienceDraft: (d: AudienceDraft) => void;
  setAudienceDialogOpen: (open: boolean) => void;
  setAudienceEditing: (e: { id: string } | null) => void;
  clearAudienceDraft: () => void;

  // Campaign creation
  campaignDraft: CampaignDraft;
  setCampaignDraft: (d: CampaignDraft | ((prev: CampaignDraft) => CampaignDraft)) => void;
  clearCampaignDraft: () => void;

  // Script Sets
  scriptSetDraft: ScriptSetDraft;
  scriptSetFormOpen: boolean;
  setScriptSetDraft: (d: ScriptSetDraft) => void;
  setScriptSetFormOpen: (open: boolean) => void;
  clearScriptSetDraft: () => void;

  // Lead Templates
  leadTemplateDraft: LeadTemplateDraft;
  leadTemplateEditorOpen: boolean;
  leadTemplateEditingId: string | null;
  setLeadTemplateDraft: (d: LeadTemplateDraft) => void;
  setLeadTemplateEditorOpen: (open: boolean) => void;
  setLeadTemplateEditingId: (id: string | null) => void;
  clearLeadTemplateDraft: () => void;

  // Campaign Scripts Tab
  campaignScriptDraft: CampaignScriptDraft;
  campaignScriptDialogOpen: boolean;
  setCampaignScriptDraft: (d: CampaignScriptDraft) => void;
  setCampaignScriptDialogOpen: (open: boolean) => void;
  clearCampaignScriptDraft: () => void;

  // Campaign Lead (new lead inside campaign)
  campaignLeadDraft: CampaignLeadDraft;
  campaignLeadDialogOpen: boolean;
  setCampaignLeadDraft: (d: CampaignLeadDraft | ((prev: CampaignLeadDraft) => CampaignLeadDraft)) => void;
  setCampaignLeadDialogOpen: (open: boolean) => void;
  clearCampaignLeadDraft: () => void;
}

const DraftStoreContext = createContext<DraftStoreContextType | null>(null);

// ─── Defaults ───────────────────────────────────────────────────
const emptyScript: ScriptDraft = { name: "", type: "opening", content: "", tags: "" };
const emptyObjection: ObjectionDraft = { title: "", response: "", category: "" };
const emptyAudience: AudienceDraft = { name: "", description: "", segment: "", criteria: "" };

let _keyCounter = 0;
const nextKey = () => `fs-${++_keyCounter}`;

export const defaultCampaignDraft: CampaignDraft = {
  step: 1,
  selectedAudience: "",
  campaignName: "",
  funnelSteps: [
    { _key: nextKey(), name: "Novo Lead", isConversion: false },
    { _key: nextKey(), name: "Contatado", isConversion: false },
    { _key: nextKey(), name: "Proposta", isConversion: false },
    { _key: nextKey(), name: "Convertido", isConversion: true },
  ],
};

const emptyScriptSet: ScriptSetDraft = { newSetName: "" };
const emptyLeadTemplate: LeadTemplateDraft = { editorName: "", editorFields: [] };
const emptyCampaignScript: CampaignScriptDraft = { newSetName: "", initialScriptTitle: "Abordagem Inicial", initialScriptContent: "" };
const emptyCampaignLead: CampaignLeadDraft = { fixedForm: { name: "", company: "", role: "", phone: "", email: "" }, dynamicValues: {}, selectedTemplateId: "none" };

// ─── Provider ───────────────────────────────────────────────────
export function DraftStoreProvider({ children }: { children: ReactNode }) {
  // Script
  const [scriptDraft, setScriptDraft] = useState<ScriptDraft>(emptyScript);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [scriptEditing, setScriptEditing] = useState<{ id: string } | null>(null);
  const clearScriptDraft = useCallback(() => { setScriptDraft(emptyScript); setScriptDialogOpen(false); setScriptEditing(null); }, []);

  // Objection
  const [objectionDraft, setObjectionDraft] = useState<ObjectionDraft>(emptyObjection);
  const [objectionDialogOpen, setObjectionDialogOpen] = useState(false);
  const [objectionEditing, setObjectionEditing] = useState<{ id: string } | null>(null);
  const clearObjectionDraft = useCallback(() => { setObjectionDraft(emptyObjection); setObjectionDialogOpen(false); setObjectionEditing(null); }, []);

  // Audience
  const [audienceDraft, setAudienceDraft] = useState<AudienceDraft>(emptyAudience);
  const [audienceDialogOpen, setAudienceDialogOpen] = useState(false);
  const [audienceEditing, setAudienceEditing] = useState<{ id: string } | null>(null);
  const clearAudienceDraft = useCallback(() => { setAudienceDraft(emptyAudience); setAudienceDialogOpen(false); setAudienceEditing(null); }, []);

  // Campaign
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft>(defaultCampaignDraft);
  const clearCampaignDraft = useCallback(() => {
    _keyCounter = 0;
    setCampaignDraft({
      step: 1,
      selectedAudience: "",
      campaignName: "",
      funnelSteps: [
        { _key: nextKey(), name: "Novo Lead", isConversion: false },
        { _key: nextKey(), name: "Contatado", isConversion: false },
        { _key: nextKey(), name: "Proposta", isConversion: false },
        { _key: nextKey(), name: "Convertido", isConversion: true },
      ],
    });
  }, []);

  // Script Sets
  const [scriptSetDraft, setScriptSetDraft] = useState<ScriptSetDraft>(emptyScriptSet);
  const [scriptSetFormOpen, setScriptSetFormOpen] = useState(false);
  const clearScriptSetDraft = useCallback(() => { setScriptSetDraft(emptyScriptSet); setScriptSetFormOpen(false); }, []);

  // Lead Templates
  const [leadTemplateDraft, setLeadTemplateDraft] = useState<LeadTemplateDraft>(emptyLeadTemplate);
  const [leadTemplateEditorOpen, setLeadTemplateEditorOpen] = useState(false);
  const [leadTemplateEditingId, setLeadTemplateEditingId] = useState<string | null>(null);
  const clearLeadTemplateDraft = useCallback(() => { setLeadTemplateDraft(emptyLeadTemplate); setLeadTemplateEditorOpen(false); setLeadTemplateEditingId(null); }, []);

  // Campaign Scripts
  const [campaignScriptDraft, setCampaignScriptDraft] = useState<CampaignScriptDraft>(emptyCampaignScript);
  const [campaignScriptDialogOpen, setCampaignScriptDialogOpen] = useState(false);
  const clearCampaignScriptDraft = useCallback(() => { setCampaignScriptDraft(emptyCampaignScript); setCampaignScriptDialogOpen(false); }, []);

  // Campaign Lead
  const [campaignLeadDraft, setCampaignLeadDraft] = useState<CampaignLeadDraft>(emptyCampaignLead);
  const [campaignLeadDialogOpen, setCampaignLeadDialogOpen] = useState(false);
  const clearCampaignLeadDraft = useCallback(() => { setCampaignLeadDraft(emptyCampaignLead); setCampaignLeadDialogOpen(false); }, []);

  return (
    <DraftStoreContext.Provider value={{
      scriptDraft, scriptDialogOpen, scriptEditing, setScriptDraft, setScriptDialogOpen, setScriptEditing, clearScriptDraft,
      objectionDraft, objectionDialogOpen, objectionEditing, setObjectionDraft, setObjectionDialogOpen, setObjectionEditing, clearObjectionDraft,
      audienceDraft, audienceDialogOpen, audienceEditing, setAudienceDraft, setAudienceDialogOpen, setAudienceEditing, clearAudienceDraft,
      campaignDraft, setCampaignDraft, clearCampaignDraft,
      scriptSetDraft, scriptSetFormOpen, setScriptSetDraft, setScriptSetFormOpen, clearScriptSetDraft,
      leadTemplateDraft, leadTemplateEditorOpen, leadTemplateEditingId, setLeadTemplateDraft, setLeadTemplateEditorOpen, setLeadTemplateEditingId, clearLeadTemplateDraft,
      campaignScriptDraft, campaignScriptDialogOpen, setCampaignScriptDraft, setCampaignScriptDialogOpen, clearCampaignScriptDraft,
      campaignLeadDraft, campaignLeadDialogOpen, setCampaignLeadDraft, setCampaignLeadDialogOpen, clearCampaignLeadDraft,
    }}>
      {children}
    </DraftStoreContext.Provider>
  );
}

export function useDraftStore() {
  const ctx = useContext(DraftStoreContext);
  if (!ctx) throw new Error("useDraftStore must be used within DraftStoreProvider");
  return ctx;
}
