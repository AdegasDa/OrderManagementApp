import { z } from "zod";

export const orderSchema = z.object({
  orderDate: z.string().min(1, "Data é obrigatória"),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  productId: z.string().min(1, "Produto é obrigatório"),
  paymentTypeId: z.string().min(1, "Tipo de pagamento é obrigatório"),
  statusId: z.string().min(1, "Estado é obrigatório"),
  totalValue: z.number().min(0, "Deve ser positivo"),
  advanceAmount: z.number().min(0).default(0),
  deliveryFee: z.number().min(0).default(0),
  notes: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
