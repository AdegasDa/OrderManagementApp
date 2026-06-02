"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Calendar, Users, Package, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/orders", label: "Encomendas", icon: ClipboardList },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/payments", label: "Pagamentos", icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              pathname.startsWith(href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon size={20} />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
