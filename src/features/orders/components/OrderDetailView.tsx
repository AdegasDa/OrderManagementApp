"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderForm } from "./OrderForm";
import type { OrderWithRelations, Product, PaymentType, OrderStatus } from "@/lib/types";
import type { ClientOption } from "@/components/ui/client-combobox";

interface Props {
  order: OrderWithRelations;
  clients: ClientOption[];
  products: Pick<Product, "id" | "name" | "salePrice">[];
  paymentTypes: PaymentType[];
  statuses: OrderStatus[];
}

export function OrderDetailView({ order, clients, products, paymentTypes, statuses }: Props) {
  const router = useRouter();
  const clientName   = clients.find((c) => c.id === order.clientId)?.name;
  const productNames = order.orderProducts.map((op) => op.product.name).join(", ");

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Encomendas</p>
            <h1 className="text-xl font-semibold leading-tight">Encomenda #{order.orderNumber}</h1>
          </div>
        </div>
        {(clientName || productNames) && (
          <p className="text-sm text-muted-foreground ml-11 mt-0.5">
            {[clientName, productNames].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
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
