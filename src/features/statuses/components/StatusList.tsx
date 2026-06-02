"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusSchema, type StatusFormValues } from "../schema";
import { createOrderStatus, updateOrderStatus, deleteOrderStatus } from "../actions";
import type { OrderStatus } from "@/generated/prisma";

export function StatusList({ statuses: initial }: { statuses: OrderStatus[] }) {
  const [items, setItems] = useState(initial);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const createForm = useForm<StatusFormValues>({ resolver: zodResolver(statusSchema), defaultValues: { name: "", color: "#6b7280" } });
  const editForm = useForm<StatusFormValues>({ resolver: zodResolver(statusSchema) });

  async function handleCreate(values: StatusFormValues) {
    const result = await createOrderStatus(values);
    if ("error" in result) { toast.error("Erro ao criar."); return; }
    toast.success("Estado criado.");
    createForm.reset();
    setShowCreate(false);
    window.location.reload();
  }

  async function handleUpdate(id: string, values: StatusFormValues) {
    const result = await updateOrderStatus(id, values);
    if ("error" in result) { toast.error("Erro ao atualizar."); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...values } : i)));
    setEditId(null);
    toast.success("Atualizado.");
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar estado?")) return;
    await deleteOrderStatus(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Eliminado.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Estados de Encomenda</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Novo</Button>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cor</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
          <TableBody>
            {showCreate && (
              <TableRow>
                <TableCell><Input placeholder="Nome" {...createForm.register("name")} /></TableCell>
                <TableCell><Input type="color" className="w-16 h-8 p-0 border-0 cursor-pointer" {...createForm.register("color")} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={createForm.handleSubmit(handleCreate)}><Check size={16} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setShowCreate(false)}><X size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.length === 0 && !showCreate && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum estado registado.</TableCell></TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editId === item.id
                    ? <Input {...editForm.register("name")} defaultValue={item.name} />
                    : <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium">{item.name}</span>
                      </div>}
                </TableCell>
                <TableCell>
                  {editId === item.id
                    ? <Input type="color" className="w-16 h-8 p-0 border-0 cursor-pointer" {...editForm.register("color")} defaultValue={item.color} />
                    : <span className="text-sm text-muted-foreground">{item.color}</span>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {editId === item.id ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={editForm.handleSubmit((v) => handleUpdate(item.id, v))}><Check size={16} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X size={16} /></Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => { editForm.reset({ name: item.name, color: item.color }); setEditId(item.id); }}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 size={16} className="text-destructive" /></Button>
                      </>
                    )}
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
