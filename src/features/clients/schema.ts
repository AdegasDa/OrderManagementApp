import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.preprocess(v => (v === "" || v == null) ? null : v, z.string().nullable()),
  source: z.enum(["STORE", "INSTAGRAM", "WHATSAPP"]),
  socialHandle: z.preprocess(v => (v === "" || v == null) ? null : v, z.string().nullable()),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const sourceLabels: Record<string, string> = {
  STORE: "Loja",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
};
