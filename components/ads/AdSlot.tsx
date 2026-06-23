'use client';

import { useEffect, useRef, useState } from 'react';
import { isAdsenseEnabled } from '@/lib/config/ads';

export type AdSlotSize =
  | 'leaderboard'    // 728x90 - banner
  | 'rectangle'      // 336x280 - in-content
  | 'halfpage'       // 300x600 - sidebar
  | 'responsive';    // auto

interface AdSlotProps {
  slotId: string;
  size?: AdSlotSize;
  className?: string;
  label?: string;
}

const sizeConfig: Record<AdSlotSize, { width: number | string; height: number | string; className: string }> = {
  leaderboard:  { width: 728,  height: 90,  className: 'max-w-[728px] w-full h-[90px]' },
  rectangle:    { width: 336,  height: 280, className: 'max-w-[336px] w-full h-auto aspect-[336/280]' },
  halfpage:     { width: 300,  height: 600, className: 'max-w-[300px] w-full h-auto aspect-[300/600]' },
  responsive:   { width: '100%', height: 90, className: 'w-full min-h-[90px]' },
};

const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXX'; // Replace with actual client ID

export function AdSlot({ slotId, size = 'responsive', className = '', label }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const config = sizeConfig[size];

  useEffect(() => {
    isAdsenseEnabled().then(setEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense not loaded yet — ok
    }
  }, [enabled]);

  if (!enabled) {
    return null; // AdSense disabled via centralized config
  }

  return (
    <div ref={adRef} className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={size === 'responsive' ? 'auto' : undefined}
        data-full-width-responsive={size === 'responsive' ? 'true' : undefined}
      />
    </div>
  );
}
