"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Truck, ClipboardList, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { formatCurrency } from "@/lib/utils";
import { deleteOrder, updateOrderQuickFields } from "../actions";
import type { OrderWithRelations, OrderStatus } from "@/lib/types";

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const d = new Date(dateStr + "T00:00:00");
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === tomorrow.toDateString()) return "Amanhã";
  return date.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
}

function sortDayOrders(orders: OrderWithRelations[], sortBy: string): OrderWithRelations[] {
  if (sortBy === "status") {
    return [...orders].sort((a, b) => a.status.name.localeCompare(b.status.name, "pt"));
  }
  // default: time-asc — nulls last
  return [...orders].sort((a, b) => {
    if (!a.pickupHour && !b.pickupHour) return 0;
    if (!a.pickupHour) return 1;
    if (!b.pickupHour) return -1;
    return a.pickupHour.localeCompare(b.pickupHour);
  });
}

interface Props {
  orders: OrderWithRelations[];
  statuses: OrderStatus[];
  workingDays: string[];
  sortBy?: string;
}

export function WeekView({ orders: initial, statuses, workingDays, sortBy = "time-asc" }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const snapshot = orders;
    setOrders((prev) => prev.filter((o) => o.id !== id));
    const result = await deleteOrder(id);
    if ("error" in result) {
      setOrders(snapshot);
      toast.error("Erro ao eliminar encomenda.");
      return;
    }
    toast.success("Encomenda eliminada.");
    router.refresh();
  }

  async function handleHourChange(id: string, hour: string) {
    const prev = orders.find((o) => o.id === id)?.pickupHour ?? null;
    setOrders((all) => all.map((o) => o.id === id ? { ...o, pickupHour: hour || null } : o));
    const result = await updateOrderQuickFields(id, { pickupHour: hour || null });
    if ("error" in result) {
      setOrders((all) => all.map((o) => o.id === id ? { ...o, pickupHour: prev } : o));
      toast.error("Erro ao atualizar hora.");
    }
  }

  async function handleStatusChange(id: string, statusId: string) {
    const prevOrder = orders.find((o) => o.id === id)!;
    const status = statuses.find((s) => s.id === statusId)!;
    setOrders((all) => all.map((o) => o.id === id ? { ...o, statusId, status } : o));
    const result = await updateOrderQuickFields(id, { statusId });
    if ("error" in result) {
      setOrders((all) => all.map((o) => o.id === id ? { ...o, statusId: prevOrder.statusId, status: prevOrder.status } : o));
      toast.error("Erro ao atualizar estado.");
    }
  }

  const byDay = new Map<string, OrderWithRelations[]>();
  for (const day of workingDays) byDay.set(day, []);
  for (const order of orders) {
    const day = order.orderDate.slice(0, 10);
    if (byDay.has(day)) byDay.get(day)!.push(order);
  }

  const totalOrders = orders.length;

  return (
    <>
      <DeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description="Tem a certeza que quer eliminar esta encomenda? Esta ação não pode ser desfeita."
      />

      {totalOrders === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <ClipboardList size={40} className="text-muted-foreground/30" />
          <div>
            <p className="font-medium">Sem encomendas nos próximos 7 dias</p>
            <p className="text-sm text-muted-foreground mt-1">Crie uma nova encomenda para começar</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {workingDays.map((day) => {
          const dayOrders = sortDayOrders(byDay.get(day) ?? [], sortBy);
          return (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border [box-shadow:0_1px_3px_rgba(0,0,0,0.12)]" />
                <h2 className="text-base font-semibold capitalize [text-shadow:0_1px_3px_rgba(0,0,0,0.15)]">
                  {formatDayLabel(day)}
                  {dayOrders.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-foreground text-xs font-bold shadow-md">{dayOrders.length}</span>
                  )}
                </h2>
                <div className="flex-1 h-px bg-border [box-shadow:0_1px_3px_rgba(0,0,0,0.12)]" />
              </div>

              {dayOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 text-center">Sem encomendas</p>
              ) : (
                <div className="space-y-2">
                  {dayOrders.map((o) => {
                    const remaining = Math.max(0, o.totalValue - o.advanceAmount);
                    const paid = remaining === 0;
                    return (
                      <div key={o.id} className="bg-card border rounded-2xl p-4 space-y-3">

                        {/* Clickable info area */}
                        <div
                          className="cursor-pointer active:opacity-70 transition-opacity"
                          onClick={() => router.push(`/orders?id=${o.id}`)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-muted-foreground">#{o.orderNumber}</span>
                          </div>
                          <p className="font-semibold text-sm leading-tight">{o.client.name}</p>
                          {(o.client.phone || o.client.socialHandle) && (
                            <p className="text-xs text-muted-foreground leading-tight">{o.client.phone || o.client.socialHandle}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <span className="truncate">{o.orderProducts.map((op) => op.product.name).join(", ")}</span>
                            {o.deliveryFee > 0 && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-0.5 shrink-0">
                                  <Truck size={11} />{formatCurrency(o.deliveryFee)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Controls row */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          <Clock size={12} className="shrink-0 text-muted-foreground" />
                          <input
                            type="time"
                            value={o.pickupHour ?? ""}
                            onChange={(e) => handleHourChange(o.id, e.target.value)}
                            className="bg-transparent text-xs text-foreground outline-none cursor-pointer w-[68px]"
                          />
                        </div>

                        {/* Status + price row */}
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={o.statusId}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className="text-xs font-semibold outline-none cursor-pointer rounded-full px-2 py-1 border-0"
                            style={{ backgroundColor: o.status.color + "22", color: o.status.color }}
                          >
                            {statuses.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{formatCurrency(o.totalValue)}</span>
                            <span className={`text-xs font-semibold ${paid ? "text-green-600" : "text-destructive"}`}>
                              {formatCurrency(remaining)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setPendingDelete(o.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
