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
      {/* Backdrop for "more" drawer */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More menu popup */}
      <div
        className={cn(
          "md:hidden fixed left-4 right-4 z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl overflow-hidden transition-all duration-200 ease-out",
          moreOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        )}
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
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

      {/* Floating island nav */}
      <nav
        className="md:hidden fixed left-4 right-4 z-50 bg-card/90 backdrop-blur-xl border border-border/40 rounded-full shadow-2xl"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex h-16 px-1">
          {mainItems.map(({ href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1"
              >
                <div className={cn(
                  "flex items-center justify-center p-3.5 rounded-full transition-all duration-150",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                </div>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            <div className={cn(
              "flex items-center justify-center p-3.5 rounded-full transition-all duration-150",
              (isMoreActive || moreOpen) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}>
              {moreOpen
                ? <X size={20} strokeWidth={2.2} />
                : <MoreHorizontal size={20} strokeWidth={1.8} />
              }
            </div>
          </button>
        </div>
      </nav>
    </>
  );
}
