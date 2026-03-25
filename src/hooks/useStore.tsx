import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { leadSchema, campaignNameSchema, funnelStepSchema, audienceSchema, scriptSchema, objectionSchema, interactionSchema } from "@/lib/validations";

// Types matching the DB schema
export interface DbCampaign {
  id: string;
  user_id: string;
  name: string;
  audience_id: string | null;
  status: string;
  prospecting_status: string;
  created_at: string;
  investment: number;
  script_set_id: string | null;
  default_lead_template_id: string | null;
}

export interface DbScriptSet {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface DbScriptSetItem {
  id: string;
  set_id: string;
  step_order: number;
  title: string;
  content: string;
  created_at: string;
}

export interface DbAudience {
  id: string;
  user_id: string;
  name: string;
  description: string;
  segment: string;
  criteria: string[];
  size: number;
  created_at: string;
}

export interface DbScript {
  id: string;
  user_id: string;
  name: string;
  type: string;
  content: string;
  tags: string[];
  objective?: string | null;
  audience_id?: string | null;
  created_at: string;
}

export interface DbObjection {
  id: string;
  user_id: string;
  title: string;
  response: string;
  category: string;
  frequency: number;
  created_at: string;
}

export interface DbLead {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  lead_model_id: string | null;
  custom_data: Record<string, any>;
  created_at: string;
}

export interface DbCampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  step_index: number;
  status: string;
  created_at: string;
  current_step_id: string | null;
  converted_at: string | null;
  deal_value: number;
  close_probability: number | null;
  reminder_at: string | null;
  pinned_note: string | null;
  archived_at: string | null;
  archive_reason: string | null;
}

export interface DbMessageStep {
  id: string;
  campaign_id: string;
  step_name: string;
  step_order: number;
  variation_a: string;
  variation_b: string;
  created_at: string;
  is_conversion: boolean;
}

export interface DbInteraction {
  id: string;
  lead_id: string;
  outcome: string;
  created_at: string;
}

// Lead Template types (formerly Lead Model)
export type ActionRole = "none" | "profile" | "contact" | "qualification";

export interface LeadModelField {
  id: string;
  label: string;
  type: "short_text" | "long_text" | "number" | "link" | "date" | "dropdown" | "checkbox";
  required: boolean;
  options?: string[];
  used_in_script: boolean;
  is_primary: boolean;
  action_role: ActionRole;
}

export interface LeadTemplate {
  id: string;
  name: string;
  fields: LeadModelField[];
  createdAt: string;
}

// Keep LeadModel as alias for backward compat in ProspectingTab card rendering
export type LeadModel = LeadTemplate;

interface DbLeadTemplate {
  id: string;
  user_id: string;
  name: string;
  fields: any;
  created_at: string;
}

// Helpers for ProspectingTab
export function groupFieldsByRole(fields: LeadModelField[]) {
  return {
    primary: fields.find((f) => f.is_primary) || null,
    profile: fields.filter((f) => f.action_role === "profile" && !f.is_primary),
    qualification: fields.filter((f) => f.action_role === "qualification"),
    contact: fields.filter((f) => f.action_role === "contact"),
    none: fields.filter((f) => f.action_role === "none" && !f.is_primary),
  };
}

export function getContactAction(field: LeadModelField, value: string): { icon: string; label: string; href: string } | null {
  if (!value) return null;
  const lbl = field.label.toLowerCase();
  if (field.type === "link") {
    return { icon: "ExternalLink", label: "Abrir", href: value.startsWith("http") ? value : `https://${value}` };
  }
  if (lbl.includes("telefone") || lbl.includes("phone") || lbl.includes("whatsapp") || lbl.includes("celular")) {
    return { icon: "Phone", label: "Ligar", href: `tel:${value.replace(/\D/g, "")}` };
  }
  if (lbl.includes("email") || lbl.includes("e-mail")) {
    return { icon: "Mail", label: "Email", href: `mailto:${value}` };
  }
  if (lbl.includes("instagram") || lbl.includes("insta")) {
    const handle = value.replace("@", "").trim();
    return { icon: "ExternalLink", label: "Abrir", href: `https://instagram.com/${handle}` };
  }
  return null;
}

// === Global Lead type (base data only) ===
export interface Lead {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  leadModelId: string | null;
  customData: Record<string, any>;
  createdAt: string;
}

// === Campaign-Lead junction (status per campaign) ===
export interface CampaignLead {
  id: string;
  campaignId: string;
  leadId: string;
  stepIndex: number;
  status: string;
  currentStepId: string | null;
  convertedAt: string | null;
  dealValue: number;
  closeProbability: number | null;
  reminderAt: string | null;
  pinnedNote: string | null;
  archivedAt: string | null;
  archiveReason: string | null;
  createdAt: string;
}

// === Combined type for UI consumption ===
export interface CampaignLeadFull {
  campaignLead: CampaignLead;
  lead: Lead;
}

export interface FunnelStep {
  id: string;
  order: number;
  name: string;
  isConversion: boolean;
  variations: { id: string; label: string; content: string }[];
}

