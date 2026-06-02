"use client";

import { useEffect, useState } from "react";
import { getClients } from "@/features/clients/actions";
import { getProducts } from "@/features/products/actions";
import { getPaymentTypes } from "@/features/payments/actions";
import { getOrderStatuses } from "@/features/statuses/actions";
import { OrderForm } from "@/features/orders/components/OrderForm";
import type { Client, Product, PaymentType, OrderStatus } from "@/lib/types";

export default function NewOrderPage() {
  const [data, setData] = useState<{
    clients: Client[]; products: Product[];
    paymentTypes: PaymentType[]; statuses: OrderStatus[];
  } | null>(null);

  useEffect(() => {
    Promise.all([getClients(), getProducts(), getPaymentTypes(), getOrderStatuses()])
      .then(([clients, products, paymentTypes, statuses]) =>
        setData({ clients, products, paymentTypes, statuses })
      );
  }, []);

  if (!data) return <div className="p-6"><p className="text-muted-foreground">A carregar…</p></div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Nova Encomenda</h1>
      <OrderForm
        clients={data.clients}
        products={data.products}
        paymentTypes={data.paymentTypes}
        statuses={data.statuses}
      />
    </div>
  );
}
