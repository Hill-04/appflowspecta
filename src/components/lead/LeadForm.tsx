import { useState } from "react";
import { LeadTemplate, LeadModelField } from "@/hooks/useStore";

interface LeadFormPayload {
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  customData?: Record<string, any>;
}

interface Props {
  template: LeadTemplate | null;
  onSubmit: (payload: LeadFormPayload) => void;
  onCancel: () => void;
  saving?: boolean;
  submitLabel?: string;
  externalFixedForm?: { name: string; company: string; role: string; phone: string; email: string };
  onFixedFormChange?: (f: { name: string; company: string; role: string; phone: string; email: string }) => void;
  externalDynamicValues?: Record<string, any>;
  onDynamicValuesChange?: (v: Record<string, any>) => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50";

export function LeadForm({ template, onSubmit, onCancel, saving, submitLabel = "Criar Lead", externalFixedForm, onFixedFormChange, externalDynamicValues, onDynamicValuesChange }: Props) {
  // Fixed fields state (no template)
  const [internalFixed, setInternalFixed] = useState({ name: "", company: "", role: "", phone: "", email: "" });
  const fixedForm = externalFixedForm ?? internalFixed;
  const setFixedForm = (f: typeof fixedForm) => { if (onFixedFormChange) onFixedFormChange(f); else setInternalFixed(f); };

  // Dynamic fields state (with template)
  const [internalDynamic, setInternalDynamic] = useState<Record<string, any>>({});
  const dynamicValues = externalDynamicValues ?? internalDynamic;
  const setDynamicValuesRaw = (v: Record<string, any>) => { if (onDynamicValuesChange) onDynamicValuesChange(v); else setInternalDynamic(v); };
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setDynamic = (fieldId: string, value: any) => {
    setDynamicValuesRaw({ ...dynamicValues, [fieldId]: value });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleFixedSubmit = () => {
    if (!fixedForm.name.trim()) return;
    onSubmit({ ...fixedForm });
  };

  const handleDynamicSubmit = () => {
    if (!template) return;
    const newErrors: Record<string, string> = {};

    // Validate required fields
    for (const field of template.fields) {
      if (field.required) {
        const val = dynamicValues[field.id];
        if (val === undefined || val === null || val === "" || (field.type === "checkbox" && val === false)) {
          newErrors[field.id] = `${field.label} é obrigatório`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build payload: primary field -> name, rest -> customData
    const primaryField = template.fields.find((f) => f.is_primary);
    const name = primaryField ? String(dynamicValues[primaryField.id] || "").trim() : "";

    if (!name) {
      if (primaryField) {
        setErrors({ [primaryField.id]: `${primaryField.label} é obrigatório` });
      }
      return;
    }

    const customData: Record<string, any> = {};
    for (const field of template.fields) {
      if (!field.is_primary) {
        customData[field.id] = dynamicValues[field.id] ?? "";
      }
    }

    onSubmit({
      name,
      company: "",
      role: "",
      phone: "",
      email: "",
      customData,
    });
  };

  // === No template: fixed fields ===
  if (!template) {
    return (
      <div className="space-y-3 py-2">
        <input placeholder="Nome *" maxLength={100} value={fixedForm.name} onChange={(e) => setFixedForm({ ...fixedForm, name: e.target.value })} className={inputClass} />
        <input placeholder="Empresa" maxLength={100} value={fixedForm.company} onChange={(e) => setFixedForm({ ...fixedForm, company: e.target.value })} className={inputClass} />
        <input placeholder="Cargo" maxLength={100} value={fixedForm.role} onChange={(e) => setFixedForm({ ...fixedForm, role: e.target.value })} className={inputClass} />
        <input placeholder="Telefone" maxLength={20} value={fixedForm.phone} onChange={(e) => setFixedForm({ ...fixedForm, phone: e.target.value })} className={inputClass} />
        <input placeholder="E-mail" maxLength={255} type="email" value={fixedForm.email} onChange={(e) => setFixedForm({ ...fixedForm, email: e.target.value })} className={inputClass} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
          <button onClick={handleFixedSubmit} disabled={!fixedForm.name.trim() || saving} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">
            {saving ? "Salvando..." : submitLabel}
          </button>
        </div>
      </div>
    );
  }

  // === With template: dynamic fields ===
  // Sort: primary first, then by original order
  const sortedFields = [...template.fields].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  return (
    <div className="space-y-3 py-2">
      {sortedFields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          value={dynamicValues[field.id]}
          onChange={(val) => setDynamic(field.id, val)}
          error={errors[field.id]}
        />
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancelar</button>
        <button onClick={handleDynamicSubmit} disabled={saving} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">
          {saving ? "Salvando..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

// === Dynamic field renderer ===
function DynamicField({ field, value, onChange, error }: { field: LeadModelField; value: any; onChange: (v: any) => void; error?: string }) {
  const label = `${field.label}${field.required ? " *" : ""}`;

  const wrapper = (children: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  switch (field.type) {
    case "short_text":
      return wrapper(
        <input
          placeholder={field.label}
          maxLength={100}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "long_text":
      return wrapper(
        <textarea
          placeholder={field.label}
          maxLength={1000}
          rows={3}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass + " resize-none"}
        />
      );

    case "number":
      return wrapper(
        <input
          type="number"
          placeholder={field.label}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className={inputClass}
        />
      );

    case "link":
      return wrapper(
        <input
          type="url"
          placeholder="https://..."
          maxLength={500}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "date":
      return wrapper(
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "dropdown":
      return wrapper(
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Selecione...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case "checkbox":
      return (
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-border"
            />
            {field.label}{field.required ? " *" : ""}
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    default:
      return wrapper(
        <input
          placeholder={field.label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
}
