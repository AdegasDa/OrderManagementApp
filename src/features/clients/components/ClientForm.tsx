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

function formatPhone(raw: string): string {
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  const local = hasPlus && digits.startsWith("351") ? digits.slice(3) : digits;
  const groups = local.match(/\d{1,3}/g) ?? [];
  const formatted = groups.join(" ");
  return hasPlus ? `+${digits.slice(0, 3)} ${formatted}`.trim() : formatted;
}

export function ClientForm({ client, onSuccess }: Props) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as never,
    defaultValues: {
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      source: (client?.source as ClientFormValues["source"]) ?? "STORE",
      socialHandle: client?.socialHandle ?? "",
    },
  });

  const watchedSource = form.watch("source");
  const showHandle = watchedSource === "INSTAGRAM" || watchedSource === "WHATSAPP";

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
            <FormControl>
              <Input
                placeholder="+351 900 000 000"
                inputMode="tel"
                maxLength={17}
                value={field.value}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
              />
            </FormControl>
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
        {showHandle && (
          <FormField control={form.control} name="socialHandle" render={({ field }) => (
            <FormItem>
              <FormLabel>
                @ {sourceLabels[watchedSource] ?? watchedSource}
              </FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">@</span>
                  <Input
                    className="rounded-l-none"
                    placeholder={`utilizador_${watchedSource.toLowerCase()}`}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value.replace(/^@/, ""))}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "A guardar…" : client ? "Atualizar" : "Criar Cliente"}
        </Button>
      </form>
    </Form>
  );
}
