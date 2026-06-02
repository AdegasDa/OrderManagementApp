import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  salePrice: z.number().min(0, "Preço deve ser positivo"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
