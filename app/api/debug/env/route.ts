import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.substring(0, 20)}... (length=${process.env.DATABASE_URL.length})`
        : "(NOT SET)",
      AUTH_SECRET: process.env.AUTH_SECRET ? `(set, length=${process.env.AUTH_SECRET.length})` : "(NOT SET)",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `(set, length=${process.env.GOOGLE_CLIENT_ID.length})` : "(NOT SET)",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `(set, length=${process.env.GOOGLE_CLIENT_SECRET.length})` : "(NOT SET)",
      GHOST_URL: process.env.GHOST_URL || "(NOT SET)",
      GHOST_CONTENT_API_KEY: process.env.GHOST_CONTENT_API_KEY ? `(set, length=${process.env.GHOST_CONTENT_API_KEY.length})` : "(NOT SET)",
      NODE_ENV: process.env.NODE_ENV,
    },
    dbCheck: (() => {
      const url = process.env.DATABASE_URL
      if (!url || url.length < 20) return "INVALID: too short"
      if (url.includes("placeholder")) return "INVALID: placeholder URL"
      if (url.includes("localhost")) return "INVALID: localhost URL"
      if (/^(postgresql|postgres|mysql)\+?\:\/\/[^@]+@/.test(url)) return "VALID"
      return "UNKNOWN_PATTERN"
    })(),
  })
}
