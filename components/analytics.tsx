"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"

const CONSENT_KEY = "craftisle-cookie-consent"

function hasConsent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(CONSENT_KEY) === "accepted"
}

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    // Check existing consent
    if (hasConsent()) {
      setConsented(true)
      return
    }
    // Listen for consent event from CookieConsent
    function onAccept() {
      setConsented(true)
    }
    window.addEventListener("cookie-consent-accepted", onAccept)
    return () => window.removeEventListener("cookie-consent-accepted", onAccept)
  }, [])

  return (
    <>
      {/* GA4: only load after consent */}
      {gaId && consented && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `,
            }}
          />
        </>
      )}
      <VercelAnalytics />
    </>
  )
}
