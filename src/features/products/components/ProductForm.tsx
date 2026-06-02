"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { productSchema, type ProductFormValues } from "../schema";
import { createProduct, updateProduct } from "../actions";
import type { Product } from "@/generated/prisma";

interface Props {
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: Props) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      salePrice: product?.salePrice ?? 0,
    },
  });

  async function onSubmit(values: ProductFormValues) {
    const result = product
      ? await updateProduct(product.id, values)
      : await createProduct(values);
    if (result && "error" in result) {
      toast.error("Erro ao guardar produto.");
    } else {
      toast.success(product ? "Produto atualizado." : "Produto criado.");
      form.reset();
      onSuccess?.();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl><Input placeholder="Nome do produto" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Textarea placeholder="Descrição opcional" rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="salePrice" render={({ field }) => (
          <FormItem>
            <FormLabel>Preço de Venda (€)</FormLabel>
            <FormControl>
                <Input type="number" step="0.01" min="0"
                  value={isNaN(field.value) ? "" : field.value}
                  onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />
              </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "A guardar…" : product ? "Atualizar" : "Criar Produto"}
        </Button>
      </form>
    </Form>
  );
}
