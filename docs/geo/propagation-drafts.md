# Craftisle 传播文案草稿包（P1-3）

> 用途：用户复制到对应平台手动发布。所有文案已根据真实数据（164 工具/16,000 目录/dev.to 报道）撰写。

---

## 1. Hacker News — Show HN 帖

**Title:**
> Show HN: I built 164 free browser-based tools and a 16k-entry open-source directory — no signup, no upload, no paywall

**Body:**
```
Hi HN,

I got tired of "free" tools that:
- require signup to process 3 files
- upload your data to their servers (privacy red flag)
- hit a paywall after 2 uses

So I built Craftisle (craftisle.com): 164 free tools + a curated directory of 16,000+ free & open-source software across 200+ categories.

Everything runs 100% in your browser — Web APIs, Canvas, Web Workers. Your files never leave your device.

Highlights:
• AI background remover & watermark remover (client-side)
• Regex visualizer with real-time graph
• Cron expression generator
• JWT decoder, JSON/SQL/YAML formatters
• Image upscaler, handwriting animation, OCR
• Directory: privacy tools, dev tools, alternatives — updated weekly

Why I built it this way:
Client-side processing is underrated. Most "online tools" are server wrappers. Moving processing to the browser eliminates privacy concerns AND server costs.

Tech: Next.js 16, WebAssembly, Web Crypto API, Prisma + PostgreSQL

It's free for personal & commercial use. No accounts. No ads during use.

Try it: https://craftisle.com
GitHub: https://github.com/yysam123456-source

Feedback welcome — what tools are missing?
```

---

## 2. Product Hunt 发布材料

**Product Name:** Craftisle
**Tagline:** 164 free browser-based tools + a 16,000-entry open-source directory

**First Comment (story):**
```
I built Craftisle because I kept hitting the same wall: every time I needed a quick utility — merge a PDF, format JSON, test a regex — I'd land on a site that either required signup, uploaded my data, or hit a paywall after 2 uses.

So I went the opposite direction: everything runs 100% in your browser. No uploads, no registration, no tracking. Your files never leave your device.

What's inside:
🛠️ 164 tools: AI background/watermark removal, image upscale, OCR, regex visualizer, cron builder, JWT decoder, formatters, generators...
📚 16,000+ free & open-source software directory across 200+ categories, updated weekly
🌍 14 languages supported

Built with Next.js 16 + WebAssembly + Web Crypto. Fully client-side processing for privacy.

Free forever. No accounts. No limits. Try it: https://craftisle.com
```

**Gallery captions (suggest 3-4 screenshots):**
1. "Home — 164 tools at a glance"
2. "AI Background Remover — runs entirely in your browser"
3. "The Directory — 16,000+ free & open-source software"
4. "Regex Visualizer — real-time graph"

---

## 3. dev.to 更新版（在原文章基础上补充）

**Title:**
> From 100 to 164 Tools: What I Learned Building a Privacy-First Free Tools Platform

**Key sections to add (vs original):**
- 164 tools now live (up from 162)
- Directory crossed 16,000 entries
- New AI features: watermark remover, upscaler
- Lesson: "free tools" ≠ "your data is the product"
- Analytics insight: 227 search queries / week in GSC, tools-alternative keywords driving traffic

---

## 4. Reddit 帖（r/selfhosted 或 r/webdev）

**Title:**
> [OC] I built 164 free browser-based tools — everything runs client-side, your files never leave your device

**Body:**
```
I built Craftisle (craftisle.com) — a free online tools platform where every tool runs 100% in the browser.

No uploads. No signup. No paywall. Your images/PDFs/data never hit a server.

Includes:
- AI background remover (on-device)
- Image compressor/upscaler/converter
- Regex visualizer, cron builder, JWT decoder
- 16,000+ free & open-source software directory

Stack: Next.js 16, WebAssembly, Web Crypto API

Free for personal and commercial use. Curious what you think — and what tools you'd add.

https://craftisle.com
```

---

## 5. 中文分发版（掘金 / 知乎）

**标题：**
> 我用 Next.js 做了 164 个免费在线工具 + 16000 条开源软件目录：不注册、不上传、不收费

**正文要点：**
```
每次想快速处理一个文件——合并 PDF、格式化 JSON、测试正则——都会遇到：要么注册、要么数据传到服务器、要么用两次就付费墙。

所以我反着来：所有工具 100% 在浏览器端运行。不上传、不注册、不追踪，文件永不离开设备。

包含：
🛠️ 164 个工具：AI 去背景/去水印、图片放大、OCR、正则可视化、Cron 生成器、JWT 解码、各类格式化器……
📚 16000+ 条免费开源软件目录，覆盖 200+ 分类，每周更新
🌍 支持 14 种语言

技术栈：Next.js 16 + WebAssembly + Web Crypto，纯客户端处理。

永久免费，无账号，无限制。体验：https://craftisle.com
```

---

## 发布节奏建议

| 平台 | 时机 | 前置 |
|------|------|------|
| Hacker News | 部署稳定后首个工作日 | 确认新页面/API 已上线 |
| Product Hunt | HN 后 1-2 天 | 准备 3-4 张截图 |
| dev.to 更新 | PH 同周 | — |
| Reddit | HN 同日稍晚 | 避免撞车 |
| 掘金/知乎 | 周末 | 中文版可复用 |

> 注意：HN/Reddit 有 self-promotion 规则，正文避免过度营销口吻，突出"技术分享 + 求反馈"。
