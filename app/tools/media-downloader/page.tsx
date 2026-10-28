import { getOverrideAsync } from "@/lib/seo/page-meta-db";
import type { Metadata } from "next";
import MediaDownloaderClient from "./client";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolJsonLd } from "@/components/tools/ToolJsonLd";
import { toolMeta } from "@/lib/tools";
import { toolUrl } from "@/lib/tool-seo";

/**
 * 🔴 2026-10-15：原先是 `export const metadata = ...`（编译期常量），
 * generateMetadata 读不到任何运行时数据 ⇒ page_meta 覆盖层对本页**永久无效**，
 * 自动调优写进去也不会生效。改成函数式并叠加覆盖层，与 app/tools/[tool] 动态段一致。
 */

/**
 * 🔴 2026-10-15：加 revalidate 让本页进入 ISR。
 * 没有它时本页在构建期就把 metadata 烘死，运行时 page_meta 覆盖层写了也不生效
 * （page_meta_override 表里确实有记录，但页面 HTML 是旧的）。
 * 代价：不再是纯静态，首次请求走一次再生。收益：自动调优对本站真的可用。
 */
export const revalidate = 7200;

export async function generateMetadata(): Promise<Metadata> {
  const meta = toolMeta["media-downloader"];
  const ov = await getOverrideAsync(`/tools/media-downloader`);
  // 🔴 title/description 改读 lib/tools.ts 的 toolMeta（与 app/tools/[tool] 动态段一致）。
  // 本页是静态段、在 Next.js 中优先于 [tool]，此前把文案硬编码在本文件
  // ⇒ 同一工具两个 meta 来源，改 lib/tools.ts 对本页不生效。
  // 原硬编码文案已回填进 toolMeta（措辞与覆盖面不缩水）。
  // keywords 与 openGraph 仍保留本页专属值（与 toolMeta 通用值不同，属有意为之）。
  // 优先级：DB 覆盖层 > toolMeta
  const title =
    ov?.title ?? String(meta?.seoTitle || meta?.title || "Media Downloader");
  const description =
    ov?.description ??
    String(meta?.seoDesc || meta?.desc || "Download videos from popular platforms free.");
  return {
    title,
    description,
    // 保留原有的 keywords / canonical / openGraph 等设置
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
      url: toolUrl("media-downloader"),  
    },  
    alternates: {  
      canonical: toolUrl("media-downloader"),  
    },  
  };
}

export default function MediaDownloaderPage() {
  // 本页是静态段，优先于 app/tools/[tool]/ 动态段 ⇒ 不经过模板，
  // 此前完全没有结构化数据，也没有模板提供的 FAQ/How-to/Use Cases/RelatedTools 区块。
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <ToolJsonLd toolId="media-downloader" />
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

      {/* 补齐模板提供的正文区块：About / How-to / Use Cases / FAQ / Related Tools */}
      <ToolDetailSections toolId="media-downloader" />
    </main>
  );
}
