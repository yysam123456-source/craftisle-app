import type { Metadata } from "next";
import MediaDownloaderClient from "./client";

export const metadata: Metadata = {
  title: "Free Media Downloader — Download Videos from Bilibili, Douyin, TikTok, Instagram",
  description:
    "Free online media downloader. Download videos from Bilibili, Douyin, TikTok, Instagram, Xiaohongshu, WeChat, Weibo and more. No signup required. Supports watermark-free downloads.",
  keywords: [
    "free media downloader",
    "download bilibili video",
    "download douyin video",
    "download tiktok video",
    "download instagram video",
    "download xiaohongshu",
    "download wechat video",
    "download weibo video",
    "video downloader online",
    "free video downloader no signup",
    "bilibili downloader",
    "douyin downloader",
    "tiktok downloader",
    "no watermark video download",
    "social media video downloader",
    "download from multiple platforms",
  ],
  openGraph: {
    title: "Free Media Downloader — Bilibili, Douyin, TikTok, Instagram",
    description:
      "Download videos from 20+ platforms free. Bilibili, Douyin, TikTok, Instagram, Xiaohongshu, WeChat, Weibo and more. No signup, no watermark.",
    type: "website",
    url: "https://craftisle.com/tools/media-downloader",
  },
  alternates: {
    canonical: "https://craftisle.com/tools/media-downloader",
  },
};

export default function MediaDownloaderPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          📥 Free Media Downloader
        </h1>
        <p className="mt-2 text-muted-foreground">
          Download videos from Bilibili, Douyin, TikTok, Instagram, Xiaohongshu, WeChat, Weibo and more. 
          Paste the link and click parse — no signup required.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <MediaDownloaderClient />
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="mb-2 text-xl font-semibold">
            How to Download Videos Free Online
          </h2>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
            <li><strong>Copy the video link</strong> — From Bilibili, Douyin, TikTok, Instagram, or any supported platform.</li>
            <li><strong>Paste the link</strong> — Click the Paste button or paste directly into the input box.</li>
            <li><strong>Click Parse</strong> — The tool will automatically detect the platform and fetch video information.</li>
            <li><strong>Download</strong> — Choose to download video, audio, or images. Click the download button to save.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            Supported Platforms
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Our free media downloader supports the following platforms:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              { name: 'Bilibili', desc: 'Videos, audio, and multi-part content' },
              { name: 'Douyin', desc: 'Videos with no watermark, audio extraction' },
              { name: 'TikTok', desc: 'Videos without watermark' },
              { name: 'Instagram', desc: 'Reels, posts, stories' },
              { name: 'Xiaohongshu', desc: 'Video notes and image notes' },
              { name: 'WeChat', desc: 'Article videos and embedded content' },
              { name: 'Weibo', desc: 'Videos and image posts' },
              { name: 'X (Twitter)', desc: 'Videos from posts' },
              { name: 'YouTube', desc: 'Videos and shorts' },
              { name: 'Pinterest', desc: 'Pins and videos' },
              { name: 'Reddit', desc: 'Videos from posts' },
              { name: 'And more...', desc: '20+ platforms supported' },
            ].map((platform) => (
              <div key={platform.name} className="rounded-lg border p-3">
                <h3 className="font-semibold">{platform.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{platform.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            Key Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">🎯 Multi-Platform Support</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Download from 20+ platforms including Bilibili, Douyin, TikTok, Instagram, Xiaohongshu, and more.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">🚫 No Watermark</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Download videos without platform watermarks where possible.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">🎵 Audio Extraction</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Extract audio from videos for music, podcasts, or voice content.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">📷 Image Downloads</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Download image posts and stories from Instagram, Xiaohongshu, and more.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">⚡ Fast & Easy</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste link, click parse, download. No signup, no registration.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">💯 Free Forever</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Completely free to use. No hidden fees, no premium tier.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-semibold">
                Is this media downloader free to use?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes, completely free. No signup, no registration, no payment required. Just paste the link and download.
              </p>
            </details>
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-semibold">
                Do downloaded videos have watermarks?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                We attempt to download videos without platform watermarks where possible. The availability of watermark-free versions depends on the source platform.
              </p>
            </details>
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-semibold">
                What video formats are supported?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Videos are typically downloaded in MP4 format. Audio is usually in MP3 or M4A format.
              </p>
            </details>
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-semibold">
                Can I download from private or restricted content?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                No. Our downloader only works with publicly accessible content. Private, age-restricted, or region-locked content cannot be downloaded.
              </p>
            </details>
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-semibold">
                Is it legal to download videos?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Downloading videos for personal use is generally acceptable. However, please respect copyright and intellectual property rights. Do not distribute downloaded content without permission.
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
