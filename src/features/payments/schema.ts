import { z } from "zod";
export const paymentTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});
export type PaymentTypeFormValues = z.infer<typeof paymentTypeSchema>;
