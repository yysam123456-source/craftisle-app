import { ReactNode } from "react";

export default function Head(): ReactNode {
  return (
    <>
      {/* Resource Hints for performance */}
      <link rel="dns-prefetch" href="https://www.google.com" />
      <link rel="preconnect" href="https://www.google.com" crossOrigin="anonymous" />

      {/* Favicon API (Google) */}
      <link rel="dns-prefetch" href="https://www.google.com" />
      <link rel="preconnect" href="https://www.google.com" />

      {/* Open Graph Image */}
      <link rel="dns-prefetch" href="https://craftisle.com" />
      <link rel="preconnect" href="https://craftisle.com" />
    </>
  );
}
