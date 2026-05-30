import { PrismaClient } from "@prisma/client"
import "server-only"

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL

  // Detect missing or placeholder DATABASE_URL
  if (!url || url.length < 20 || url.includes("placeholder") || url.includes("localhost")) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  DATABASE_URL is not configured or uses a placeholder. " +
        "Database features (auth persistence, user data) will be degraded. " +
        "Set DATABASE_URL in your Vercel environment variables to enable full functionality."
      )
    }
    return new PrismaClient({
      datasourceUrl: "postgresql://placeholder@localhost:5432/placeholder",
    })
  }

  const client = process.env.NODE_ENV === "production"
    ? new PrismaClient()
    : !global.cachedPrisma
      ? (global.cachedPrisma = new PrismaClient())
      : global.cachedPrisma

  return client
}

// Lazy singleton: only created on first access to `prisma`.
// Module loads fine even without DATABASE_URL; error only surfaces on actual DB access.
let _prisma: PrismaClient | undefined

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) {
      _prisma = createPrismaClient()
    }
    return (_prisma as any)[prop]
  },
  set(target, prop, value) {
    if (!_prisma) {
      _prisma = createPrismaClient()
    }
    (_prisma as any)[prop] = value
    return true
  },
})
