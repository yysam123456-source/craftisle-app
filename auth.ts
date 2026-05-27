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

// Only use PrismaAdapter if DATABASE_URL is available
const adapter =
  process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10
    ? PrismaAdapter(prisma)
    : null;

const config = {
  ...authConfig,
  ...(adapter ? { adapter } : {}),
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
      if (!process.env.DATABASE_URL) return token;
      const dbUser = await getUserById(token.sub);
      if (!dbUser) return token;
      token.name = dbUser.name;
      token.email = dbUser.email;
      token.picture = dbUser.image;
      token.role = dbUser.role;
      return token;
    },
  },
} as any;

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth(config);
