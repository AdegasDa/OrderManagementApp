import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/orders",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw e;
  }
}

type SearchParams = Promise<{ error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">

        {/* Logo / brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <ShoppingBag size={28} className="text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Encomendas</h1>
            <p className="text-sm text-muted-foreground mt-1">Inicie sessão para continuar</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
          <form action={loginAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Utilizador</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="nome de utilizador"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive font-medium">Utilizador ou password incorretos.</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold mt-1">
              Entrar
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
