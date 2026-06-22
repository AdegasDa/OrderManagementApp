"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ProductForm } from "./ProductForm";
import { deleteProduct, restoreProduct } from "../actions";
import type { Product } from "@/lib/types";

export function ProductList({ products: initial }: { products: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  useEffect(() => setProducts(initial), [initial]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const product = products.find((p) => p.id === id)!;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    const result = await deleteProduct(id);
    if ("error" in result) {
      setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
      toast.error(typeof result.error === "string" ? result.error : "Erro ao eliminar produto.");
      return;
    }
    toast.success("Produto eliminado.", {
      action: {
        label: "Desfazer",
        onClick: async () => {
          await restoreProduct(product);
          setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
        },
      },
    });
  }

  const dialogs = (
    <>
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <ProductForm onSuccess={() => { setOpenCreate(false); router.refresh(); }} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
          {editProduct && (
            <ProductForm product={editProduct} onSuccess={() => { setEditProduct(null); router.refresh(); }} />
          )}
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description="Tem a certeza que quer eliminar este produto? Esta ação não pode ser desfeita."
      />
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Produtos ({products.length})</h2>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus size={16} className="mr-2" />Novo Produto
        </Button>
      </div>

      {dialogs}

      {/* ── Mobile card list ─────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">Nenhum produto registado.</p>
        )}
        {products.map((p) => (
          <div key={p.id} className="bg-card border rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                <span className="font-semibold text-sm text-primary shrink-0">{formatCurrency(p.salePrice)}</span>
              </div>
              {p.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct(p)}>
                <Pencil size={15} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPendingDelete(p.id)}>
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
              <TableHead>Descrição</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Nenhum produto registado.
              </TableCell></TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell title={p.description ?? undefined} className="text-muted-foreground text-sm max-w-xs truncate">
                  {p.description ?? "—"}
                </TableCell>
                <TableCell>{formatCurrency(p.salePrice)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditProduct(p)}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPendingDelete(p.id)}>
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
