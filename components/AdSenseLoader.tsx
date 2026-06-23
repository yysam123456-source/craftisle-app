'use client';

import { useEffect, useState } from 'react';
import { isAdsenseEnabled } from '@/lib/config/ads';

const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXX'; // Replace with actual client ID

/**
 * Client component that dynamically loads Google AdSense script
 * based on centralized config (craftisle-configs).
 */
export function AdSenseLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    isAdsenseEnabled().then(setEnabled);
  }, []);

  useEffect(() => {
    if (enabled && typeof window !== 'undefined' && !document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [enabled]);

  return null;
}
