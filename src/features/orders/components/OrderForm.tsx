"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Upload, Truck, Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import NextImage from "next/image";
import { PhotoLightbox } from "./PhotoLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientCombobox, type ClientOption } from "@/components/ui/client-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { formatCurrency } from "@/lib/utils";
import { orderSchema, type OrderFormValues } from "../schema";
import { DecimalInput } from "@/components/ui/decimal-input";
import { createOrder, updateOrder, deleteOrderPhoto } from "../actions";
import type { Product, PaymentType, OrderStatus, OrderPhoto, OrderProduct } from "@/lib/types";

type FullOrder = {
  id: string; orderNumber: number; orderDate: string; clientId: string;
  paymentTypeId: string; statusId: string; totalValue: number; advanceAmount: number;
  deliveryFee: number; notes: string | null; deliveryNotes: string | null;
  photos: OrderPhoto[]; orderProducts: OrderProduct[];
};

interface Props {
  clients: ClientOption[];
  products: Pick<Product, "id" | "name" | "salePrice">[];
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
      products:      order?.orderProducts.map((op) => ({ productId: op.productId, quantity: op.quantity, unitPrice: op.product?.salePrice ?? 0 })) ?? [{ productId: "", quantity: 1, unitPrice: 0 }],
      paymentTypeId: order?.paymentTypeId ?? "",
      statusId:      order?.statusId ?? "",
      totalValue:    order?.totalValue ?? 0,
      advanceAmount: order?.advanceAmount ?? 0,
      deliveryFee:   order?.deliveryFee ?? 0,
      notes:         order?.notes ?? "",
      deliveryNotes: order?.deliveryNotes ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "products" });

  // ── Auto-calculate total ─────────────────────────────────────────────────────
  const watchedProducts  = useWatch({ control: form.control, name: "products" });
  const watchedDeliveryFee = useWatch({ control: form.control, name: "deliveryFee" });

  useEffect(() => {
    const productsTotal = watchedProducts.reduce((sum, line) => {
      const qty   = isNaN(line.quantity)  ? 0 : line.quantity;
      const price = isNaN(line.unitPrice) ? 0 : line.unitPrice;
      return sum + price * qty;
    }, 0);
    const fee = isNaN(watchedDeliveryFee) ? 0 : watchedDeliveryFee;
    form.setValue("totalValue", +(productsTotal + fee).toFixed(2), { shouldDirty: true });
  }, [watchedProducts, watchedDeliveryFee, products, form]);

  const watchedTotal   = useWatch({ control: form.control, name: "totalValue" });
  const watchedAdvance = useWatch({ control: form.control, name: "advanceAmount" });
  const remaining      = Math.max(0, (watchedTotal ?? 0) - (watchedAdvance ?? 0));

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

  const [pendingPhotoDelete, setPendingPhotoDelete] = useState<string | null>(null);

  async function confirmPhotoDelete(id: string) {
    await deleteOrderPhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setPendingPhotoDelete(null);
  }

  async function uploadFiles(): Promise<string[]> {
    if (newFiles.length === 0) return [];
    const formData = new FormData();
    newFiles.forEach((f) => formData.append("file", f));
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? "Upload falhou");
    }
    const { urls } = await res.json() as { urls: string[] };
    return urls;
  }

  async function onSubmit(values: OrderFormValues) {
    let filePaths: string[] = [];
    try {
      filePaths = await uploadFiles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao fazer upload das fotos: ${msg}`);
      return;
    }
    const result = order
      ? await updateOrder(order.id, values, filePaths)
      : await createOrder(values, filePaths);
    if ("error" in result) {
      // Clean up blobs that were uploaded but whose DB write failed (F-02)
      if (filePaths.length > 0) {
        fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: filePaths }),
        }).catch(() => {});
      }
      toast.error("Erro ao guardar encomenda.");
      return;
    }
    toast.success(order ? "Encomenda atualizada." : "Encomenda criada.");
    router.push("/orders");
  }

  function photoSrc(filePath: string) {
    if (filePath.startsWith("data:") || filePath.startsWith("blob:")) return filePath;
    if (filePath.startsWith("https://")) return `/api/photo?url=${encodeURIComponent(filePath)}`;
    return filePath;
  }

  const allPhotos = [
    ...photos.map((p) => ({ src: photoSrc(p.filePath) })),
    ...newPreviews.map((src) => ({ src })),
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-6">

        {/* ── Informações Gerais ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="orderDate" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="clientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <ClientCombobox
                    clients={clients}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-[5fr_4fr] gap-4 items-start">
              <FormField control={form.control} name="paymentTypeId" render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Tipo de Pagamento</FormLabel>
                  <Select value={field.value || null} onValueChange={(v) => field.onChange(v ?? field.value)}
                    items={paymentTypes.map((pt) => ({ value: pt.id, label: pt.name }))}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Pagamento" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentTypes.map((pt) => <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="statusId" render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value || null} onValueChange={(v) => field.onChange(v ?? field.value)}
                    items={statuses.map((s) => ({ value: s.id, label: s.name }))}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar estado" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Produtos ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => {
              const qty       = isNaN(watchedProducts[index]?.quantity)  ? 0 : (watchedProducts[index]?.quantity  ?? 0);
              const unitPrice = isNaN(watchedProducts[index]?.unitPrice) ? 0 : (watchedProducts[index]?.unitPrice ?? 0);
              const lineTotal = unitPrice * qty;

              return (
                <div key={field.id} className="rounded-xl border bg-card shadow-sm overflow-hidden flex">
                  {/* Left: product + qty/price */}
                  <div className="flex-1 min-w-0 space-y-2 p-3">
                    <FormField control={form.control} name={`products.${index}.productId`} render={({ field: f }) => (
                      <FormItem className="min-w-0">
                        {index === 0 && <FormLabel>Produto</FormLabel>}
                        <Select value={f.value || null} onValueChange={(v) => {
                          f.onChange(v ?? f.value);
                          const p = products.find((p) => p.id === v);
                          if (p) form.setValue(`products.${index}.unitPrice`, p.salePrice, { shouldDirty: true });
                        }}
                          items={products.map((p) => ({ value: p.id, label: p.name }))}>
                          <FormControl>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar produto" /></SelectTrigger>
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
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex gap-3 items-end">
                      <FormField control={form.control} name={`products.${index}.quantity`} render={({ field: f }) => (
                        <FormItem className="w-20">
                          <FormLabel className="text-xs text-muted-foreground">Qtd.</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" step="1"
                              value={isNaN(f.value) ? "" : f.value}
                              onChange={(e) => f.onChange(isNaN(e.target.valueAsNumber) ? 1 : e.target.valueAsNumber)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`products.${index}.unitPrice`} render={({ field: f }) => (
                        <FormItem className="w-24">
                          <FormLabel className="text-xs text-muted-foreground">Preço (€)</FormLabel>
                          <FormControl>
                            <DecimalInput placeholder="0.00" value={f.value} onChange={f.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {lineTotal > 0 && (
                        <span className="text-sm font-semibold text-foreground pb-2 ml-auto">
                          {formatCurrency(lineTotal)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: full-height red trash strip */}
                  <button
                    type="button"
                    className="w-8 shrink-0 bg-red-500 text-white hover:bg-red-400 flex items-center justify-center transition-colors disabled:opacity-40 [box-shadow:0_0_8px_2px_rgba(239,68,68,0.7)]"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-1"
              onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus size={14} /> Adicionar produto
            </Button>

            {form.formState.errors.products?.root && (
              <p className="text-sm text-destructive">{form.formState.errors.products.root.message}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Pagamento & Entrega ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pagamento &amp; Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="deliveryFee" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Truck size={13} className="text-muted-foreground" /> Custo de Entrega (€)
                </FormLabel>
                <FormControl>
                  <DecimalInput placeholder="0.00" value={field.value} onChange={field.onChange} />
                </FormControl>
                <p className="text-xs text-muted-foreground">Deixar 0 se não houver entrega</p>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            <div className="grid grid-cols-2 gap-8 items-start">
              <FormField control={form.control} name="totalValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (€)</FormLabel>
                  <FormControl>
                    <DecimalInput placeholder="0.00" value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Calculado automaticamente.</p>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="advanceAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Adiantado (€)</FormLabel>
                  <FormControl>
                    <DecimalInput placeholder="0.00" value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Summary strip */}
            {(watchedTotal ?? 0) > 0 && (
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  Total: <strong className="text-foreground">{formatCurrency(watchedTotal ?? 0)}</strong>
                </span>
                {(watchedDeliveryFee ?? 0) > 0 && (
                  <span className="text-muted-foreground">
                    Entrega: <strong className="text-foreground">{formatCurrency(watchedDeliveryFee)}</strong>
                  </span>
                )}
                {(watchedAdvance ?? 0) > 0 && (
                  <span className="text-muted-foreground">
                    Restante:{" "}
                    <Badge variant={remaining === 0 ? "secondary" : "outline"} className="text-xs">
                      {formatCurrency(remaining)}
                    </Badge>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Notas ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas da Encomenda</FormLabel>
                <FormControl><Textarea placeholder="Observações, detalhes do pedido…" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="deliveryNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas de Entrega</FormLabel>
                <FormControl><Textarea placeholder="Instruções de entrega, morada…" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── Fotos ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Fotos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeleteDialog
              open={!!pendingPhotoDelete}
              onOpenChange={(o) => !o && setPendingPhotoDelete(null)}
              onConfirm={() => { if (pendingPhotoDelete) confirmPhotoDelete(pendingPhotoDelete); }}
              description="Tem a certeza que quer eliminar esta foto? Esta ação não pode ser desfeita."
            />
            {lightboxIndex !== null && (
              <PhotoLightbox
                photos={allPhotos}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onPrev={() => setLightboxIndex((i) => (i! - 1 + allPhotos.length) % allPhotos.length)}
                onNext={() => setLightboxIndex((i) => (i! + 1) % allPhotos.length)}
              />
            )}
            {allPhotos.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {photos.map((p, i) => (
                  <div key={p.id} className="relative w-24 h-24 group">
                    <button type="button" onClick={() => setLightboxIndex(i)}
                      className="w-full h-full rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <NextImage src={photoSrc(p.filePath)} alt={`Foto ${i + 1}`} fill
                        className="object-cover transition-transform group-hover:scale-105" />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                    </button>
                    <button type="button" onClick={() => setPendingPhotoDelete(p.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center z-10 shadow">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24 group">
                    <button type="button"
                      onClick={() => !form.formState.isSubmitting && setLightboxIndex(photos.length + i)}
                      className="w-full h-full rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={form.formState.isSubmitting}>
                      {/* blob: URLs are local-only previews — next/image can't optimize them */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Nova foto ${i + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                    </button>
                    {form.formState.isSubmitting ? (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <Loader2 size={20} className="text-white animate-spin" />
                      </div>
                    ) : (
                      <button type="button" onClick={() => removeNewFile(i)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center z-10 shadow">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <label className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer rounded-lg border border-dashed border-border px-4 py-3 w-full justify-center hover:bg-muted/50 hover:text-foreground transition-colors">
              <Upload size={16} />
              <span>Adicionar fotos</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </CardContent>
        </Card>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 pb-6">
          <Button type="button" variant="outline" size="lg" className="sm:w-auto w-full h-12 text-base px-6" onClick={() => {
            if (form.formState.isDirty && !confirm("Tem alterações não guardadas. Deseja sair?")) return;
            router.push("/orders");
          }}>
            <ArrowLeft size={18} /> Cancelar
          </Button>
          <Button type="submit" size="lg" className="sm:w-auto w-full h-12 text-base px-6" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> A guardar…</>
            ) : order ? "Atualizar Encomenda" : "Criar Encomenda"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
