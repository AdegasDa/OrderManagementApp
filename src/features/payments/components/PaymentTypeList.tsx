"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { paymentTypeSchema, type PaymentTypeFormValues } from "../schema";
import { createPaymentType, updatePaymentType, deletePaymentType } from "../actions";
import type { PaymentType } from "@/generated/prisma";

export function PaymentTypeList({ paymentTypes: initial }: { paymentTypes: PaymentType[] }) {
  const [items, setItems] = useState(initial);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const createForm = useForm<PaymentTypeFormValues>({ resolver: zodResolver(paymentTypeSchema), defaultValues: { name: "" } });
  const editForm = useForm<PaymentTypeFormValues>({ resolver: zodResolver(paymentTypeSchema) });

  async function handleCreate(values: PaymentTypeFormValues) {
    const result = await createPaymentType(values);
    if ("error" in result) { toast.error("Erro ao criar."); return; }
    toast.success("Tipo de pagamento criado.");
    createForm.reset();
    setShowCreate(false);
    window.location.reload();
  }

  async function handleUpdate(id: string, values: PaymentTypeFormValues) {
    const result = await updatePaymentType(id, values);
    if ("error" in result) { toast.error("Erro ao atualizar."); return; }
    toast.success("Atualizado.");
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...values } : i)));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar tipo de pagamento?")) return;
    await deletePaymentType(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Eliminado.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tipos de Pagamento</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Novo</Button>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
          <TableBody>
            {showCreate && (
              <TableRow>
                <TableCell>
                  <Input placeholder="Nome" {...createForm.register("name")} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={createForm.handleSubmit(handleCreate)}><Check size={16} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setShowCreate(false)}><X size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.length === 0 && !showCreate && (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhum tipo registado.</TableCell></TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editId === item.id
                    ? <Input {...editForm.register("name")} defaultValue={item.name} />
                    : <span className="font-medium">{item.name}</span>}
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
                        <Button variant="ghost" size="icon" onClick={() => { editForm.reset({ name: item.name }); setEditId(item.id); }}><Pencil size={16} /></Button>
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
