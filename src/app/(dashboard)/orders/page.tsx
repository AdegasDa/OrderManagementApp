export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrders, getOrderById } from "@/features/orders/actions";
import { getOrderStatuses } from "@/features/statuses/actions";
import { getClients } from "@/features/clients/actions";
import { getProducts } from "@/features/products/actions";
import { getPaymentTypes } from "@/features/payments/actions";
import { OrderList } from "@/features/orders/components/OrderList";
import { OrderFilters } from "@/features/orders/components/OrderFilters";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";

type SearchParams = Promise<{
  id?: string;
  orderNumber?: string;
  statusId?: string;
  clientName?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
}>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (params.id) {
    const [order, clients, products, paymentTypes, statuses] = await Promise.all([
      getOrderById(params.id),
      getClients(), getProducts(), getPaymentTypes(), getOrderStatuses(),
    ]);
    if (!order) redirect("/orders");
    return (
      <div className="px-4 py-4 md:p-6">
        <OrderDetailView
          order={order}
          clients={clients}
          products={products}
          paymentTypes={paymentTypes}
          statuses={statuses}
        />
      </div>
    );
  }

  const filters = {
    orderNumber: params.orderNumber ? parseInt(params.orderNumber) : undefined,
    statusId:    params.statusId,
    dateFrom:    params.dateFrom,
    dateTo:      params.dateTo,
    sortBy:      params.sortBy,
  };

  const [allOrders, statuses] = await Promise.all([
    getOrders(filters),
    getOrderStatuses(),
  ]);

  const orders = params.clientName
    ? allOrders.filter((o) => o.client.name.toLowerCase().includes(params.clientName!.toLowerCase()))
    : allOrders;

  return (
    <div className="px-4 py-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Encomendas</h1>
        <Link href="/orders/new" className="hidden md:block">
          <Button size="sm"><Plus size={16} className="mr-2" />Nova Encomenda</Button>
        </Link>
      </div>
      <Suspense fallback={null}>
        <OrderFilters statuses={statuses} />
      </Suspense>
      <p className="text-xs text-muted-foreground">
        {orders.length} encomenda{orders.length !== 1 ? "s" : ""}
      </p>
      <OrderList orders={orders} />

      {/* FAB — mobile only */}
      <Link
        href="/orders/new"
        className="md:hidden fixed right-5 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
