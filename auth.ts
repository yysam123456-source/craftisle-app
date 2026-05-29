import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { getUserById } from "@/lib/user"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        const email = credentials.email as string
        if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length < 10) {
          return { id: "local-" + email, email, name: email.split("@")[0] }
        }
        try {
          let user = await prisma.user.findUnique({ where: { email } })
          if (!user) {
            user = await prisma.user.create({
              data: { email, name: email.split("@")[0] },
            })
          }
          return { id: user.id, email: user.email, name: user.name, image: user.image }
        } catch (e) {
          console.error("Credentials authorize error:", e)
          return { id: "local-" + email, email, name: email.split("@")[0] }
        }
      },
    }),
  ],
  ...(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10
    ? { adapter: PrismaAdapter(prisma) }
    : {}),
  callbacks: {
    async signIn({ user, account, profile }) {
      // allowDangerousEmailAccountLinking handles existing users linking to Google OAuth
      if (account?.provider === "google" && user?.email && !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              },
            })
          }
        } catch (e) {
          console.error("signIn callback error:", e)
        }
      }
      return true
    },
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub
        if (token.email) session.user.email = token.email
        if (token.role) session.user.role = token.role
        session.user.name = token.name
        session.user.image = token.picture
      }
      return session
    },
    async jwt({ token }) {
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
