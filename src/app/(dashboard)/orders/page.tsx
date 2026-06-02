"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/features/orders/actions";
import { getOrderById } from "@/features/orders/actions";
import { getOrderStatuses } from "@/features/statuses/actions";
import { getClients } from "@/features/clients/actions";
import { getProducts } from "@/features/products/actions";
import { getPaymentTypes } from "@/features/payments/actions";
import { OrderList } from "@/features/orders/components/OrderList";
import { OrderFilters } from "@/features/orders/components/OrderFilters";
import { OrderForm } from "@/features/orders/components/OrderForm";
import type { OrderWithRelations, OrderStatus, Client, Product, PaymentType } from "@/lib/types";

function OrderDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    order: OrderWithRelations; clients: Client[];
    products: Product[]; paymentTypes: PaymentType[]; statuses: OrderStatus[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      getOrderById(id), getClients(), getProducts(), getPaymentTypes(), getOrderStatuses(),
    ]).then(([order, clients, products, paymentTypes, statuses]) => {
      if (!order) { router.push("/orders"); return; }
      setData({ order, clients, products, paymentTypes, statuses });
    });
  }, [id, router]);

  if (!data) return <p className="text-muted-foreground">A carregar…</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/orders")}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-xl font-semibold">Encomenda #{data.order.orderNumber}</h1>
      </div>
      <OrderForm
        order={data.order}
        clients={data.clients}
        products={data.products}
        paymentTypes={data.paymentTypes}
        statuses={data.statuses}
      />
    </div>
  );
}

function OrderListContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);

  useEffect(() => {
    const clientName = searchParams.get("clientName") ?? undefined;
    const filters = {
      orderNumber: searchParams.get("orderNumber") ? parseInt(searchParams.get("orderNumber")!) : undefined,
      statusId:    searchParams.get("statusId") || undefined,
      dateFrom:    searchParams.get("dateFrom") || undefined,
      dateTo:      searchParams.get("dateTo")   || undefined,
      sortBy:      searchParams.get("sortBy")   || undefined,
    };
    Promise.all([getOrders(filters), getOrderStatuses()]).then(([all, sts]) => {
      const filtered = clientName
        ? all.filter((o: OrderWithRelations) => o.client.name.toLowerCase().includes(clientName.toLowerCase()))
        : all;
      setOrders(filtered);
      setStatuses(sts);
    });
  }, [searchParams]);

  return (
    <>
      <OrderFilters statuses={statuses} />
      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-2">
          {orders.length} encomenda{orders.length !== 1 ? "s" : ""}
        </p>
        <OrderList orders={orders} />
      </div>
    </>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  return id ? <OrderDetailContent id={id} /> : <OrderListContent />;
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="p-6 space-y-4">
      {!id && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Encomendas</h1>
          <Link href="/orders/new">
            <Button size="sm"><Plus size={16} className="mr-2" />Nova Encomenda</Button>
          </Link>
        </div>
      )}
      <Suspense fallback={<p className="text-muted-foreground">A carregar…</p>}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