// Composite Campaign type — leads come from campaign_leads JOIN leads
export interface Campaign {
  id: string;
  name: string;
  audienceId: string | null;
  scriptSetId: string | null;
  defaultLeadTemplateId: string | null;
  status: string;
  createdAt: string;
  investment: number;
  prospectingStatus: "not_started" | "in_progress" | "leads_responding";
  leads: CampaignLeadFull[];
  funnel: FunnelStep[];
  interactions: DbInteraction[];
  metrics: {
    totalLeads: number;
    active: number;
    converted: number;
    conversionRate: number;
    cpl: number;
    cpc: number;
    revenue: number;
    roas: number;
  };
}

export interface ScriptSetItem {
  id: string;
  setId: string;
  stepOrder: number;
  title: string;
  content: string;
}

export interface ScriptSet {
  id: string;
  name: string;
  items: ScriptSetItem[];
}

export interface Audience {
  id: string;
  name: string;
  description: string;
  segment: string;
  size: number;
  criteria: string[];
}

export interface Script {
  id: string;
  name: string;
  type: "opening" | "follow_up" | "closing" | "objection_response";
  content: string;
  tags: string[];
  objective?: string | null;
  audienceId?: string | null;
}

export interface ProfileData {
  offerType?: string | null;
  targetAudienceDescription?: string | null;
  mainPain?: string | null;
  differential?: string | null;
  averageTicket?: string | null;
  contactChannel?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  treatmentType?: string | null;
  avatarUrl?: string | null;
  personalProfileCompleted?: boolean;
}

export interface Objection {
  id: string;
  objection: string;
  response: string;
  category: string;
  frequency: number;
}

