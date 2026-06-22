import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Utilizador" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = process.env.AUTH_USERNAME;
        const password = process.env.AUTH_PASSWORD;

        if (!username || !password) return null;
        if (credentials.username === username && credentials.password === password) {
          return { id: "1", name: String(credentials.username) };
        }
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
