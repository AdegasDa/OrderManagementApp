import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/features/orders/actions";
import { getOrderStatuses } from "@/features/statuses/actions";
import { OrderList } from "@/features/orders/components/OrderList";
import { OrderFilters } from "@/features/orders/components/OrderFilters";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{
    orderNumber?: string;
    clientName?: string;
    statusId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
  }>;
}

async function OrdersContent({ searchParams }: PageProps) {
  const sp = await searchParams;
  const [orders, statuses] = await Promise.all([
    getOrders({
      orderNumber: sp.orderNumber ? parseInt(sp.orderNumber) : undefined,
      statusId: sp.statusId?.trim() || undefined,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
      sortBy: sp.sortBy,
    }),
    getOrderStatuses(),
  ]);

  const filtered = sp.clientName
    ? orders.filter((o) =>
        o.client.name.toLowerCase().includes(sp.clientName!.toLowerCase())
      )
    : orders;

  return (
    <>
      <OrderFilters statuses={statuses} />
      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-2">
          {filtered.length} encomenda{filtered.length !== 1 ? "s" : ""}
        </p>
        <OrderList orders={filtered} />
      </div>
    </>
  );
}

export default async function OrdersPage(props: PageProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Encomendas</h1>
        <Link href="/orders/new">
          <Button size="sm"><Plus size={16} className="mr-2" />Nova Encomenda</Button>
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">A carregar…</p>}>
        <OrdersContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
