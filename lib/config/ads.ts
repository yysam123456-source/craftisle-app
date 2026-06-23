/**
 * Ad configuration module for craftisle-app
 *
 * Supports both Monetag (vignette banner) and AdSense (inline ads).
 * Centralized control via craftisle-configs repo.
 */

// Hardcoded fallback (used when remote config is unavailable)
export const ADS_ENABLED = true;

// Monetag config
export const MONETAG_ZONE_ID = '11117037';
export const MONETAG_SCRIPT_URL = '/monetag-vignette.js';

// AdSense config (inline ads)
export const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXX'; // placeholder, controlled by remote config

// Set to true to fetch ad config from central URL
export const USE_REMOTE_CONFIG = true;

// Central config URL - all projects read from this same file
export const ADS_REMOTE_URL =
  'https://raw.githubusercontent.com/yysam123456-source/craftisle-configs/main/configs/ads-config.json';

const REMOTE_CACHE_TTL = 300_000; // 5 minutes

let remoteCache: { monetag: boolean; adsense: boolean; fetchedAt: number } | null = null;

export interface AdsRemoteConfig {
  enabled: boolean;
  monetag?: boolean;
  adsense?: boolean;
  updatedAt: string;
  note?: string;
}

/**
 * Check if Monetag ads are enabled (vignette banner)
 */
export async function isMonetagEnabled(): Promise<boolean> {
  if (typeof window === 'undefined') return ADS_ENABLED;

  const override = localStorage.getItem('ads_override');
  if (override === 'true') return true;
  if (override === 'false') return false;

  if (USE_REMOTE_CONFIG && ADS_REMOTE_URL) {
    const cached = remoteCache;
    const now = Date.now();
    if (cached && now - cached.fetchedAt < REMOTE_CACHE_TTL) {
      return cached.monetag;
    }

    try {
      const res = await fetch(`${ADS_REMOTE_URL}?_t=${now}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const config: AdsRemoteConfig = await res.json();
        const enabled = config.enabled && config.monetag !== false;
        if (remoteCache) {
          remoteCache.monetag = enabled;
          remoteCache.fetchedAt = now;
        } else {
          remoteCache = { monetag: enabled, adsense: config.enabled && config.adsense !== false, fetchedAt: now };
        }
        return enabled;
      }
    } catch {
      // fetch failed - fall through to hardcoded fallback
    }
  }

  return ADS_ENABLED;
}

/**
 * Check if AdSense ads are enabled (inline ads)
 */
export async function isAdsenseEnabled(): Promise<boolean> {
  if (typeof window === 'undefined') return ADS_ENABLED;

  const override = localStorage.getItem('ads_override');
  if (override === 'true') return true;
  if (override === 'false') return false;

  if (USE_REMOTE_CONFIG && ADS_REMOTE_URL) {
    const cached = remoteCache;
    const now = Date.now();
    if (cached && now - cached.fetchedAt < REMOTE_CACHE_TTL) {
      return cached.adsense;
    }

    try {
      const res = await fetch(`${ADS_REMOTE_URL}?_t=${now}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const config: AdsRemoteConfig = await res.json();
        const enabled = config.enabled && config.adsense !== false;
        if (remoteCache) {
          remoteCache.adsense = enabled;
          remoteCache.fetchedAt = now;
        } else {
          remoteCache = { monetag: config.enabled && config.monetag !== false, adsense: enabled, fetchedAt: now };
        }
        return enabled;
      }
    } catch {
      // fetch failed - fall through to hardcoded fallback
    }
  }

  return ADS_ENABLED;
}

/**
 * Synchronous version - returns hardcoded value immediately.
 * Use in places where you can't await (but still wrap in useEffect).
 */
export function isMonetagEnabledSync(): boolean {
  if (typeof window === 'undefined') return ADS_ENABLED;
  const override = localStorage.getItem('ads_override');
  if (override === 'true') return true;
  if (override === 'false') return false;
  return ADS_ENABLED;
}

export function isAdsenseEnabledSync(): boolean {
  if (typeof window === 'undefined') return ADS_ENABLED;
  const override = localStorage.getItem('ads_override');
  if (override === 'true') return true;
  if (override === 'false') return false;
  return ADS_ENABLED;
}
