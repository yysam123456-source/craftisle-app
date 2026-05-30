'use client';

import { useEffect, useRef } from 'react';

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
  leaderboard:  { width: 728,  height: 90,  className: 'max-w-[728px] h-[90px]' },
  rectangle:    { width: 336,  height: 280, className: 'w-[336px] h-[280px]' },
  halfpage:     { width: 300,  height: 600, className: 'w-[300px] h-[600px]' },
  responsive:   { width: '100%', height: 90, className: 'w-full min-h-[90px]' },
};

export function AdSlot({ slotId, size = 'responsive', className = '', label }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const isDev = process.env.NODE_ENV === 'development';
  const config = sizeConfig[size];

  useEffect(() => {
    if (!adsenseClient || isDev) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense not loaded yet — ok
    }
  }, [adsenseClient, isDev]);

  if (isDev || !adsenseClient) {
    return null; // Hide until AdSense is configured
  }

  return (
    <div ref={adRef} className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseClient}
        data-ad-slot={slotId}
        data-ad-format={size === 'responsive' ? 'auto' : undefined}
        data-full-width-responsive={size === 'responsive' ? 'true' : undefined}
      />
    </div>
  );
}
