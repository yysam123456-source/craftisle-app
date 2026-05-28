import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { getUserById } from "@/lib/user"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  ...(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10
    ? { adapter: PrismaAdapter(prisma) }
    : {}),
  callbacks: {
    async session({ token, session }: any) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub
        if (token.email) session.user.email = token.email
        if (token.role) session.user.role = token.role
        session.user.name = token.name
        session.user.image = token.picture
      }
      return session
    },
    async jwt({ token }: any) {
      if (!token.sub) return token
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length < 10) return token
      try {
        const dbUser = await getUserById(token.sub)
        if (dbUser) {
          token.name = dbUser.name
          token.email = dbUser.email
          token.picture = dbUser.image
          token.role = dbUser.role
        }
      } catch (e) {}
      return token
    },
  },
})
