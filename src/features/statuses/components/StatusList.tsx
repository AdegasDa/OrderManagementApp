"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusSchema, type StatusFormValues } from "../schema";
import { createOrderStatus, updateOrderStatus, deleteOrderStatus, restoreOrderStatus } from "../actions";
import type { OrderStatus } from "@/lib/types";

export function StatusList({ statuses: initial }: { statuses: OrderStatus[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editItem, setEditItem] = useState<OrderStatus | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const createForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema) as never,
    defaultValues: { name: "", color: "#6b7280" },
  });
  const editForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema) as never,
  });

  async function handleCreate(values: StatusFormValues) {
    const result = await createOrderStatus(values);
    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Erro ao criar estado.");
      return;
    }
    toast.success("Estado criado.");
    createForm.reset();
    setOpenCreate(false);
    router.refresh();
  }

  async function handleUpdate(id: string, values: StatusFormValues) {
    const result = await updateOrderStatus(id, values);
    if ("error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Erro ao atualizar.");
      return;
    }
    toast.success("Atualizado.");
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...values } : i)));
    setEditItem(null);
  }

  async function handleDelete(id: string) {
    const item = items.find((i) => i.id === id)!;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteOrderStatus(id);
    toast.success("Eliminado.", {
      action: {
        label: "Desfazer",
        onClick: async () => {
          await restoreOrderStatus(item);
          setItems((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
        },
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Estados de Encomenda</h2>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus size={16} className="mr-2" />Novo
        </Button>
      </div>

      <Dialog open={openCreate} onOpenChange={(o) => { if (!o) createForm.reset({ name: "", color: "#6b7280" }); setOpenCreate(o); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Estado</DialogTitle></DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="st-create-name">Nome</Label>
              <Input id="st-create-name" placeholder="Ex: Em Produção" {...createForm.register("name")} />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-create-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  id="st-create-color"
                  type="color"
                  className="h-9 w-14 cursor-pointer rounded-md border p-1"
                  {...createForm.register("color")}
                />
                <span className="text-sm text-muted-foreground">
                  {createForm.watch("color")}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? "A guardar…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Estado</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((v) => editItem && handleUpdate(editItem.id, v))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="st-edit-name">Nome</Label>
              <Input id="st-edit-name" {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-edit-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  id="st-edit-color"
                  type="color"
                  className="h-9 w-14 cursor-pointer rounded-md border p-1"
                  {...editForm.register("color")}
                />
                <span className="text-sm text-muted-foreground">
                  {editForm.watch("color")}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? "A guardar…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description="Tem a certeza que quer eliminar este estado? Esta ação não pode ser desfeita."
      />

      {/* ── Mobile cards ──────────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">Nenhum estado registado.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="bg-card border rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-sm">{item.name}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { editForm.reset({ name: item.name, color: item.color }); setEditItem(item); }}>
                <Pencil size={15} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPendingDelete(item.id)}>
                <Trash2 size={15} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhum estado registado.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground font-mono">{item.color}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { editForm.reset({ name: item.name, color: item.color }); setEditItem(item); }}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPendingDelete(item.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
