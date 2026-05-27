import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession } from "next-auth";

import { prisma } from "@/lib/db";
import { getUserById } from "@/lib/user";

// More info: https://authjs.dev/getting-started/typescript#module-augmentation
declare module "next-auth" {
  interface Session {
    user: {
      role: string;
    } & DefaultSession["user"];
  }
}

// Safely build the NextAuth config.
// - If DATABASE_URL is missing, do NOT provide an adapter (JWT strategy works without DB).
// - Always set session.strategy = "jwt" so NextAuth never demands an adapter.
const useAdapter =
  process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10;

const config = {
  // Providers from auth.config.ts
  providers: authConfig.providers,

  // Adapter: only when DB is available
  ...(useAdapter ? { adapter: PrismaAdapter(prisma) } : {}),

  // JWT session: works with OR without a DB adapter
  session: { strategy: "jwt" as const },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async session({ token, session }: any) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.email) session.user.email = token.email;
        if (token.role) session.user.role = token.role;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token }: any) {
      if (!token.sub) return token;
      if (!useAdapter) return token;
      const dbUser = await getUserById(token.sub);
      if (!dbUser) return token;
      token.name = dbUser.name;
      token.email = dbUser.email;
      token.picture = dbUser.image;
      token.role = dbUser.role;
      return token;
    },
  },

  // Do NOT spread authConfig here — it can silently override session.strategy
  secret: process.env.AUTH_SECRET,
};

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth(config);
