import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { personalProfileSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TREATMENT_OPTIONS = [
  { value: "senhor", label: "Senhor" },
  { value: "senhora", label: "Senhora" },
  { value: "voce", label: "Você" },
  { value: "neutro", label: "Tratamento neutro" },
] as const;

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function PersonalProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [treatmentType, setTreatmentType] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;

    const mapped = treatmentType === "" ? "neutro" : treatmentType;
    const result = personalProfileSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      preferred_name: preferredName,
      treatment_type: mapped,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      let avatarUrl: string | null = null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      const updateData: Record<string, any> = {
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        preferred_name: result.data.preferred_name,
        treatment_type: result.data.treatment_type,
        personal_profile_completed: true,
      };
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil configurado com sucesso!");
      // Force full reload to refresh store
      window.location.href = "/app";
    } catch (err: any) {
      toast.error("Erro ao salvar perfil: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">FlowSpecta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Configuração do Perfil Executivo
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Personalize sua experiência para que o sistema se adapte ao seu estilo.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group"
            >
              <div className="h-24 w-24 rounded-full border-2 border-border bg-secondary flex items-center justify-center overflow-hidden transition group-hover:border-primary/50">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : firstName && lastName ? (
                  <span className="text-2xl font-bold text-muted-foreground">{getInitials(firstName, lastName)}</span>
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full gradient-primary flex items-center justify-center border-2 border-background">
                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground -mt-2">Foto opcional · máx. 2MB</p>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Nome</Label>
              <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Seu nome" />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Seu sobrenome" />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferred_name">Como prefere ser chamado</Label>
            <Input id="preferred_name" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="Ex: Brayan, Dra. Ana..." />
            {errors.preferred_name && <p className="text-xs text-destructive">{errors.preferred_name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="treatment_type">Forma de Tratamento</Label>
            <div className="relative">
              <select
                id="treatment_type"
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value)}
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
            {errors.treatment_type && <p className="text-xs text-destructive">{errors.treatment_type}</p>}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 glow-primary transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}