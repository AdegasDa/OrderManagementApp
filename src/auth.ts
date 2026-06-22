import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Simple in-memory rate limiter — resets on cold start.
// For multi-instance deployments (Vercel Pro+) use Vercel KV instead.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (record && now < record.resetAt) {
    return record.count < MAX_ATTEMPTS;
  }
  return true;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (record && now < record.resetAt) {
    record.count += 1;
  } else {
    failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }
}

function clearFailures(ip: string): void {
  failedAttempts.delete(ip);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Utilizador" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0].trim() ??
          "unknown";

        if (!checkRateLimit(ip)) {
          throw new Error("Demasiadas tentativas. Tente novamente em 15 minutos.");
        }

        const username = process.env.AUTH_USERNAME;
        const password = process.env.AUTH_PASSWORD;

        if (!username || !password) return null;

        if (
          credentials.username === username &&
          credentials.password === password
        ) {
          clearFailures(ip);
          return { id: "1", name: String(credentials.username) };
        }

        recordFailure(ip);
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
