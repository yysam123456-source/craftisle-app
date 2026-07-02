/**
 * Media Downloader API Calls
 */

import { API_ENDPOINTS } from './config';
import type { UnifiedParseResult } from './types';

export class MediaDownloaderError extends Error {
  code?: string;
  status?: number;
  requestId?: string;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'MediaDownloaderError';
    this.code = code;
    this.status = status;
  }
}

export async function requestParse(url: string): Promise<UnifiedParseResult['data']> {
  const params = new URLSearchParams({ url });
  const requestUrl = `${API_ENDPOINTS.unified.parse}?${params.toString()}`;

  const response = await fetch(requestUrl, {
    method: 'GET',
    cache: 'no-store',
  });

  let payload: UnifiedParseResult | null = null;
  try {
    payload = await response.json() as UnifiedParseResult;
  } catch {
    throw new MediaDownloaderError('Failed to parse response', 'INVALID_JSON', response.status);
  }

  if (!response.ok || !payload?.success || !payload.data) {
    throw new MediaDownloaderError(
      payload?.error || payload?.message || 'Parse failed',
      payload?.code,
      payload?.status ?? response.status
    );
  }

  return payload.data;
}

export async function downloadMedia(url: string, filename: string): Promise<void> {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}
