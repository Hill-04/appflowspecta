import { useState, useEffect, useRef } from "react";
import { Save, UserCircle, Star, Target, Award, Megaphone, Camera, ChevronDown, Calendar, Wifi, WifiOff, RefreshCw, Unplug, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface StrategicProfile {
  product: string;
  differentials: string[];
  idealClient: string;
  proofs: string[];
  positioning: string;
}

const defaultProfile: StrategicProfile = {
  product: "",
  differentials: [],
  idealClient: "",
  proofs: [],
  positioning: "",
};

const TREATMENT_OPTIONS = [
  { value: "senhor", label: "Senhor" },
  { value: "senhora", label: "Senhora" },
  { value: "voce", label: "Você" },
  { value: "neutro", label: "Tratamento neutro" },
] as const;

export default function StrategicProfilePage() {
  const { user } = useAuth();
  const { profileData } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const gcal = useGoogleCalendar();
  const showGoogleCalendar = useFeatureFlag("FEATURE_GOOGLE_CALENDAR");
  const [profile, setProfileState] = useState<StrategicProfile>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<StrategicProfile>(defaultProfile);
  const [loaded, setLoaded] = useState(false);
  const [strategicNotes, setStrategicNotes] = useState("");

  // Personal profile fields
  const [personalFirstName, setPersonalFirstName] = useState("");
  const [personalLastName, setPersonalLastName] = useState("");
  const [personalPreferredName, setPersonalPreferredName] = useState("");
  const [personalTreatment, setPersonalTreatment] = useState("");
  const [personalAvatarUrl, setPersonalAvatarUrl] = useState<string | null>(null);
  const [personalAvatarFile, setPersonalAvatarFile] = useState<File | null>(null);
  const [personalAvatarPreview, setPersonalAvatarPreview] = useState<string | null>(null);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("offer_type, target_audience_description, main_pain, differential, contact_channel, average_ticket, proof_results, positioning, strategic_notes")
        .eq("id", user.id)
        .maybeSingle();

      let dbProofs = data?.proof_results || "";
      let dbPositioning = data?.positioning || "";
      let dbNotes = data?.strategic_notes || "";

      // Silent localStorage migration
      try {
        const localData = localStorage.getItem("flowspecta_profile");
        if (localData) {
          const parsed = JSON.parse(localData);
          const updates: Record<string, string> = {};
          if (!dbProofs && parsed.proofs?.length > 0) {
            const migrated = parsed.proofs.filter((p: string) => p.trim()).join("\n");
            if (migrated) { updates.proof_results = migrated; dbProofs = migrated; }
          }
          if (!dbPositioning && parsed.positioning) {
            updates.positioning = parsed.positioning;
            dbPositioning = parsed.positioning;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from("profiles").update(updates).eq("id", user.id);
          }
          localStorage.removeItem("flowspecta_profile");
        }
      } catch (e) {
        console.error("localStorage migration failed:", e);
      }

      const mapped: StrategicProfile = {
        product: data?.offer_type || "",
        differentials: data?.differential ? [data.differential] : [],
        idealClient: data?.target_audience_description || "",
        proofs: dbProofs ? dbProofs.split("\n").filter((l: string) => l.trim()) : [],
        positioning: dbPositioning || (data?.main_pain ? `Resolvemos ${data.main_pain} pelo canal ${data.contact_channel || "direto"}, com ticket ${data.average_ticket || "variado"}.` : ""),
      };
      setProfileState(mapped);
      setForm(mapped);
      setStrategicNotes(dbNotes);
      setLoaded(true);
    })();
  }, [user]);

  useEffect(() => {
    gcal.checkStatus();
  }, [gcal.checkStatus]);

  // Sync personal fields from profileData
  useEffect(() => {
    if (profileData) {
      setPersonalFirstName(profileData.firstName || "");
      setPersonalLastName(profileData.lastName || "");
      setPersonalPreferredName(profileData.preferredName || "");
      setPersonalTreatment(profileData.treatmentType || "");
      setPersonalAvatarUrl(profileData.avatarUrl || null);
    }
  }, [profileData]);

  const handleSave = async () => {
    if (!user) return;
    setProfileState(form);
    try {
      await supabase.from("profiles").update({
        proof_results: form.proofs.filter(p => p.trim()).join("\n"),
        positioning: form.positioning,
        strategic_notes: strategicNotes,
      }).eq("id", user.id);
      toast.success("Perfil estratégico salvo!");
    } catch {
      toast.error("Erro ao salvar perfil");
    }
    setEditing(false);
  };

  const handleEdit = () => {
    setForm(profile);
    setEditing(true);
  };

  if (!loaded) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-muted-foreground animate-pulse">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Perfil Estratégico</h1>
          <p className="text-sm text-muted-foreground mt-1">Defina seu posicionamento para contextualizar suas campanhas</p>
        </div>
        {editing ? (
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition">
            <Save className="h-4 w-4" /> Salvar
          </button>
        ) : (
          <button onClick={handleEdit} className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition">
            Editar Perfil
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">O que você vende</h3>
          </div>
          {editing ? (
            <textarea value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition resize-none" rows={2} />
          ) : (
            <p className="text-sm text-muted-foreground">{profile.product || "Não definido"}</p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-foreground">Diferenciais</h3>
          </div>
          {editing ? (
            <textarea value={form.differentials.join("\n")} onChange={(e) => setForm({ ...form, differentials: e.target.value.split("\n") })} className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition resize-none" rows={4} placeholder="Um diferencial por linha" />
          ) : (
            <ul className="space-y-2">
              {profile.differentials.length > 0 ? profile.differentials.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{d}</li>
              )) : <li className="text-sm text-muted-foreground">Não definido</li>}
            </ul>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-foreground">Cliente Ideal</h3>
          </div>
          {editing ? (
            <textarea value={form.idealClient} onChange={(e) => setForm({ ...form, idealClient: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition resize-none" rows={3} />
          ) : (
            <p className="text-sm text-muted-foreground">{profile.idealClient || "Não definido"}</p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-success" />
            <h3 className="font-semibold text-foreground">Provas & Resultados</h3>
          </div>
          {editing ? (
            <textarea value={form.proofs.join("\n")} onChange={(e) => setForm({ ...form, proofs: e.target.value.split("\n") })} className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition resize-none" rows={4} placeholder="Uma prova por linha" />
          ) : (
            <ul className="space-y-2">
              {profile.proofs.length > 0 ? profile.proofs.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-success shrink-0" />{p}</li>
              )) : <li className="text-sm text-muted-foreground">Não definido</li>}
            </ul>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserCircle className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Posicionamento</h3>
          </div>
          {editing ? (
            <textarea value={form.positioning} onChange={(e) => setForm({ ...form, positioning: e.target.value })} className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition resize-none" rows={3} />
          ) : (
            <p className="text-sm text-muted-foreground italic">{profile.positioning ? `"${profile.positioning}"` : "Não definido"}</p>
          )}
        </div>

        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Anotações Estratégicas</h3>
          </div>
          {editing ? (
            <textarea value={strategicNotes} onChange={(e) => setStrategicNotes(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition resize-none" rows={4} placeholder="Informações adicionais sobre seu negócio, diferenciais, contexto de mercado..." />
          ) : (
            <p className="text-sm text-muted-foreground">{strategicNotes || "Não definido"}</p>
          )}
        </div>
      </div>

      {/* Personal Executive Info */}
      <div className="glass-card p-5 sm:p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground text-base">Informações Pessoais Executivas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Dados usados pelo Copiloto Estratégico ORION</p>
          </div>
          {editingPersonal ? (
            <button
              onClick={async () => {
                if (!user) return;
                setSavingPersonal(true);
                try {
                  let avatarUrl = personalAvatarUrl;
                  if (personalAvatarFile) {
                    const ext = personalAvatarFile.name.split(".").pop() || "jpg";
                    const path = `${user.id}/avatar.${ext}`;
                    await supabase.storage.from("avatars").upload(path, personalAvatarFile, { upsert: true });
                    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
                    avatarUrl = urlData.publicUrl;
                  }
                  const updateData: Record<string, any> = {
                    first_name: personalFirstName,
                    last_name: personalLastName,
                    preferred_name: personalPreferredName,
                    treatment_type: personalTreatment || "neutro",
                  };
                  if (avatarUrl) updateData.avatar_url = avatarUrl;
                  await supabase.from("profiles").update(updateData).eq("id", user.id);
                  setPersonalAvatarUrl(avatarUrl);
                  setPersonalAvatarFile(null);
                  setPersonalAvatarPreview(null);
                  setEditingPersonal(false);
                  toast.success("Informações pessoais atualizadas!");
                } catch {
                  toast.error("Erro ao salvar");
                } finally {
                  setSavingPersonal(false);
                }
              }}
              disabled={savingPersonal}
              className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 glow-primary transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {savingPersonal ? "Salvando..." : "Salvar"}
            </button>
          ) : (
            <button onClick={() => setEditingPersonal(true)} className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition">
              Editar
            </button>
          )}
        </div>

        {editingPersonal ? (
          <div className="space-y-4">
            {/* Avatar edit */}
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => fileRef.current?.click()} className="relative group shrink-0">
                <div className="h-16 w-16 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition">
                  {personalAvatarPreview || personalAvatarUrl ? (
                    <img src={personalAvatarPreview || personalAvatarUrl!} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {(personalFirstName.charAt(0) + personalLastName.charAt(0)).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full gradient-primary flex items-center justify-center border-2 border-background">
                  <Camera className="h-3 w-3 text-primary-foreground" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { toast.error("Máx. 2MB"); return; }
                  setPersonalAvatarFile(file);
                  setPersonalAvatarPreview(URL.createObjectURL(file));
                }} />
              </button>
              <p className="text-xs text-muted-foreground">Clique para alterar a foto</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={personalFirstName} onChange={(e) => setPersonalFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Sobrenome</Label>
                <Input value={personalLastName} onChange={(e) => setPersonalLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Como prefere ser chamado</Label>
              <Input value={personalPreferredName} onChange={(e) => setPersonalPreferredName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Forma de Tratamento</Label>
              <div className="relative">
                <select
                  value={personalTreatment}
                  onChange={(e) => setPersonalTreatment(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none pr-8"
                >
                  <option value="">Selecione...</option>
                  {TREATMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                  <option value="neutro">Prefiro não informar</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 col-span-full">
              <div className="h-12 w-12 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {personalAvatarUrl ? (
                  <img src={personalAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-muted-foreground">
                    {(personalFirstName.charAt(0) + personalLastName.charAt(0)).toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{personalFirstName} {personalLastName}</p>
                <p className="text-xs text-muted-foreground">
                  {personalTreatment === "senhor" ? "Senhor" : personalTreatment === "senhora" ? "Senhora" : personalTreatment === "voce" ? "Você" : "Tratamento neutro"}
                  {personalPreferredName ? ` · ${personalPreferredName}` : ""}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integrations Section */}
      {showGoogleCalendar && (
        <div className="glass-card p-5 sm:p-6 mt-6">
          <div className="mb-5">
            <h2 className="font-semibold text-foreground text-base">Integrações</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Conecte serviços externos ao seu fluxo</p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">Sincronize reuniões e follow-ups</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gcal.loading ? (
                  <span className="text-xs text-muted-foreground animate-pulse">Verificando...</span>
                ) : gcal.connectionStatus?.connected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-1 text-[11px] font-medium text-success">
                    <Wifi className="h-3 w-3" /> Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    <WifiOff className="h-3 w-3" /> Não conectado
                  </span>
                )}
              </div>
            </div>

            {gcal.connectionStatus?.connected && gcal.connectionStatus.connection && (
              <p className="text-xs text-muted-foreground pl-[52px]">
                Conectado em {new Date(gcal.connectionStatus.connection.connected_at).toLocaleDateString("pt-BR")}
                {gcal.connectionStatus.expired && (
                  <span className="text-warning ml-2">· Token expirado</span>
                )}
              </p>
            )}

            <div className="flex gap-2 pl-[52px]">
              {gcal.connectionStatus?.connected ? (
                <>
                  <button
                    onClick={gcal.retrySync}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
                  >
                    <RefreshCw className="h-3 w-3" /> Testar sincronização
                  </button>
                  <button
                    onClick={gcal.disconnect}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition"
                  >
                    <Unplug className="h-3 w-3" /> Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={gcal.connect}
                  className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition glow-primary-sm"
                >
                  <Calendar className="h-3.5 w-3.5" /> Conectar Google Calendar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
