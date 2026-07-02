/**
 * Media Downloader API Configuration
 */

const DEFAULT_PROD_API_BASE_URL = 'https://downloader-api.bhwa233.com';

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolvePublicApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_MEDIA_DOWNLOADER_API_URL?.trim();
  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }
  return DEFAULT_PROD_API_BASE_URL;
}

function buildApiUrl(pathname: string): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const baseUrl = resolvePublicApiBaseUrl();
  if (!baseUrl) {
    return normalizedPathname;
  }
  return new URL(normalizedPathname, `${baseUrl}/`).toString();
}

export const API_ENDPOINTS = {
  unified: {
    parse: buildApiUrl('/api/parse'),
    download: buildApiUrl('/api/download'),
    play: buildApiUrl('/api/play'),
  },
  feedback: buildApiUrl('/api/feedback'),
} as const;
