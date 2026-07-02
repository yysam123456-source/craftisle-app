'use client';

import { useState, useCallback, useRef } from 'react';
import { Loader2, Link2, Download, Play, Music, Image, X, Clipboard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { requestParse, downloadMedia, MediaDownloaderError } from '@/lib/media-downloader';
import { normalizePlatform, getPlatformLabel, supportsAudioExtraction } from '@/lib/media-downloader';
import type { UnifiedParseResult } from '@/lib/media-downloader';

const PLATFORM_NAMES: Record<string, string> = {
  bilibili: 'Bilibili',
  bilibili_tv: 'Bilibili TV',
  douyin: 'Douyin',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  xiaohongshu: 'Xiaohongshu',
  wechat: 'WeChat',
  weibo: 'Weibo',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  reddit: 'Reddit',
  twitch: 'Twitch',
  vimeo: 'Vimeo',
  telegram: 'Telegram',
  threads: 'Threads',
  generic: 'Media',
  unknown: 'Unknown',
};

export default function MediaDownloaderClient() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UnifiedParseResult['data'] | null>(null);
  const lastParseTimeRef = useRef<number>(0);

  const handleParse = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    const now = Date.now();
    if (now - lastParseTimeRef.current < 3000) {
      return; // Rate limit
    }
    lastParseTimeRef.current = now;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await requestParse(url.trim());
      setResult(data);
      toast({
        title: 'Parse successful',
        description: data ? `${getPlatformLabel(data.platform)}: ${data.title || 'Success'}` : 'Parse completed',
      });
    } catch (err) {
      if (err instanceof MediaDownloaderError) {
        setError(err.message);
        toast({
          title: 'Parse failed',
          description: err.message,
          variant: 'destructive',
        });
      } else {
        setError('Failed to parse URL. Please check the link and try again.');
        toast({
          title: 'Parse failed',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    }

    setLoading(false);
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      toast({ title: 'Link pasted from clipboard' });
    } catch {
      toast({
        title: 'Clipboard access denied',
        description: 'Please paste the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadVideo = () => {
    if (!result?.downloadVideoUrl) return;
    const filename = `${result.title || 'video'}.mp4`;
    downloadMedia(result.downloadVideoUrl, filename);
  };

  const handleDownloadAudio = () => {
    if (!result?.downloadAudioUrl) return;
    const filename = `${result.title || 'audio'}.mp3`;
    downloadMedia(result.downloadAudioUrl, filename);
  };

  const handleDownloadCover = () => {
    if (!result?.cover) return;
    downloadMedia(result.cover, `${result.title || 'cover'}.jpg`);
  };

  const handleDownloadImages = (images: string[]) => {
    images.forEach((img, i) => {
      setTimeout(() => {
        downloadMedia(img, `image-${i + 1}.jpg`);
      }, i * 500);
    });
  };

  const isImageNote = result?.noteType === 'image';
  const isVideoNote = result?.noteType === 'video';
  const canExtractAudio = result && supportsAudioExtraction(result.platform);
  const platformName = result ? PLATFORM_NAMES[result.platform] || result.platform : '';

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Paste Media Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`Paste video link here...\n\nSupported platforms:\n• Bilibili: https://bilibili.com/video/BVxxx or b23.tv/xxx\n• Douyin: https://douyin.com/video/xxx\n• TikTok: https://tiktok.com/@user/video/xxx\n• Instagram: https://instagram.com/reel/xxx\n• Xiaohongshu: https://xiaohongshu.com/explore/xxx\n• And more...`}
            className="min-h-[120px] resize-none font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePaste}
              className="flex-1"
              disabled={loading}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Paste
            </Button>
            <Button
              onClick={handleParse}
              disabled={loading || !url.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Parse
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Section */}
      {result && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mb-1">
                  {platformName}
                </span>
                <CardTitle className="text-base line-clamp-2">{result.title || result.desc}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover Image */}
            {result.cover && (
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={result.cover}
                  alt={result.title || 'Cover'}
                  className="w-full max-h-[300px] object-contain bg-black/5"
                />
              </div>
            )}

            {/* Image Notes (Xiaohongshu) */}
            {isImageNote && result.images && result.images.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Images ({result.images.length})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadImages(result.images as string[])}>
                    <Download className="h-4 w-4 mr-1" />
                    Download All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(result.images as string[]).slice(0, 4).map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
                      <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {(result.images as string[]).length > 4 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    +{(result.images as string[]).length - 4} more images
                  </p>
                )}
              </div>
            )}

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-2">
              {result.downloadVideoUrl && (
                <Button onClick={handleDownloadVideo}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Video
                </Button>
              )}

              {result.downloadAudioUrl && (
                <Button variant="secondary" onClick={handleDownloadAudio}>
                  <Music className="h-4 w-4 mr-2" />
                  Download Audio
                </Button>
              )}

              {canExtractAudio && result.downloadVideoUrl && !result.downloadAudioUrl && (
                <Button variant="secondary" disabled>
                  <Music className="h-4 w-4 mr-2" />
                  Audio Extraction Available
                </Button>
              )}

              {result.cover && (
                <Button variant="outline" onClick={handleDownloadCover}>
                  <Image className="h-4 w-4 mr-2" />
                  Download Cover
                </Button>
              )}
            </div>

            {/* Multi-part Videos (Bilibili) */}
            {result.isMultiPart && result.pages && result.pages.length > 1 && (
              <div>
                <h3 className="font-medium mb-2">Parts ({result.pages.length})</h3>
                <div className="space-y-2">
                  {result.pages.slice(0, 5).map((page) => (
                    <div key={page.page} className="flex items-center justify-between rounded-lg border p-2">
                      <div>
                        <span className="font-medium">Part {page.page}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{page.part}</span>
                      </div>
                      {page.downloadVideoUrl && (
                        <Button size="sm" variant="ghost" onClick={() => {
                          downloadMedia(page.downloadVideoUrl!, `${result.title || 'video'}_p${page.page}.mp4`);
                        }}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {result.pages.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      +{result.pages.length - 5} more parts
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Embedded Videos (WeChat Articles) */}
            {result.videos && result.videos.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Videos ({result.videos.length})</h3>
                <div className="space-y-2">
                  {result.videos.slice(0, 3).map((video) => (
                    <div key={video.id} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{video.title}</span>
                      </div>
                      {video.downloadVideoUrl && (
                        <Button size="sm" variant="ghost" onClick={() => {
                          downloadMedia(video.downloadVideoUrl!, `${video.title || 'video'}.mp4`);
                        }}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Platform: {platformName}</p>
              {result.duration && <p>Duration: {Math.floor(result.duration / 60)}:{String(result.duration % 60).padStart(2, '0')}</p>}
              <p>URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline break-all">{result.url}</a></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Platforms Info */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-2">Supported Platforms</h3>
          <div className="flex flex-wrap gap-1">
            {['Bilibili', 'Douyin', 'TikTok', 'Instagram', 'Xiaohongshu', 'WeChat', 'Weibo', 'X (Twitter)', 'YouTube', 'Pinterest', 'Reddit', 'Twitch', 'Vimeo'].map((p) => (
              <span key={p} className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                {p}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
