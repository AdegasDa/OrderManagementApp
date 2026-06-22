"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  socialHandle: string | null;
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
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === value);

  const updateRect = useCallback(() => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  }, []);

  function handleOpen() {
    updateRect();
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function handleClose(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    function handleScroll() { updateRect(); }
    document.addEventListener("mousedown", handleClose);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updateRect);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open, updateRect]);

  const dropdown = open && rect ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 300),
        zIndex: 9999,
      }}
      className="rounded-md border bg-popover shadow-lg"
    >
      <Command>
        <CommandInput placeholder="Nome, contacto ou rede social…" />
        <CommandList className="max-h-60">
          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
          <CommandGroup>
            {clients.map((c) => (
              <CommandItem
                key={c.id}
                value={c.id}
                keywords={[c.name, c.phone, c.source, SOURCE_LABELS[c.source] ?? "", c.socialHandle ?? ""]}
                onSelect={(val) => {
                  onChange(val === value ? "" : val);
                  setOpen(false);
                }}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {c.phone} · {SOURCE_LABELS[c.source] ?? c.source}
                    {c.socialHandle && <> · @{c.socialHandle}</>}
                  </span>
                </div>
                <Check className={cn("ml-2 h-4 w-4 shrink-0", value === c.id ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        onClick={handleOpen}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected ? selected.name : placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
