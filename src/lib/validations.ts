import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  company: z.string().trim().max(100, "Máximo 100 caracteres").default(""),
  role: z.string().trim().max(100, "Máximo 100 caracteres").default(""),
  phone: z.string().trim().max(20, "Máximo 20 caracteres").default(""),
  email: z.string().trim().max(255, "Máximo 255 caracteres")
    .refine((val) => val === "" || z.string().email().safeParse(val).success, "E-mail inválido")
    .default(""),
});

export const campaignNameSchema = z.string().trim().min(1, "Nome é obrigatório").max(150, "Máximo 150 caracteres");

export const funnelStepSchema = z.object({
  name: z.string().trim().min(1, "Nome da etapa é obrigatório").max(100, "Máximo 100 caracteres"),
});

export const audienceSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().trim().max(500, "Máximo 500 caracteres").default(""),
  segment: z.string().trim().max(100, "Máximo 100 caracteres").default(""),
  criteria: z.array(z.string().trim().max(100, "Máximo 100 caracteres por critério")).max(20, "Máximo 20 critérios").default([]),
});

export const scriptSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  type: z.string().trim().min(1).max(50).default("opening"),
  content: z.string().trim().max(5000, "Máximo 5000 caracteres").default(""),
  tags: z.array(z.string().trim().max(50, "Máximo 50 caracteres por tag")).max(20, "Máximo 20 tags").default([]),
});

export const objectionSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200, "Máximo 200 caracteres"),
  response: z.string().trim().max(2000, "Máximo 2000 caracteres").default(""),
  category: z.string().trim().max(100, "Máximo 100 caracteres").default(""),
});

export const interactionSchema = z.object({
  outcome: z.string().trim().min(1, "Resultado é obrigatório").max(500, "Máximo 500 caracteres"),
});

export const actionRoleEnum = z.enum(["none", "profile", "contact", "qualification"]);

export const leadProfileModeEnum = z.enum(["default", "custom"]); // kept for backward compat

export const leadModelFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Label é obrigatória").max(100, "Máximo 100 caracteres"),
  type: z.enum(["short_text", "long_text", "number", "link", "date", "dropdown", "checkbox"]),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().max(100)).max(10, "Máximo 10 opções").optional(),
  used_in_script: z.boolean().default(false),
  is_primary: z.boolean().default(false),
  action_role: actionRoleEnum.default("none"),
});

export const leadTemplateSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  fields: z.array(leadModelFieldSchema).min(1, "Pelo menos 1 campo").max(20, "Máximo 20 campos")
    .refine(
      (fields) => fields.filter((f) => f.is_primary).length <= 1,
      "Apenas 1 campo pode ser principal"
    ),
});

// Keep alias for backward compat
export const leadModelSchema = leadTemplateSchema;

export const personalProfileSchema = z.object({
  first_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
  last_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
  preferred_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(30, "Máximo 30 caracteres"),
  treatment_type: z.enum(["senhor", "senhora", "voce", "neutro"]),
});
