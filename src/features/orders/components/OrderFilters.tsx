"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrderStatus } from "@/generated/prisma";

const SORT_OPTIONS = [
  { value: "date-desc",   label: "Data — mais recente" },
  { value: "date-asc",    label: "Data — mais antiga" },
  { value: "number-desc", label: "Nº — decrescente" },
  { value: "number-asc",  label: "Nº — crescente" },
  { value: "total-desc",  label: "Total — maior primeiro" },
  { value: "total-asc",   label: "Total — menor primeiro" },
];

export function OrderFilters({ statuses }: { statuses: OrderStatus[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") ?? "");
  const [clientName,  setClientName]  = useState(searchParams.get("clientName")  ?? "");
  const [statusId,    setStatusId]    = useState(searchParams.get("statusId")    ?? "");
  const [dateFrom,    setDateFrom]    = useState(searchParams.get("dateFrom")    ?? "");
  const [dateTo,      setDateTo]      = useState(searchParams.get("dateTo")      ?? "");
  const [sortBy,      setSortBy]      = useState(searchParams.get("sortBy")      ?? "date-desc");

  function applyFilters(overrideSortBy?: string) {
    const sort = overrideSortBy ?? sortBy;
    const params = new URLSearchParams();
    if (orderNumber) params.set("orderNumber", orderNumber);
    if (clientName)  params.set("clientName",  clientName);
    if (statusId)    params.set("statusId",    statusId);
    if (dateFrom)    params.set("dateFrom",    dateFrom);
    if (dateTo)      params.set("dateTo",      dateTo);
    if (sort && sort !== "date-desc") params.set("sortBy", sort);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setOrderNumber(""); setClientName(""); setStatusId("");
    setDateFrom(""); setDateTo(""); setSortBy("date-desc");
    router.push(pathname);
  }

  function handleSortSelect(value: string) {
    setSortBy(value);
    applyFilters(value);
  }

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-28">
        <label className="text-xs text-muted-foreground mb-1 block">Nº Encomenda</label>
        <Input placeholder="ex: 42" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
      </div>

      <div className="flex-1 min-w-36">
        <label className="text-xs text-muted-foreground mb-1 block">Cliente</label>
        <Input placeholder="Nome do cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      </div>

      <div className="flex-1 min-w-36">
        <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
        <Select
          value={statusId || null}
          onValueChange={(v) => setStatusId(v ?? "")}
          items={statuses.map((s) => ({ value: s.id, label: s.name }))}
        >
          <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-28">
        <label className="text-xs text-muted-foreground mb-1 block">De</label>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
      </div>

      <div className="flex-1 min-w-28">
        <label className="text-xs text-muted-foreground mb-1 block">Até</label>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm">
                Ordem <ChevronDown size={14} className="ml-1 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent className="min-w-52" align="start">
            {SORT_OPTIONS.map((o) => (
              <DropdownMenuItem
                key={o.value}
                onClick={() => handleSortSelect(o.value)}
                className="flex items-center justify-between"
              >
                {o.label}
                {sortBy === o.value && <Check size={14} className="ml-4 opacity-70" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={() => applyFilters()} size="sm">
          <Filter size={16} className="mr-2" />Filtrar
        </Button>
        <Button onClick={clearFilters} size="sm" variant="outline">
          <X size={16} className="mr-2" />Limpar
        </Button>
      </div>
    </div>
  );
}
