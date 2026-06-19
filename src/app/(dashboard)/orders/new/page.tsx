export const dynamic = "force-dynamic";

import { getClients } from "@/features/clients/actions";
import { getProducts } from "@/features/products/actions";
import { getPaymentTypes } from "@/features/payments/actions";
import { getOrderStatuses } from "@/features/statuses/actions";
import { OrderForm } from "@/features/orders/components/OrderForm";

export default async function NewOrderPage() {
  const [clients, products, paymentTypes, statuses] = await Promise.all([
    getClients(), getProducts(), getPaymentTypes(), getOrderStatuses(),
  ]);

  return (
    <div className="px-4 py-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nova Encomenda</h1>
        <p className="text-sm text-muted-foreground mt-1">Preencha os dados para criar uma nova encomenda.</p>
      </div>
      <OrderForm
        clients={clients}
        products={products}
        paymentTypes={paymentTypes}
        statuses={statuses}
      />
    </div>
  );
}
