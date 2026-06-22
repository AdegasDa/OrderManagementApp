"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getOrdersByDate } from "@/features/orders/actions";
import type { OrderWithRelations } from "@/lib/types";

type State = { loading: boolean; orders: OrderWithRelations[]; error: boolean };

interface Props {
  selectedDate: string | null;
}

export function DayOrders({ selectedDate }: Props) {
  const [{ loading, orders, error }, setState] = useState<State>({ loading: false, orders: [], error: false });

  useEffect(() => {
    if (!selectedDate) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ loading: true, orders: [], error: false });
    getOrdersByDate(selectedDate)
      .then((data) => { if (alive) setState({ loading: false, orders: data, error: false }); })
      .catch(() => { if (alive) setState({ loading: false, orders: [], error: true }); });
    return () => { alive = false; };
  }, [selectedDate]);

  if (!selectedDate) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">
        Encomendas — {formatDate(selectedDate)}
      </h2>
      {loading && <p className="text-muted-foreground text-sm">A carregar…</p>}
      {error && <p className="text-destructive text-sm">Erro ao carregar encomendas. Tente novamente.</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhuma encomenda neste dia.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders?id=${o.id}`}>
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-sm">#{o.orderNumber}</span>
                  <Badge style={{ backgroundColor: o.status.color, color: "#fff" }} className="text-xs">
                    {o.status.name}
                  </Badge>
                </div>
                <p className="font-medium text-sm">{o.client.name}</p>
                <p className="text-muted-foreground text-sm">{o.orderProducts.map((op) => op.product.name).join(", ")}</p>
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Phone size={12} />
                  <span>{o.client.phone}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
