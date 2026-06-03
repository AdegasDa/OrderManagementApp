"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientForm } from "./ClientForm";
import { deleteClient, restoreClient } from "../actions";
import { sourceLabels } from "../schema";
import type { Client } from "@/lib/types";

export function ClientList({ clients: initial }: { clients: Client[] }) {
  const router = useRouter();
  const [clients, setClients] = useState(initial);
  useEffect(() => setClients(initial), [initial]);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const client = clients.find((c) => c.id === id)!;
    setClients((prev) => prev.filter((c) => c.id !== id));
    await deleteClient(id);
    toast.success("Cliente eliminado.", {
      action: {
        label: "Desfazer",
        onClick: async () => {
          await restoreClient(client);
          setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
        },
      },
    });
  }

  const dialogs = (
    <>
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setOpenCreate(false); router.refresh(); }} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editClient} onOpenChange={(o) => !o && setEditClient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {editClient && (
            <ClientForm client={editClient} onSuccess={() => { setEditClient(null); router.refresh(); }} />
          )}
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description="Tem a certeza que quer eliminar este cliente? Esta ação não pode ser desfeita."
      />
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Clientes ({clients.length})</h2>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus size={16} className="mr-2" />Novo Cliente
        </Button>
      </div>

      {dialogs}

      {/* ── Mobile card list ─────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {clients.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">Nenhum cliente registado.</p>
        )}
        {clients.map((c) => (
          <div key={c.id} className="bg-card border rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{c.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{c.phone}</span>
                <Badge variant="secondary" className="text-xs">{sourceLabels[c.source] ?? c.source}</Badge>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditClient(c)}>
                <Pencil size={15} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPendingDelete(c.id)}>
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
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Nenhum cliente registado.
              </TableCell></TableRow>
            )}
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{sourceLabels[c.source] ?? c.source}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditClient(c)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPendingDelete(c.id)}>
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
