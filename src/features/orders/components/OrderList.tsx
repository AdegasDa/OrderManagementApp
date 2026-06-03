"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Truck, Minus, ClipboardList, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteOrder } from "../actions";
import type { OrderWithRelations } from "@/lib/types";

export function OrderList({ orders: initial }: { orders: OrderWithRelations[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  useEffect(() => setOrders(initial), [initial]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    await deleteOrder(id);
    toast.success("Encomenda eliminada.");
    router.refresh();
  }

  const empty = (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <ClipboardList size={40} className="text-muted-foreground/30" />
      <div>
        <p className="font-medium">Nenhuma encomenda encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou crie uma nova encomenda</p>
      </div>
    </div>
  );

  return (
    <>
      <DeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description="Tem a certeza que quer eliminar esta encomenda? Esta ação não pode ser desfeita."
      />

      {/* ── Mobile card list ───────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {orders.length === 0 && empty}
        {orders.map((o) => {
          const remaining = Math.max(0, o.totalValue - o.advanceAmount);
          const paid = remaining === 0;

          return (
            <div
              key={o.id}
              className="bg-card border rounded-2xl p-4 cursor-pointer active:bg-muted/40 transition-colors"
              onClick={() => router.push(`/orders?id=${o.id}`)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-muted-foreground">#{o.orderNumber}</span>
                  <Badge style={{ backgroundColor: o.status.color, color: "#fff" }} className="text-xs px-2 py-0.5">
                    {o.status.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-semibold text-sm">{formatCurrency(o.totalValue)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setPendingDelete(o.id); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <p className="font-semibold text-sm leading-tight mb-1">{o.client.name}</p>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <span className="truncate">{o.product.name}</span>
                  <span>·</span>
                  <span className="shrink-0">{formatDate(o.orderDate)}</span>
                  {o.deliveryFee > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Truck size={11} />{formatCurrency(o.deliveryFee)}
                      </span>
                    </>
                  )}
                </div>
                {paid
                  ? <Badge variant="secondary" className="text-xs shrink-0">Pago</Badge>
                  : <span className="text-xs font-semibold text-destructive shrink-0">{formatCurrency(remaining)}</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ──────────────────────────────────────────────── */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Nº</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Restante</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>{empty}</TableCell>
              </TableRow>
            )}
            {orders.map((o) => {
              const remaining = Math.max(0, o.totalValue - o.advanceAmount);
              const paid = remaining === 0;
              const hasDelivery = o.deliveryFee > 0;

              return (
                <TableRow
                  key={o.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/orders?id=${o.id}`)}
                >
                  <TableCell className="font-mono font-semibold">#{o.orderNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(o.orderDate)}</TableCell>
                  <TableCell>{o.client.name}</TableCell>
                  <TableCell>{o.product.name}</TableCell>
                  <TableCell>
                    {hasDelivery
                      ? <span className="flex items-center gap-1.5 text-sm"><Truck size={14} className="shrink-0" />{formatCurrency(o.deliveryFee)}</span>
                      : <Minus size={14} className="text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: o.status.color, color: "#fff" }}>{o.status.name}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(o.totalValue)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {paid
                      ? <Badge variant="secondary" className="text-xs">Pago</Badge>
                      : <span className="text-sm font-medium text-destructive">{formatCurrency(remaining)}</span>
                    }
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setPendingDelete(o.id); }}>
                      <Trash2 size={15} className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
