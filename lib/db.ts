import { PrismaClient } from "@prisma/client"
import "server-only"

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a client that throws on every operation with a clear message.
    // This allows the app to start without crashing at module load time.
    // Actual DB calls will fail with a descriptive error.
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  DATABASE_URL is not set. Database features will be unavailable."
      )
    }
    // Still create a real client — Prisma will throw at query time if URL is invalid.
    // This is better than a proxy because it preserves the full type surface.
    return new PrismaClient({
      datasourceUrl: "postgresql://placeholder@localhost:5432/placeholder",
      // log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
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
