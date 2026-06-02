"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientSchema, type ClientFormValues, sourceLabels } from "../schema";
import { createClient, updateClient } from "../actions";
import type { Client } from "@/lib/types";

interface Props {
  client?: Client;
  onSuccess?: () => void;
}

export function ClientForm({ client, onSuccess }: Props) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as never,
    defaultValues: {
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      source: (client?.source as ClientFormValues["source"]) ?? "STORE",
    },
  });

  async function onSubmit(values: ClientFormValues) {
    const result = client
      ? await updateClient(client.id, values)
      : await createClient(values);
    if ("error" in result) {
      toast.error("Erro ao guardar cliente.");
    } else {
      toast.success(client ? "Cliente atualizado." : "Cliente criado.");
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
            <FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl><Input placeholder="+351 900 000 000" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="source" render={({ field }) => (
          <FormItem>
            <FormLabel>Origem</FormLabel>
            <Select
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? field.value)}
                items={Object.entries(sourceLabels).map(([value, label]) => ({ value, label }))}
              >
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Selecionar origem" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "A guardar…" : client ? "Atualizar" : "Criar Cliente"}
        </Button>
      </form>
    </Form>
  );
}
