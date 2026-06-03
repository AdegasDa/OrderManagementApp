"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Calendar, Users, Package, CreditCard, Tag, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const mainItems = [
  { href: "/orders",   label: "Encomendas", icon: ClipboardList },
  { href: "/agenda",   label: "Agenda",     icon: Calendar },
  { href: "/clients",  label: "Clientes",   icon: Users },
  { href: "/products", label: "Produtos",   icon: Package },
];

const moreItems = [
  { href: "/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/statuses", label: "Estados",    icon: Tag },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreItems.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <div
        className={cn(
          "md:hidden fixed left-4 right-4 z-50 bg-card border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ease-out",
          moreOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="p-2">
          {moreItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-[4rem]">
          {mainItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all",
                  active && "bg-primary/10"
                )}>
                  <Icon size={21} className={active ? "text-primary" : "text-muted-foreground"} strokeWidth={active ? 2.2 : 1.8} />
                  <span className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <div className={cn(
              "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all",
              (isMoreActive || moreOpen) && "bg-primary/10"
            )}>
              {moreOpen
                ? <X size={21} className={isMoreActive || moreOpen ? "text-primary" : "text-muted-foreground"} strokeWidth={2.2} />
                : <MoreHorizontal size={21} className={isMoreActive || moreOpen ? "text-primary" : "text-muted-foreground"} strokeWidth={1.8} />
              }
              <span className={cn(
                "text-[10px] font-medium leading-none",
                (isMoreActive || moreOpen) ? "text-primary" : "text-muted-foreground"
              )}>
                Mais
              </span>
            </div>
          </button>
        </div>
      </nav>
    </>
  );
}
