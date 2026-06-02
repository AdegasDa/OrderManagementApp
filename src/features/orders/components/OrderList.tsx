"use client";

import { useRouter } from "next/navigation";
import { Trash2, Truck, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteOrder } from "../actions";
import type { Client, Product, PaymentType, OrderStatus, OrderPhoto } from "@/generated/prisma";

type OrderWithRelations = {
  id: string; orderNumber: number; orderDate: Date;
  totalValue: number; advanceAmount: number; deliveryFee: number;
  client: Client; product: Product; paymentType: PaymentType;
  status: OrderStatus; photos: OrderPhoto[];
};

export function OrderList({ orders }: { orders: OrderWithRelations[] }) {
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Eliminar encomenda?")) return;
    await deleteOrder(id);
    toast.success("Encomenda eliminada.");
    window.location.reload();
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
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
              <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                Nenhuma encomenda encontrada.
              </TableCell>
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
                onClick={() => router.push(`/orders/${o.id}`)}
              >
                <TableCell className="font-mono font-semibold">#{o.orderNumber}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(o.orderDate)}</TableCell>
                <TableCell>{o.client.name}</TableCell>
                <TableCell>{o.product.name}</TableCell>
                <TableCell>
                  {hasDelivery ? (
                    <span className="flex items-center gap-1.5 text-sm text-foreground">
                      <Truck size={14} className="shrink-0" />
                      {formatCurrency(o.deliveryFee)}
                    </span>
                  ) : (
                    <Minus size={14} className="text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: o.status.color, color: "#fff" }}>
                    {o.status.name}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatCurrency(o.totalValue)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {paid ? (
                    <Badge variant="secondary" className="text-xs">Pago</Badge>
                  ) : (
                    <span className="text-sm font-medium text-destructive">
                      {formatCurrency(remaining)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(e, o.id)}
                  >
                    <Trash2 size={15} className="text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