interface StoreContextType {
  loading: boolean;
  profileCompleted: boolean | null;
  personalProfileCompleted: boolean;
  profileData: ProfileData | null;
  orionWelcomed: boolean;
  orionTourStep: number;
  markOrionWelcomed: () => Promise<void>;
  setOrionTourStep: (step: number) => Promise<void>;
  completeOrionTour: () => Promise<void>;
  leadTemplates: LeadTemplate[];
  campaigns: Campaign[];
  allLeads: Lead[];
  audiences: Audience[];
  scripts: Script[];
  scriptSets: ScriptSet[];
  objections: Objection[];
  refreshCampaigns: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  refreshAudiences: () => Promise<void>;
  refreshScripts: () => Promise<void>;
  refreshObjections: () => Promise<void>;
  refreshLeadTemplates: () => Promise<void>;
  // Lead Templates CRUD
  addLeadTemplate: (name: string, fields: LeadModelField[]) => Promise<string | null>;
  updateLeadTemplate: (id: string, name: string, fields: LeadModelField[]) => Promise<void>;
  deleteLeadTemplate: (id: string) => Promise<void>;
  duplicateLeadTemplate: (id: string) => Promise<void>;
  getTemplateForLead: (lead: Lead) => LeadTemplate | null;
  completeOnboarding: (profile: import("@/lib/onboardingGenerator").OnboardingProfile) => Promise<string | null>;
  addCampaign: (c: { name: string; audienceId: string | null; funnelSteps?: { name: string; isConversion?: boolean }[] }) => Promise<string | null>;
  updateCampaign: (id: string, data: Partial<{ name: string; status: string; audience_id: string; default_lead_template_id: string | null }>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  duplicateCampaign: (id: string) => Promise<void>;
  // Global lead CRUD
  addLead: (lead: { name: string; company: string; role: string; phone: string; email: string; leadTemplateId?: string; customData?: Record<string, any> }) => Promise<string | null>;
  updateLead: (leadId: string, data: Partial<{ name: string; company: string; role: string; phone: string; email: string; customData: Record<string, any> }>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  // Campaign-Lead linking
  linkLeadToCampaign: (leadId: string, campaignId: string) => Promise<void>;
  unlinkLeadFromCampaign: (leadId: string, campaignId: string) => Promise<void>;
  updateCampaignLeadStatus: (campaignLeadId: string, data: Partial<{ status: string; step_index: number; current_step_id: string; deal_value: number; close_probability: number | null; reminder_at: string | null; pinned_note: string | null }>) => Promise<void>;
  updateFunnel: (campaignId: string, steps: { id?: string; name: string; order: number; variationA: string; variationB: string; isConversion?: boolean }[]) => Promise<void>;
  addAudience: (a: { name: string; description: string; segment: string; criteria: string[] }) => Promise<void>;
  updateAudience: (id: string, data: Partial<{ name: string; description: string; segment: string; criteria: string[] }>) => Promise<void>;
  deleteAudience: (id: string) => Promise<void>;
  addScript: (s: { name: string; type: string; content: string; tags: string[]; objective?: string; audienceId?: string }) => Promise<void>;
  updateScript: (id: string, data: Partial<{ name: string; type: string; content: string; tags: string[] }>) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  duplicateScript: (id: string) => Promise<void>;
  addObjection: (o: { title: string; response: string; category: string }) => Promise<void>;
  updateObjection: (id: string, data: Partial<{ title: string; response: string; category: string }>) => Promise<void>;
  deleteObjection: (id: string) => Promise<void>;
  addInteraction: (leadId: string, outcome: string) => Promise<void>;
  // Script Sets CRUD
  addScriptSet: (name: string) => Promise<string | null>;
  deleteScriptSet: (id: string) => Promise<void>;
  addScriptSetItem: (setId: string, stepOrder: number, title: string, content: string) => Promise<void>;
  updateScriptSetItem: (itemId: string, data: Partial<{ title: string; content: string }>) => Promise<void>;
  deleteScriptSetItem: (itemId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// Helper: convert DB lead to UI lead
function toUiLead(db: DbLead): Lead {
  return {
    id: db.id,
    name: db.name,
    company: db.company || "",
    role: db.role || "",
    phone: db.phone || "",
    email: db.email || "",
    leadModelId: db.lead_model_id,
    customData: (db.custom_data as Record<string, any>) || {},
    createdAt: db.created_at,
  };
}

// Helper: convert DB campaign_lead to UI CampaignLead
function toUiCampaignLead(db: DbCampaignLead): CampaignLead {
  return {
    id: db.id,
    campaignId: db.campaign_id,
    leadId: db.lead_id,
    stepIndex: db.step_index,
    status: db.status,
    currentStepId: db.current_step_id || null,
    convertedAt: db.converted_at || null,
    dealValue: db.deal_value || 0,
    closeProbability: db.close_probability ?? null,
    reminderAt: db.reminder_at || null,
    pinnedNote: db.pinned_note || null,
    archivedAt: db.archived_at || null,
    archiveReason: db.archive_reason || null,
    createdAt: db.created_at,
  };
}

// Helper: convert DB step to UI step
function toUiFunnel(db: DbMessageStep): FunnelStep {
  const variations = [{ id: `${db.id}-a`, label: "Variação A", content: db.variation_a || "" }];
  if (db.variation_b) {
    variations.push({ id: `${db.id}-b`, label: "Variação B", content: db.variation_b });
  }
  return { id: db.id, order: db.step_order, name: db.step_name, isConversion: db.is_conversion, variations };
}

function computeMetrics(leads: CampaignLeadFull[], investment: number) {
  // Exclude archived leads from metrics
  const activeLeads = leads.filter((l) => !l.campaignLead.archivedAt);
  const total = activeLeads.length;
  const convertedLeads = activeLeads.filter((l) => l.campaignLead.convertedAt != null);
  const converted = convertedLeads.length;
  const active = activeLeads.filter((l) => l.campaignLead.convertedAt == null).length;
  const revenue = convertedLeads.reduce((sum, l) => sum + (l.campaignLead.dealValue || 0), 0);
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  const cpl = total > 0 ? +(investment / total).toFixed(2) : 0;
  const cpc = converted > 0 ? +(investment / converted).toFixed(2) : 0;
  const roas = investment > 0 ? +(revenue / investment).toFixed(2) : 0;
  return { totalLeads: total, active, converted, conversionRate, cpl, cpc, revenue, roas };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [personalProfileCompleted, setPersonalProfileCompleted] = useState(false);
  const [profileDataState, setProfileDataState] = useState<ProfileData | null>(null);
  const [dbCampaigns, setDbCampaigns] = useState<DbCampaign[]>([]);
  const [dbLeads, setDbLeads] = useState<DbLead[]>([]);
  // campaign_leads with embedded lead data from JOIN
  const [dbCampaignLeadsJoined, setDbCampaignLeadsJoined] = useState<(DbCampaignLead & { leads: DbLead })[]>([]);
  const [dbSteps, setDbSteps] = useState<DbMessageStep[]>([]);
  const [dbAudiences, setDbAudiences] = useState<DbAudience[]>([]);
  const [dbScripts, setDbScripts] = useState<DbScript[]>([]);
  const [dbObjections, setDbObjections] = useState<DbObjection[]>([]);
  const [dbInteractions, setDbInteractions] = useState<DbInteraction[]>([]);
  const [dbLeadTemplates, setDbLeadTemplates] = useState<DbLeadTemplate[]>([]);
  const [dbScriptSets, setDbScriptSets] = useState<DbScriptSet[]>([]);
  const [dbScriptSetItems, setDbScriptSetItems] = useState<DbScriptSetItem[]>([]);
  const [orionWelcomed, setOrionWelcomed] = useState(true); // default true to avoid flash
  const [orionTourStep, setOrionTourStepState] = useState(0);

  // Track whether initial fetch has completed for this user
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Fetch all data on user change — only if not already loaded
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setInitialFetchDone(false);
      return;
    }
    if (initialFetchDone) return; // Data already in memory, skip refetch
    fetchAll();
  }, [user, initialFetchDone]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(),
      refreshCampaigns(),
      refreshLeads(),
      refreshAudiences(),
      refreshScripts(),
      refreshObjections(),
      refreshLeadTemplates(),
      refreshScriptSets(),
    ]);
    setLoading(false);
    setInitialFetchDone(true);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed, offer_type, target_audience_description, main_pain, differential, average_ticket, contact_channel, first_name, last_name, preferred_name, treatment_type, avatar_url, personal_profile_completed, orion_welcomed, orion_tour_step")
      .eq("id", user.id)
      .maybeSingle();
    // Bypass for development to break the redirect loop
    if (import.meta.env.DEV) {
      console.log("DEV Mode: Forcing profile and onboarding to completed");
      setProfileCompleted(true);
      setPersonalProfileCompleted(true);
    } else {
      setProfileCompleted(data?.onboarding_completed ?? false);
      setPersonalProfileCompleted(data?.personal_profile_completed ?? false);
    }
    setOrionWelcomed(data?.orion_welcomed ?? false);
    setOrionTourStepState((data as any)?.orion_tour_step ?? 0);

