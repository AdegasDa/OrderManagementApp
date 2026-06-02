import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  source: z.enum(["STORE", "INSTAGRAM", "WHATSAPP"]),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const sourceLabels: Record<string, string> = {
  STORE: "Loja",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
};
