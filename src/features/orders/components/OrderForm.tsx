"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Upload, Truck, Loader2 } from "lucide-react";
import { PhotoLightbox } from "./PhotoLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { orderSchema, type OrderFormValues } from "../schema";
import { createOrder, updateOrder, deleteOrderPhoto } from "../actions";
import type { Client, Product, PaymentType, OrderStatus, OrderPhoto } from "@/lib/types";

type FullOrder = {
  id: string; orderNumber: number; orderDate: string; clientId: string; productId: string;
  paymentTypeId: string; statusId: string; totalValue: number; advanceAmount: number;
  deliveryFee: number; notes: string | null; deliveryNotes: string | null; photos: OrderPhoto[];
};

interface Props {
  clients: Client[];
  products: Product[];
  paymentTypes: PaymentType[];
  statuses: OrderStatus[];
  order?: FullOrder;
}

export function OrderForm({ clients, products, paymentTypes, statuses, order }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<OrderPhoto[]>(order?.photos ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as never,
    defaultValues: {
      orderDate:     order ? new Date(order.orderDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      clientId:      order?.clientId ?? "",
      productId:     order?.productId ?? "",
      paymentTypeId: order?.paymentTypeId ?? "",
      statusId:      order?.statusId ?? "",
      totalValue:    order?.totalValue ?? 0,
      advanceAmount: order?.advanceAmount ?? 0,
      deliveryFee:   order?.deliveryFee ?? 0,
      notes:         order?.notes ?? "",
      deliveryNotes: order?.deliveryNotes ?? "",
    },
  });

  // ── Auto-calculate total when product or deliveryFee changes ─────────────────
  const watchedProductId  = useWatch({ control: form.control, name: "productId" });
  const watchedDeliveryFee = useWatch({ control: form.control, name: "deliveryFee" });

  useEffect(() => {
    const product = products.find((p) => p.id === watchedProductId);
    if (!product) return;
    const fee = isNaN(watchedDeliveryFee) ? 0 : watchedDeliveryFee;
    form.setValue("totalValue", +(product.salePrice + fee).toFixed(2), { shouldDirty: true });
  }, [watchedProductId, watchedDeliveryFee, products, form]);

  // ── Computed summary values ──────────────────────────────────────────────────
  const watchedTotal    = useWatch({ control: form.control, name: "totalValue" });
  const watchedAdvance  = useWatch({ control: form.control, name: "advanceAmount" });
  const remaining       = Math.max(0, (watchedTotal ?? 0) - (watchedAdvance ?? 0));
  const selectedProduct = products.find((p) => p.id === watchedProductId);

  // ── File handling ─────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeNewFile(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function removeExistingPhoto(id: string) {
    await deleteOrderPhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function uploadFiles(): Promise<string[]> {
    return Promise.all(
      newFiles.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          })
      )
    );
  }

  async function onSubmit(values: OrderFormValues) {
    const filePaths = await uploadFiles();
    const result = order
      ? await updateOrder(order.id, values, filePaths)
      : await createOrder(values, filePaths);
    if ("error" in result) {
      toast.error("Erro ao guardar encomenda.");
      return;
    }
    toast.success(order ? "Encomenda atualizada." : "Encomenda criada.");
    router.push("/orders");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <FormField control={form.control} name="orderDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Encomenda</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Client */}
          <FormField control={form.control} name="clientId" render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select value={field.value || null} onValueChange={(v) => field.onChange(v ?? field.value)}
                items={clients.map((c) => ({ value: c.id, label: c.name }))}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* Product — shows price hint */}
          <FormField control={form.control} name="productId" render={({ field }) => (
            <FormItem>
              <FormLabel>Produto</FormLabel>
              <Select value={field.value || null} onValueChange={(v) => field.onChange(v ?? field.value)}
                items={products.map((p) => ({ value: p.id, label: p.name }))}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecionar produto" /></SelectTrigger>
                </FormControl>
                <SelectContent className="min-w-64" alignItemWithTrigger={false}>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex flex-col gap-0.5">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground text-xs">{formatCurrency(p.salePrice)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-muted-foreground mt-1">
                  Preço base: <strong>{formatCurrency(selectedProduct.salePrice)}</strong>
                </p>
              )}
              <FormMessage />
            </FormItem>
          )} />

          {/* Payment type */}
          <FormField control={form.control} name="paymentTypeId" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Pagamento</FormLabel>
              <Select value={field.value || null} onValueChange={(v) => field.onChange(v ?? field.value)}
                items={paymentTypes.map((pt) => ({ value: pt.id, label: pt.name }))}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecionar pagamento" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentTypes.map((pt) => <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* Status */}
          <FormField control={form.control} name="statusId" render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select value={field.value || null} onValueChange={(v) => field.onChange(v ?? field.value)}
                items={statuses.map((s) => ({ value: s.id, label: s.name }))}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecionar estado" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* Delivery fee */}
          <FormField control={form.control} name="deliveryFee" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Truck size={14} /> Custo de Entrega (€)
              </FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00"
                  value={isNaN(field.value) ? "" : field.value}
                  onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />
              </FormControl>
              <p className="text-xs text-muted-foreground">Deixar 0 se não houver entrega</p>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Price summary card */}
        {selectedProduct && (
          <Card className="bg-muted/40">
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  Produto: <strong className="text-foreground">{formatCurrency(selectedProduct.salePrice)}</strong>
                </span>
                {(watchedDeliveryFee ?? 0) > 0 && (
                  <span className="text-muted-foreground">
                    Entrega: <strong className="text-foreground">{formatCurrency(watchedDeliveryFee)}</strong>
                  </span>
                )}
                <span className="text-muted-foreground">
                  Total: <strong className="text-foreground">{formatCurrency(watchedTotal ?? 0)}</strong>
                </span>
                {(watchedAdvance ?? 0) > 0 && (
                  <span className="text-muted-foreground">
                    Restante:{" "}
                    <Badge variant={remaining === 0 ? "secondary" : "outline"} className="text-xs">
                      {formatCurrency(remaining)}
                    </Badge>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Total — auto-filled but editable */}
          <FormField control={form.control} name="totalValue" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total (€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0"
                  value={isNaN(field.value) ? "" : field.value}
                  onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />
              </FormControl>
              <p className="text-xs text-muted-foreground">Calculado automaticamente. Pode editar manualmente.</p>
              <FormMessage />
            </FormItem>
          )} />

          {/* Advance */}
          <FormField control={form.control} name="advanceAmount" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Adiantado (€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0"
                  value={isNaN(field.value) ? "" : field.value}
                  onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl><Textarea placeholder="Notas da encomenda…" rows={2} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="deliveryNotes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notas de Entrega</FormLabel>
              <FormControl><Textarea placeholder="Instruções de entrega…" rows={2} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Photos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Fotos</CardTitle></CardHeader>
          <CardContent>
            {/* unified photo list for lightbox */}
            {(() => {
              const allPhotos = [
                ...photos.map((p) => ({ src: p.filePath })),
                ...newPreviews.map((src) => ({ src })),
              ];
              return (
                <>
                  {lightboxIndex !== null && (
                    <PhotoLightbox
                      photos={allPhotos}
                      index={lightboxIndex}
                      onClose={() => setLightboxIndex(null)}
                      onPrev={() => setLightboxIndex((i) => (i! - 1 + allPhotos.length) % allPhotos.length)}
                      onNext={() => setLightboxIndex((i) => (i! + 1) % allPhotos.length)}
                    />
                  )}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {photos.map((p, i) => (
                      <div key={p.id} className="relative w-24 h-24 group">
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(i)}
                          className="w-full h-full rounded-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <img
                            src={p.filePath} alt={`Foto ${i + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(p.id)}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center z-10"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {newPreviews.map((src, i) => (
                      <div key={i} className="relative w-24 h-24 group">
                        <button
                          type="button"
                          onClick={() => !form.formState.isSubmitting && setLightboxIndex(photos.length + i)}
                          className="w-full h-full rounded-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={form.formState.isSubmitting}
                        >
                          <img
                            src={src} alt={`Nova foto ${i + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md" />
                        </button>
                        {form.formState.isSubmitting ? (
                          <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                            <Loader2 size={20} className="text-white animate-spin" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeNewFile(i)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center z-10"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <Upload size={16} />
              <span>Adicionar fotos</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "A guardar…" : order ? "Atualizar Encomenda" : "Criar Encomenda"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </Form>
  );
}
