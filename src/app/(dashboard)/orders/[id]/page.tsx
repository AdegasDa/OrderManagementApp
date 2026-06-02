import { notFound } from "next/navigation";
import { getOrderById } from "@/features/orders/actions";
import { getClients } from "@/features/clients/actions";
import { getProducts } from "@/features/products/actions";
import { getPaymentTypes } from "@/features/payments/actions";
import { getOrderStatuses } from "@/features/statuses/actions";
import { OrderForm } from "@/features/orders/components/OrderForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [order, clients, products, paymentTypes, statuses] = await Promise.all([
    getOrderById(id),
    getClients(),
    getProducts(),
    getPaymentTypes(),
    getOrderStatuses(),
  ]);

  if (!order) notFound();

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Encomenda #{order.orderNumber}</h1>
      <OrderForm
        order={order}
        clients={clients}
        products={products}
        paymentTypes={paymentTypes}
        statuses={statuses}
      />
    </div>
  );
}
