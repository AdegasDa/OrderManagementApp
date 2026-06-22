"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";

export type ClientOption = {
  id: string;
  name: string;
  phone: string;
  source: string;
};

interface Props {
  clients: ClientOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  STORE:     "Loja",
  INSTAGRAM: "Instagram",
  WHATSAPP:  "WhatsApp",
  FACEBOOK:  "Facebook",
};

export function ClientCombobox({ clients, value, onChange, placeholder = "Selecionar cliente" }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected ? selected.name : placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full min-w-[260px] rounded-md border bg-popover shadow-md">
          <Command
            filter={(itemValue, search) => {
              const c = clients.find((cl) => cl.id === itemValue);
              if (!c) return 0;
              const q = search.toLowerCase();
              const sourceLabel = (SOURCE_LABELS[c.source] ?? c.source).toLowerCase();
              return (
                c.name.toLowerCase().includes(q) ||
                c.phone.toLowerCase().includes(q) ||
                c.source.toLowerCase().includes(q) ||
                sourceLabel.includes(q)
              ) ? 1 : 0;
            }}
          >
            <CommandInput placeholder="Nome, contacto ou rede social…" />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {clients.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={(val) => {
                      onChange(val === value ? "" : val);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {c.phone} · {SOURCE_LABELS[c.source] ?? c.source}
                      </span>
                    </div>
                    <Check className={cn("ml-2 h-4 w-4 shrink-0", value === c.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
