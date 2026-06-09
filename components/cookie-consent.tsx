"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Link from "next/link"

const STORAGE_KEY = "craftisle-cookie-consent"

type ConsentValue = "accepted" | "denied" | null

function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "accepted" || stored === "denied") return stored
  return null
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if no prior consent stored
    if (getStoredConsent() === null) {
      // Small delay so the banner doesn't flash on first paint
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
    // Dispatch custom event so analytics can react
    window.dispatchEvent(new CustomEvent("cookie-consent-accepted"))
  }

  function handleDeny() {
    localStorage.setItem(STORAGE_KEY, "denied")
    setVisible(false)
    window.dispatchEvent(new CustomEvent("cookie-consent-denied"))
  }

  function handleClose() {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border bg-card p-4 shadow-lg sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold sm:text-base">
                We use cookies
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                We use cookies and similar technologies to provide essential site
                functionality, understand how you use our site, and serve relevant
                advertisements. By clicking &quot;Accept All&quot;, you consent to our
                use of all cookies. You can change your preferences at any time.
                Read our{" "}
                <Link
                  href="/cookie-policy"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                >
                  Terms of Service
                </Link>
                .
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            <Button size="sm" onClick={handleAccept}>
              Accept All
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeny}>
              Essential Only
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
