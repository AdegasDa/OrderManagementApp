import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrders, getOrderById, getOrdersForWeek } from "@/features/orders/actions";
import { getOrderStatuses } from "@/features/statuses/actions";
import { getClients } from "@/features/clients/actions";
import { getProducts } from "@/features/products/actions";
import { getPaymentTypes } from "@/features/payments/actions";
import { OrderList } from "@/features/orders/components/OrderList";
import { OrderFilters } from "@/features/orders/components/OrderFilters";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import { WeekView } from "@/features/orders/components/WeekView";
import { PaginationControls } from "@/components/ui/pagination-controls";

// Sun=0, Mon=1 are closed
const CLOSED_DAYS = new Set([0, 1]);

function toLocalStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWorkingDays(n: number): string[] {
  const days: string[] = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  while (days.length < n) {
    if (!CLOSED_DAYS.has(date.getDay())) {
      days.push(toLocalStr(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

type SearchParams = Promise<{
  id?: string;
  orderNumber?: string;
  statusId?: string;
  clientName?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  view?: string;
  page?: string;
}>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (params.id) {
    const [order, { items: clients }, { items: products }, paymentTypes, statuses] = await Promise.all([
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

  const hasFilters = !!(params.orderNumber || params.statusId || params.clientName || params.dateFrom || params.dateTo || params.view === "all");
  const statuses = await getOrderStatuses();

  if (hasFilters) {
    const page = Math.max(0, parseInt(params.page ?? "0") || 0);
    const filters = {
      orderNumber: params.orderNumber ? parseInt(params.orderNumber) : undefined,
      statusId:    params.statusId,
      clientName:  params.clientName,
      dateFrom:    params.dateFrom,
      dateTo:      params.dateTo,
      sortBy:      params.sortBy,
    };
    const { items: orders, total } = await getOrders(filters, page);

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
          {total} encomenda{total !== 1 ? "s" : ""}
        </p>
        <OrderList orders={orders} />
        <Suspense>
          <PaginationControls page={page} total={total} pageSize={50} />
        </Suspense>
        <Link
          href="/orders/new"
          className="md:hidden fixed right-5 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={26} />
        </Link>
      </div>
    );
  }

  // Default: week view
  const workingDays = getWorkingDays(7);
  const orders = await getOrdersForWeek(workingDays);

  return (
    <div className="px-4 py-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold text-center [text-shadow:0_1px_3px_rgba(0,0,0,0.15)]">Encomendas</h1>
      <Suspense fallback={null}>
        <OrderFilters statuses={statuses} />
      </Suspense>
      <WeekView orders={orders} statuses={statuses} workingDays={workingDays} sortBy={params.sortBy ?? "time-asc"} />
      <Link
        href="/orders/new"
        className="md:hidden fixed right-5 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
