import { z } from "zod";

export const orderProductSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  quantity:  z.number().int().min(1).default(1),
  unitPrice: z.number().min(0).default(0),
});

export const orderSchema = z.object({
  orderDate:     z.string().min(1, "Data é obrigatória"),
  clientId:      z.string().min(1, "Cliente é obrigatório"),
  products:      z.array(orderProductSchema).min(1, "Adicione pelo menos um produto"),
  paymentTypeId: z.string().min(1, "Tipo de pagamento é obrigatório"),
  statusId:      z.string().min(1, "Estado é obrigatório"),
  totalValue:    z.number().min(0, "Deve ser positivo"),
  advanceAmount: z.number().min(0).default(0),
  deliveryFee:   z.number().min(0).default(0),
  notes:         z.string().optional(),
  deliveryNotes: z.string().optional(),
}).refine(
  (d) => d.advanceAmount <= d.totalValue,
  { message: "O adiantamento não pode ser maior que o valor total", path: ["advanceAmount"] }
);

/** Allowlist schema for quick-field updates — only pickupHour and statusId are permitted. */
export const quickFieldsSchema = z.object({
  pickupHour: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato inválido (HH:MM)")
    .nullable()
    .optional(),
  statusId: z.string().min(1).optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
