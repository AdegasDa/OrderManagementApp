"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList, Calendar, Users, Package, CreditCard, Tag, Sun, Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/orders", label: "Encomendas", icon: ClipboardList },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/statuses", label: "Estados", icon: Tag },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r bg-card h-screen sticky top-0">
      <div className="p-4 border-b">
        <h1 className="font-semibold text-lg tracking-tight">Encomendas</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        </Button>
      </div>
    </aside>
  );
}
