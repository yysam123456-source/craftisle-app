/**
 * Media Downloader Platform Utilities
 */

import type { CanonicalPlatform } from './types';

const PLATFORM_ALIASES: Record<string, CanonicalPlatform> = {
  bili: 'bilibili',
  bilibili: 'bilibili',
  bilibili_tv: 'bilibili_tv',
  dailymotion: 'dailymotion',
  douyin: 'douyin',
  kuaishou: 'kuaishou',
  newgrounds: 'newgrounds',
  okru: 'okru',
  pinterest: 'pinterest',
  reddit: 'reddit',
  soundcloud: 'soundcloud',
  streamable: 'streamable',
  twitch: 'twitch',
  tumblr: 'tumblr',
  youtube: 'youtube',
  telegram: 'telegram',
  threads: 'threads',
  vk: 'vk',
  vimeo: 'vimeo',
  wechat: 'wechat',
  niconico: 'niconico',
  nico: 'niconico',
  weibo: 'weibo',
  xiaohongshu: 'xiaohongshu',
  tiktok: 'tiktok',
  instagram: 'instagram',
  ins: 'instagram',
  x: 'x',
  twitter: 'x',
  generic: 'generic',
  unknown: 'unknown',
};

export function normalizePlatform(platform?: string | null): CanonicalPlatform {
  if (!platform) {
    return 'unknown';
  }
  return PLATFORM_ALIASES[platform.trim().toLowerCase()] ?? 'unknown';
}

// Platform detection from URL patterns
const PLATFORM_PATTERNS: { pattern: RegExp; platform: CanonicalPlatform }[] = [
  // Bilibili
  { pattern: /(?:bilibili\.com|b23\.tv)/i, platform: 'bilibili' },
  // Douyin
  { pattern: /(?:douyin\.com|v\.douyin\.com)/i, platform: 'douyin' },
  // TikTok
  { pattern: /tiktok\.com/i, platform: 'tiktok' },
  // Instagram
  { pattern: /instagram\.com/i, platform: 'instagram' },
  // Xiaohongshu
  { pattern: /(?:xiaohongshu\.com|xhslink\.com)/i, platform: 'xiaohongshu' },
  // WeChat (微信公众号)
  { pattern: /(?:weixin\.qq\.com|mp\.weixin)/i, platform: 'wechat' },
  // Weibo
  { pattern: /weibo\.com/i, platform: 'weibo' },
  // X (Twitter)
  { pattern: /(?:x\.com|twitter\.com)/i, platform: 'x' },
  // YouTube
  { pattern: /youtube\.com/i, platform: 'youtube' },
  // Pinterest
  { pattern: /pinterest\./i, platform: 'pinterest' },
  // Reddit
  { pattern: /reddit\./i, platform: 'reddit' },
  // Twitch
  { pattern: /twitch\.tv/i, platform: 'twitch' },
  // Vimeo
  { pattern: /vimeo\.com/i, platform: 'vimeo' },
  // VK
  { pattern: /vk\.com/i, platform: 'vk' },
  // Telegram
  { pattern: /t\.me|telegram\.me/i, platform: 'telegram' },
  // Threads
  { pattern: /threads\.(?:net|instagram\.com)/i, platform: 'threads' },
];

export function detectPlatformFromUrl(url: string): CanonicalPlatform {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return 'unknown';
}

export const PLATFORM_LABELS: Record<CanonicalPlatform, string> = {
  bilibili: 'Bilibili',
  bilibili_tv: 'Bilibili TV',
  dailymotion: 'Dailymotion',
  douyin: 'Douyin',
  kuaishou: 'Kuaishou',
  newgrounds: 'Newgrounds',
  okru: 'OK.ru',
  pinterest: 'Pinterest',
  reddit: 'Reddit',
  soundcloud: 'SoundCloud',
  streamable: 'Streamable',
  twitch: 'Twitch',
  tumblr: 'Tumblr',
  youtube: 'YouTube',
  telegram: 'Telegram',
  threads: 'Threads',
  vk: 'VK',
  vimeo: 'Vimeo',
  wechat: 'WeChat',
  niconico: 'Niconico',
  weibo: 'Weibo',
  xiaohongshu: 'Xiaohongshu',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  x: 'X',
  generic: 'Generic',
  unknown: 'Unknown',
};

export function getPlatformLabel(platform: CanonicalPlatform | string | null | undefined): string {
  const normalized = normalizePlatform(platform);
  return PLATFORM_LABELS[normalized] || 'Unknown';
}

// Platforms that support audio extraction
const AUDIO_EXTRACTION_PLATFORMS = new Set<CanonicalPlatform>([
  'douyin',
  'threads',
  'weibo',
  'xiaohongshu',
  'tiktok',
  'instagram',
  'x',
]);

export function supportsAudioExtraction(platform: string | null | undefined): boolean {
  return AUDIO_EXTRACTION_PLATFORMS.has(normalizePlatform(platform));
}
