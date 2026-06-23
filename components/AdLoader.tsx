'use client';

import { useEffect, useState } from 'react';
import { isMonetagEnabled } from '@/lib/config/ads';

/**
 * Client component that dynamically loads Monetag Vignette Banner
 * based on centralized config (craftisle-configs).
 */
export function AdLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    isMonetagEnabled().then(setEnabled);
  }, []);

  useEffect(() => {
    if (enabled && typeof window !== 'undefined' && !document.getElementById('monetag-vignette')) {
      const script = document.createElement('script');
      script.id = 'monetag-vignette';
      script.src = '/monetag-vignette.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [enabled]);

  return null;
}