    if (data) {
      setProfileDataState({
        offerType: data.offer_type,
        targetAudienceDescription: data.target_audience_description,
        mainPain: data.main_pain,
        differential: data.differential,
        averageTicket: data.average_ticket,
        contactChannel: data.contact_channel,
        firstName: data.first_name,
        lastName: data.last_name,
        preferredName: data.preferred_name,
        treatmentType: data.treatment_type,
        avatarUrl: data.avatar_url,
        personalProfileCompleted: data.personal_profile_completed,
      });
    }
  };

  const refreshLeadTemplates = async () => {
    const { data } = await supabase.from("lead_templates").select("*").order("created_at", { ascending: false });
    setDbLeadTemplates((data as DbLeadTemplate[]) || []);
  };

  const refreshCampaigns = async () => {
    const [{ data: camps }, { data: clData }, { data: steps }, { data: interactions }] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("campaign_leads").select("*, leads(*)").order("created_at"),
      supabase.from("message_steps").select("*").order("step_order"),
      supabase.from("interactions").select("*").order("created_at"),
    ]);
    setDbCampaigns((camps as DbCampaign[]) || []);
    setDbCampaignLeadsJoined((clData as any[]) || []);
    setDbSteps((steps as DbMessageStep[]) || []);
    setDbInteractions((interactions as DbInteraction[]) || []);
  };

  // Fetch all global leads
  const refreshLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setDbLeads((data as DbLead[]) || []);
  };

  const refreshAudiences = async () => {
    const { data } = await supabase.from("audiences").select("*").order("created_at", { ascending: false });
    setDbAudiences((data as DbAudience[]) || []);
  };

  const refreshScripts = async () => {
    const { data } = await supabase.from("scripts").select("*").order("created_at", { ascending: false });
    setDbScripts((data as DbScript[]) || []);
  };

  const refreshObjections = async () => {
    const { data } = await supabase.from("objections").select("*").order("created_at", { ascending: false });
    setDbObjections((data as DbObjection[]) || []);
  };

  const refreshScriptSets = async () => {
    const [{ data: sets }, { data: items }] = await Promise.all([
      supabase.from("script_sets").select("*").order("created_at", { ascending: false }),
      supabase.from("script_set_items").select("*").order("step_order"),
    ]);
    setDbScriptSets((sets as DbScriptSet[]) || []);
    setDbScriptSetItems((items as DbScriptSetItem[]) || []);
  };


  // Build leads lookup from global leads (for allLeads list)
  const leadsById: Record<string, Lead> = {};
  for (const l of dbLeads) {
    leadsById[l.id] = toUiLead(l);
  }

  // All global leads
  const allLeads: Lead[] = dbLeads.map(toUiLead);

  // Compose UI campaigns — leads come from the Supabase JOIN, no client-side join needed
  const campaigns: Campaign[] = dbCampaigns.map((c) => {
    const joinedRows = dbCampaignLeadsJoined.filter((cl) => cl.campaign_id === c.id);
    const leads: CampaignLeadFull[] = joinedRows
      .map((cl) => {
        if (!cl.leads) return null;
        return {
          campaignLead: toUiCampaignLead(cl),
          lead: toUiLead(cl.leads),
        };
      })
      .filter(Boolean) as CampaignLeadFull[];
    const funnel = dbSteps.filter((s) => s.campaign_id === c.id).map(toUiFunnel);
    const leadIds = new Set(joinedRows.map((cl) => cl.lead_id));
    const interactions = dbInteractions.filter((i) => leadIds.has(i.lead_id));
    const investment = c.investment || 0;
    return {
      id: c.id,
      name: c.name,
      audienceId: c.audience_id,
      scriptSetId: c.script_set_id || null,
      defaultLeadTemplateId: c.default_lead_template_id || null,
      status: c.status,
      createdAt: c.created_at,
      investment,
      prospectingStatus: (c.prospecting_status || "not_started") as Campaign["prospectingStatus"],
      leads,
      funnel,
      interactions,
      metrics: computeMetrics(leads, investment),
    };
  });

  // Script Sets computed
  const scriptSets: ScriptSet[] = dbScriptSets.map((s) => ({
    id: s.id,
    name: s.name,
    items: dbScriptSetItems
      .filter((i) => i.set_id === s.id)
      .map((i) => ({ id: i.id, setId: i.set_id, stepOrder: i.step_order, title: i.title, content: i.content })),
  }));


  const audiences: Audience[] = dbAudiences.map((a) => ({
    id: a.id, name: a.name, description: a.description, segment: a.segment, size: a.size, criteria: a.criteria || [],
  }));

  const scripts: Script[] = dbScripts.map((s) => ({
    id: s.id, name: s.name, type: s.type as Script["type"], content: s.content, tags: s.tags || [],
    objective: s.objective, audienceId: s.audience_id,
  }));

  const objections: Objection[] = dbObjections.map((o) => ({
    id: o.id, objection: o.title, response: o.response, category: o.category, frequency: o.frequency,
  }));

  // === DEFAULT FUNNEL STEPS ===
  const DEFAULT_FUNNEL_STEPS = [
    { name: "Novo Lead", isConversion: false },
    { name: "Contatado", isConversion: false },
    { name: "Proposta", isConversion: false },
    { name: "Convertido", isConversion: true },
  ];

  // === CAMPAIGN CRUD ===
  const addCampaign = async (c: { name: string; audienceId: string | null; funnelSteps?: { name: string; isConversion?: boolean }[] }) => {
    const nameResult = campaignNameSchema.safeParse(c.name);
    if (!nameResult.success) { toast.error(nameResult.error.errors[0]?.message); return null; }
    const steps = c.funnelSteps && c.funnelSteps.length > 0 ? c.funnelSteps : DEFAULT_FUNNEL_STEPS;
    for (const s of steps) {
      const stepResult = funnelStepSchema.safeParse(s);
      if (!stepResult.success) { toast.error(stepResult.error.errors[0]?.message); return null; }
    }

    const { data, error } = await supabase.from("campaigns").insert({
      user_id: user!.id,
      name: nameResult.data,
      audience_id: c.audienceId || null,
      status: "active",
    }).select().single();
    if (error || !data) return null;

    // Ensure exactly 1 conversion step
    const hasConversion = steps.some((s) => s.isConversion);
    const stepsToInsert = steps.map((s, i) => ({
      campaign_id: data.id,
      step_name: s.name.trim().slice(0, 100),
      step_order: i + 1,
      variation_a: "",
      variation_b: "",
      is_conversion: hasConversion ? (s.isConversion || false) : (i === steps.length - 1),
    }));

    await supabase.from("message_steps").insert(stepsToInsert);

    await refreshCampaigns();
    return data.id as string;
  };

  const updateCampaign = async (id: string, data: any) => {
    await supabase.from("campaigns").update(data).eq("id", id);
    await refreshCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    await refreshCampaigns();
  };

  const duplicateCampaign = async (id: string) => {
    const original = dbCampaigns.find((c) => c.id === id);
    if (!original) return;

    const { data: newCamp } = await supabase.from("campaigns").insert({
      user_id: user!.id,
      name: `${original.name} (cópia)`,
      audience_id: original.audience_id,
      status: original.status,
    }).select().single();

    if (!newCamp) return;

    // Duplicate funnel steps
    const steps = dbSteps.filter((s) => s.campaign_id === id);
    if (steps.length > 0) {
      await supabase.from("message_steps").insert(
        steps.map((s) => ({
          campaign_id: newCamp.id,
          step_name: s.step_name,
          step_order: s.step_order,
          variation_a: s.variation_a,
          variation_b: s.variation_b,
        }))
      );
    }

    // Duplicate campaign_leads (link same leads to new campaign)
    const clRows = dbCampaignLeadsJoined.filter((cl) => cl.campaign_id === id);
    if (clRows.length > 0) {
      await supabase.from("campaign_leads").insert(
        clRows.map((cl) => ({
          campaign_id: newCamp.id,
          lead_id: cl.lead_id,
          step_index: cl.step_index,
          status: cl.status,
          deal_value: cl.deal_value ?? 0,
        }))
      );
    }

    await refreshCampaigns();
  };

  // === GLOBAL LEAD CRUD ===
  const addLead = async (lead: { name: string; company: string; role: string; phone: string; email: string; leadTemplateId?: string; customData?: Record<string, any> }): Promise<string | null> => {
    const result = leadSchema.safeParse(lead);
    if (!result.success) { toast.error(result.error.errors[0]?.message); return null; }
    const v = result.data;
    const insertData: any = {
      user_id: user!.id,
      name: v.name,
      company: v.company,
      role: v.role,
      phone: v.phone,
      email: v.email,
      contact: v.phone || v.email,
    };
    if (lead.leadTemplateId) insertData.lead_model_id = lead.leadTemplateId;
    if (lead.customData) insertData.custom_data = lead.customData;
    const { data, error } = await supabase.from("leads").insert(insertData).select().single();
    if (error || !data) return null;
    await refreshLeads();
    return data.id as string;
  };

  const updateLead = async (leadId: string, data: Partial<{ name: string; company: string; role: string; phone: string; email: string; customData: Record<string, any> }>) => {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.company !== undefined) update.company = data.company;
    if (data.role !== undefined) update.role = data.role;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.email !== undefined) update.email = data.email;
    if (data.customData !== undefined) update.custom_data = data.customData;
    await supabase.from("leads").update(update).eq("id", leadId);
    await Promise.all([refreshLeads(), refreshCampaigns()]);
  };

  const deleteLead = async (leadId: string) => {
    // Cascade delete related records (no FK constraints in DB)
    await supabase.from("campaign_lead_notes").delete().eq("lead_id", leadId);
    await supabase.from("interactions").delete().eq("lead_id", leadId);
    await supabase.from("lead_calendar_events").delete().eq("lead_id", leadId);
    await supabase.from("campaign_leads").delete().eq("lead_id", leadId);
    await supabase.from("leads").delete().eq("id", leadId);
    await Promise.all([refreshLeads(), refreshCampaigns()]);
  };

  // === CAMPAIGN-LEAD LINKING ===
  const linkLeadToCampaign = async (leadId: string, campaignId: string) => {
    // Find the first step of the campaign funnel to set current_step_id
    const firstStep = dbSteps
      .filter((s) => s.campaign_id === campaignId)
      .sort((a, b) => a.step_order - b.step_order)[0];
    
    const insertData: any = {
      campaign_id: campaignId,
      lead_id: leadId,
      step_index: 0,
      status: "pending",
      deal_value: 0,
    };
    if (firstStep) insertData.current_step_id = firstStep.id;

    const { error } = await supabase.from("campaign_leads").insert(insertData);
    if (error) {
      if (error.code === "23505") {
        toast.error("Lead já vinculado a esta campanha");
      } else {
        toast.error("Erro ao vincular lead");
      }
      return;
    }
    await refreshCampaigns();
  };

  const unlinkLeadFromCampaign = async (leadId: string, campaignId: string) => {
    await supabase.from("campaign_leads").delete().eq("lead_id", leadId).eq("campaign_id", campaignId);
    await refreshCampaigns();
  };

  const updateCampaignLeadStatus = async (campaignLeadId: string, data: Partial<{ status: string; step_index: number; current_step_id: string; deal_value: number; close_probability: number | null; reminder_at: string | null; pinned_note: string | null }>) => {
    const update: any = {};
    if (data.status !== undefined) update.status = data.status;
    if (data.step_index !== undefined) update.step_index = data.step_index;
    if (data.current_step_id !== undefined) update.current_step_id = data.current_step_id;
    if (data.deal_value !== undefined) update.deal_value = data.deal_value;
    if (data.close_probability !== undefined) update.close_probability = data.close_probability;
    if (data.reminder_at !== undefined) update.reminder_at = data.reminder_at;
    if (data.pinned_note !== undefined) update.pinned_note = data.pinned_note;
    await supabase.from("campaign_leads").update(update).eq("id", campaignLeadId);
    await refreshCampaigns();
  };

  // === FUNNEL CRUD ===
  const updateFunnel = async (campaignId: string, steps: { id?: string; name: string; order: number; variationA: string; variationB: string; isConversion?: boolean }[]) => {
    const existingSteps = dbSteps.filter((s) => s.campaign_id === campaignId);
    const existingIds = new Set(existingSteps.map((s) => s.id));
    const incomingIds = new Set(steps.filter((s) => s.id).map((s) => s.id!));

    // Delete steps that were removed
    const toDelete = existingSteps.filter((s) => !incomingIds.has(s.id));
    if (toDelete.length > 0) {
      await supabase.from("message_steps").delete().in("id", toDelete.map((s) => s.id));
    }

    // Update existing steps
    const toUpdate = steps.filter((s) => s.id && existingIds.has(s.id));
    for (const s of toUpdate) {
      await supabase.from("message_steps").update({
        step_name: s.name,
        step_order: s.order,
        variation_a: s.variationA,
        variation_b: s.variationB,
        is_conversion: s.isConversion || false,
      }).eq("id", s.id!);
    }

    // Insert new steps
    const toInsert = steps.filter((s) => !s.id || !existingIds.has(s.id));
    if (toInsert.length > 0) {
      await supabase.from("message_steps").insert(
        toInsert.map((s) => ({
          campaign_id: campaignId,
          step_name: s.name,
          step_order: s.order,
          variation_a: s.variationA,
          variation_b: s.variationB,
          is_conversion: s.isConversion || false,
        }))
      );
    }

    await refreshCampaigns();
  };

  // === AUDIENCE CRUD ===
  const addAudience = async (a: { name: string; description: string; segment: string; criteria: string[] }) => {
    const result = audienceSchema.safeParse(a);
    if (!result.success) { toast.error(result.error.errors[0]?.message); return; }
    const v = result.data;
    await supabase.from("audiences").insert({ user_id: user!.id, name: v.name, description: v.description, segment: v.segment, criteria: v.criteria, size: 0 });
    await refreshAudiences();
  };

  const updateAudience = async (id: string, data: Partial<{ name: string; description: string; segment: string; criteria: string[] }>) => {
    await supabase.from("audiences").update(data).eq("id", id);
    await refreshAudiences();
  };

  const deleteAudience = async (id: string) => {
    await supabase.from("audiences").delete().eq("id", id);
    await refreshAudiences();
  };

  // === SCRIPT CRUD ===
  const addScript = async (s: { name: string; type: string; content: string; tags: string[]; objective?: string; audienceId?: string }) => {
    const result = scriptSchema.safeParse(s);
    if (!result.success) { toast.error(result.error.errors[0]?.message); return; }
    const v = result.data;
    const insertData: any = { user_id: user!.id, name: v.name, type: v.type, content: v.content, tags: v.tags };
    if (s.objective) insertData.objective = s.objective;
    if (s.audienceId) insertData.audience_id = s.audienceId;
    await supabase.from("scripts").insert(insertData);
    await refreshScripts();
  };

  const updateScript = async (id: string, data: Partial<{ name: string; type: string; content: string; tags: string[] }>) => {
    await supabase.from("scripts").update(data).eq("id", id);
    await refreshScripts();
  };

  const deleteScript = async (id: string) => {
    await supabase.from("scripts").delete().eq("id", id);
    await refreshScripts();
  };

  const duplicateScript = async (id: string) => {
    const original = dbScripts.find((s) => s.id === id);
    if (!original) return;
    await supabase.from("scripts").insert({
      user_id: user!.id,
      name: `${original.name} (cópia)`,
      type: original.type,
      content: original.content,
      tags: original.tags,
      objective: original.objective || null,
      audience_id: original.audience_id || null,
    });
    await refreshScripts();
  };

  // === OBJECTION CRUD ===
  const addObjection = async (o: { title: string; response: string; category: string }) => {
    const result = objectionSchema.safeParse(o);
    if (!result.success) { toast.error(result.error.errors[0]?.message); return; }
    const v = result.data;
    await supabase.from("objections").insert({ user_id: user!.id, title: v.title, response: v.response, category: v.category, frequency: 0 });
    await refreshObjections();
  };

  const updateObjection = async (id: string, data: Partial<{ title: string; response: string; category: string }>) => {
    await supabase.from("objections").update(data).eq("id", id);
    await refreshObjections();
  };

  const deleteObjection = async (id: string) => {
    await supabase.from("objections").delete().eq("id", id);
    await refreshObjections();
  };

  // === LEAD TEMPLATE CRUD ===
  const leadTemplates: LeadTemplate[] = dbLeadTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    fields: (t.fields as LeadModelField[]) || [],
    createdAt: t.created_at,
  }));

  const addLeadTemplate = async (name: string, fields: LeadModelField[]): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase.from("lead_templates").insert({
      user_id: user.id,
      name,
      fields: fields as any,
    }).select().single();
    if (!data) return null;
    await refreshLeadTemplates();
    return data.id as string;
  };

  const updateLeadTemplate = async (id: string, name: string, fields: LeadModelField[]) => {
    await supabase.from("lead_templates").update({ name, fields: fields as any }).eq("id", id);
    await refreshLeadTemplates();
  };

  const deleteLeadTemplate = async (id: string) => {
    // Check if any leads use this template
    const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("lead_model_id", id);
    if (count && count > 0) {
      // Unlink leads from this template before deleting
      await supabase.from("leads").update({ lead_model_id: null }).eq("lead_model_id", id);
    }
    // Also clear any campaigns referencing this template
    await supabase.from("campaigns").update({ default_lead_template_id: null }).eq("default_lead_template_id", id);
    await supabase.from("lead_templates").delete().eq("id", id);
    await Promise.all([refreshLeadTemplates(), refreshLeads(), refreshCampaigns()]);
  };

  const duplicateLeadTemplate = async (id: string) => {
    const original = dbLeadTemplates.find((t) => t.id === id);
    if (!original || !user) return;
    await supabase.from("lead_templates").insert({
      user_id: user.id,
      name: `${original.name} (cópia)`,
      fields: original.fields,
    });
    await refreshLeadTemplates();
  };

  const getTemplateForLead = (lead: Lead): LeadTemplate | null => {
    if (!lead.leadModelId) return null;
    return leadTemplates.find((t) => t.id === lead.leadModelId) || null;
  };

  // === INTERACTION ===
  const addInteraction = async (leadId: string, outcome: string) => {
    const result = interactionSchema.safeParse({ outcome });
    if (!result.success) { toast.error(result.error.errors[0]?.message); return; }
    await supabase.from("interactions").insert({ lead_id: leadId, outcome: result.data.outcome });
  };

  // === ONBOARDING ===
  const completeOnboarding = async (profileData: import("@/lib/onboardingGenerator").OnboardingProfile): Promise<string | null> => {
    if (!user) return null;

    const { generateAudiences, generateScripts, generateCampaignConfig } = await import("@/lib/onboardingGenerator");

    // 1. Update profile
    await supabase.from("profiles").update({
      onboarding_completed: true,
      offer_type: profileData.offerType || null,
      target_audience_description: profileData.targetAudienceDescription || null,
      main_pain: profileData.mainPain || null,
      differential: profileData.differential || null,
      maturity_level: profileData.maturityLevel || null,
      contact_channel: profileData.contactChannel || null,
      average_ticket: profileData.averageTicket || null,
    }).eq("id", user.id);

    // 2. Insert audiences
    const genAudiences = generateAudiences(profileData) || [];
    let firstAudienceId: string | null = null;
    if (genAudiences.length > 0) {
      const { data: insertedAudiences } = await supabase.from("audiences").insert(
        genAudiences.map((a) => ({
          user_id: user.id,
          name: a.name,
          description: a.description,
          segment: a.segment,
          criteria: a.criteria,
          size: a.size,
        }))
      ).select();
      if (insertedAudiences && insertedAudiences.length > 0) {
        firstAudienceId = insertedAudiences[0].id;
      }
    }

    // 3. Insert scripts
    const genScripts = generateScripts(profileData) || [];
    if (genScripts.length > 0) {
      await supabase.from("scripts").insert(
        genScripts.map((s) => ({
          user_id: user.id,
          name: s.name,
          type: s.type,
          content: s.content,
          tags: s.tags,
        }))
      );
    }

    // 4. Insert campaign + steps
    const campaignConfig = generateCampaignConfig(profileData);
    let campaignId: string | null = null;
    if (campaignConfig) {
      const { data: newCampaign } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name: campaignConfig.name,
        audience_id: firstAudienceId,
        status: "active",
      }).select().single();

      if (newCampaign) {
        campaignId = newCampaign.id;
        await supabase.from("message_steps").insert(
          campaignConfig.steps.map((s, i) => ({
            campaign_id: newCampaign.id,
            step_name: s.name,
            step_order: i + 1,
            variation_a: s.variationA,
            variation_b: s.variationB,
          }))
        );
      }
    }

    // 5. Refresh
    setProfileCompleted(true);
    await fetchAll();
    return campaignId;
  };

  // === SCRIPT SETS CRUD ===
  const addScriptSet = async (name: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase.from("script_sets").insert({ user_id: user.id, name }).select("id").single();
    if (error) { console.error("addScriptSet error:", error); return null; }
    await refreshScriptSets();
    return data?.id ?? null;
  };

  const deleteScriptSet = async (id: string) => {
    await supabase.from("script_sets").delete().eq("id", id);
    await refreshScriptSets();
  };

  const addScriptSetItem = async (setId: string, stepOrder: number, title: string, content: string) => {
    await supabase.from("script_set_items").insert({ set_id: setId, step_order: stepOrder, title, content });
    await refreshScriptSets();
  };

  const updateScriptSetItem = async (itemId: string, data: Partial<{ title: string; content: string }>) => {
    await supabase.from("script_set_items").update(data).eq("id", itemId);
    await refreshScriptSets();
  };

  const deleteScriptSetItem = async (itemId: string) => {
    await supabase.from("script_set_items").delete().eq("id", itemId);
    await refreshScriptSets();
  };

  const markOrionWelcomed = useCallback(async () => {
    setOrionWelcomed(true);
    if (!user) return;
    await supabase.from("profiles").update({ orion_welcomed: true } as any).eq("id", user.id);
  }, [user]);

  const setOrionTourStep = useCallback(async (step: number) => {
    setOrionTourStepState(step);
    // If restarting tour (step 0), also reset orion_welcomed
    if (step === 0) {
      setOrionWelcomed(false);
    }
    if (!user) return;
    const updateData: any = { orion_tour_step: step };
    if (step === 0) updateData.orion_welcomed = false;
    await supabase.from("profiles").update(updateData).eq("id", user.id);
  }, [user]);

  const completeOrionTour = useCallback(async () => {
    setOrionTourStepState(7);
    setOrionWelcomed(true);
    if (!user) return;
    await supabase.from("profiles").update({ orion_tour_step: 7, orion_welcomed: true } as any).eq("id", user.id);
  }, [user]);

  return (
    <StoreContext.Provider
      value={{
        loading,
        profileCompleted,
        personalProfileCompleted,
        profileData: profileDataState,
        orionWelcomed,
        orionTourStep,
        markOrionWelcomed,
        setOrionTourStep,
        completeOrionTour,
        leadTemplates,
        campaigns, allLeads, audiences, scripts, scriptSets, objections,
        refreshCampaigns, refreshLeads, refreshAudiences, refreshScripts, refreshObjections, refreshLeadTemplates,
        addLeadTemplate, updateLeadTemplate, deleteLeadTemplate, duplicateLeadTemplate, getTemplateForLead,
        addCampaign, updateCampaign, deleteCampaign, duplicateCampaign,
        addLead, updateLead, deleteLead,
        linkLeadToCampaign, unlinkLeadFromCampaign, updateCampaignLeadStatus,
        updateFunnel,
        addAudience, updateAudience, deleteAudience,
        addScript, updateScript, deleteScript, duplicateScript,
        addObjection, updateObjection, deleteObjection,
        addInteraction,
        addScriptSet, deleteScriptSet, addScriptSetItem, updateScriptSetItem, deleteScriptSetItem,
        completeOnboarding,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
