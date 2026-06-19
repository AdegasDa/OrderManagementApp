"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X, ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "time-asc",  label: "Hora — crescente" },
  { value: "status",    label: "Estado" },
];

export function OrderFilters({ statuses }: { statuses: OrderStatus[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") ?? "");
  const [clientName,  setClientName]  = useState(searchParams.get("clientName")  ?? "");
  const [statusId,    setStatusId]    = useState(searchParams.get("statusId")    ?? "");
  const [dateFrom,    setDateFrom]    = useState(searchParams.get("dateFrom")    ?? "");
  const [dateTo,      setDateTo]      = useState(searchParams.get("dateTo")      ?? "");
  const [sortBy,      setSortBy]      = useState(searchParams.get("sortBy")      ?? "time-asc");

  const activeCount = [orderNumber, clientName, statusId, dateFrom, dateTo].filter(Boolean).length;

  function applyFilters(overrideSortBy?: string) {
    const sort = overrideSortBy ?? sortBy;
    const params = new URLSearchParams();
    if (orderNumber) params.set("orderNumber", orderNumber);
    if (clientName)  params.set("clientName",  clientName);
    if (statusId)    params.set("statusId",    statusId);
    if (dateFrom)    params.set("dateFrom",    dateFrom);
    if (dateTo)      params.set("dateTo",      dateTo);
    if (sort && sort !== "time-asc") params.set("sortBy", sort);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function clearFilters() {
    setOrderNumber(""); setClientName(""); setStatusId("");
    setDateFrom(""); setDateTo(""); setSortBy("time-asc");
    router.push(pathname);
    setOpen(false);
  }

  function handleSortSelect(value: string) {
    setSortBy(value);
    applyFilters(value);
  }

  const filterFields = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nº Encomenda</label>
          <Input placeholder="ex: 42" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Cliente</label>
          <Input placeholder="Nome" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
        <Select
          value={statusId || null}
          onValueChange={(v) => setStatusId(v ?? "")}
          items={statuses.map((s) => ({ value: s.id, label: s.name }))}
        >
          <SelectTrigger><SelectValue placeholder="Todos os estados" /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">De</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Até</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => applyFilters()} size="sm" className="flex-1">
          <Filter size={15} className="mr-1.5" />Filtrar
        </Button>
        <Button onClick={clearFilters} size="sm" variant="outline">
          <X size={15} className="mr-1.5" />Limpar
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile: toggle button + collapsible panel ─────────────────── */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen((o) => !o)}
            className={cn("flex-1 justify-start gap-2 h-10 text-sm", activeCount > 0 && "border-primary text-primary")}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {activeCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-10 text-sm px-4">
                  Ordem <ChevronDown size={14} className="ml-1 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent className="min-w-52" align="end">
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
        </div>

        {open && (
          <div className="bg-card border rounded-2xl p-4 space-y-3">
            {filterFields}
          </div>
        )}
      </div>

      {/* ── Desktop: inline row ────────────────────────────────────────── */}
      <div className="hidden md:flex flex-wrap gap-2 items-end">
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
    </>
  );
}
