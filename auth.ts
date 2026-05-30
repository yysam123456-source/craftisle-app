import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { getUserById } from "@/lib/user"

/**
 * Check if DATABASE_URL is a real database connection string.
 * Rejects placeholder/empty URLs that would cause PrismaAdapter to fail
 * on every _getSession call (NextAuth v5 calls this on every page).
 */
function isValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL
  if (!url || url.length < 20) return false
  // Reject obvious placeholders
  if (url.includes("placeholder") || url.includes("localhost") || url === "") return false
  // Must look like a real connection string: postgresql://user:pass@host/db or similar
  return /^(postgresql|postgres|mysql|mongodb)\+?\:\/\/[^@]+@/.test(url)
}

const hasValidDb = isValidDatabaseUrl()

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || "fallback-secret-for-dev-only",
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
        if (!hasValidDb) {
          // No DB available — return local user (JWT mode)
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
  // Only attach PrismaAdapter when we have a verified working database URL.
  // This prevents NextAuth's _getSession from crashing on every page load.
  ...(hasValidDb ? { adapter: PrismaAdapter(prisma) } : {}),
  callbacks: {
    async signIn({ user, account, profile }) {
      // allowDangerousEmailAccountLinking handles existing users linking to Google OAuth
      if (account?.provider === "google" && user?.email && hasValidDb) {
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
      if (!hasValidDb) return token
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
