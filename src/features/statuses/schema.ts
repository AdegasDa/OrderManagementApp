import { z } from "zod";
export const statusSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (ex: #3b82f6)"),
});
export type StatusFormValues = z.infer<typeof statusSchema>;
