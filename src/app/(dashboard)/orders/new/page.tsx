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
    <div className="px-4 py-4 md:p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Nova Encomenda</h1>
      <OrderForm
        clients={clients}
        products={products}
        paymentTypes={paymentTypes}
        statuses={statuses}
      />
    </div>
  );
}
