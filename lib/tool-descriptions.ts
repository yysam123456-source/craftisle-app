/**
 * tool-descriptions.ts
 * 工具描述增强系统：字典 + 智能 fallback + 垃圾检测
 *
 * 问题根因：FMHY 是 wiki 列表格式，"description" 字段实际是定价/访问方式的简记，
 * 而非产品功能描述。
 *
 * 三层策略：
 *   1. 精选字典（覆盖热门/首页展示的工具）
 *   2. 分类模板 fallback（根据分类+名称生成合理描述）
 *   3. 垃圾检测（隐藏无意义内容）
 */

// ── Type ────────────────────────────────────────────

export interface ToolDescriptionEntry {
  name: string;
  description: string;
  /** 匹配模式：exact=精确匹配, contains=名称包含 */
  match?: "exact" | "contains";
}

// ── 1. 精选描述字典（扁平数组）──────────────────────
// 覆盖首页 Featured、Trending、高 Star 工具

const TOOL_DESCRIPTIONS: ToolDescriptionEntry[] = [
  // ── AI / LLM ──────────────────────────────────────
  { name: "ChatGPT", description: "OpenAI flagship chatbot with GPT-5.x models, advanced reasoning & multimodal input", match: "exact" },
  { name: "Claude", description: "Anthropic's AI assistant known for long context, careful analysis & coding excellence", match: "exact" },
  { name: "Gemini", description: "Google's multimodal AI with deep Google ecosystem integration and generous free tier", match: "exact" },
  { name: "DeepSeek", description: "Chinese open-source LLM with strong coding & reasoning capabilities, cost-efficient API", match: "exact" },
  { name: "Ollama", description: "Run LLMs locally on your machine — simple CLI for downloading & running open-source models", match: "exact" },
  { name: "LM Studio", description: "Beautiful desktop app to discover, download & run local LLMs with a ChatGPT-like UI", match: "exact" },
  { name: "GPT4All", description: "Run quantized LLMs locally on consumer hardware — no GPU required for many models", match: "exact" },
  { name: "HuggingFace", description: "The hub of open-source AI — models, datasets, spaces, and ML infrastructure", match: "contains" },
  { name: "vLLM", description: "High-throughput LLM serving engine with PagedAttention for production deployment", match: "exact" },
  { name: "llama.cpp", description: "C++ port of LLaMA inference — enables running large models on consumer hardware", match: "exact" },
  { name: "LocalAI", description: "Self-hosted OpenAI-compatible API — drop-in replacement for running local models", match: "exact" },
  { name: "Jan", description: "Open-source ChatGPT alternative that runs 100% offline on your computer", match: "exact" },
  { name: "Petals", description: "Federated learning for LLMs — collaboratively run large models across consumer GPUs", match: "exact" },
  { name: "Google AI Studio", description: "Google's free web IDE for prototyping with Gemini models — API key included", match: "exact" },
  { name: "Meta AI", description: "Meta's free AI chatbot powered by LLaMA models — no sign-up required", match: "exact" },
  { name: "Groq", description: "Ultra-fast LLM inference cloud — fastest API for real-time AI applications", match: "exact" },
  { name: "Together AI", description: "Cloud platform for fast, affordable AI inference with enterprise-grade reliability", match: "exact" },
  { name: "Fireworks AI", description: "Production AI inference platform — speed-optimized for real-time use cases", match: "exact" },
  { name: "Cerebras", description: "World's fastest LLM inference using purpose-built wafer-scale AI chips", match: "exact" },
  { name: "Mistral AI", description: "European open-source AI company — powerful compact models with strong performance", match: "exact" },
  { name: "Perplexity", description: "AI-powered search engine with cited answers — like ChatGPT meets Google", match: "exact" },
  { name: "You.com", description: "Privacy-first AI search engine with multiple model choices and live web access", match: "exact" },
  { name: "Phind", description: "AI search engine built for developers — finds code answers with sources", match: "exact" },
  { name: "Exa", description: "Programmatic web search API built for AI agents — clean, structured results", match: "exact" },
  { name: "Brave Search API", description: "Privacy-focused search API with web, news, and image search endpoints", match: "exact" },
  { name: "Tavily", description: "Search API optimized for AI agents and RAG applications", match: "exact" },

  // Image/Video Gen
  { name: "Stable Diffusion", description: "Open-source image generation model — run locally or via many web UIs", match: "contains" },
  { name: "ComfyUI", description: "Node-based GUI for Stable Diffusion — powerful workflow automation for image gen", match: "exact" },
  { name: "Fooocus", description: "Simplified Stable Diffusion UI — Midjourney-quality images with minimal config", match: "exact" },
  { name: "Automatic1111", description: "Most popular web UI for Stable Diffusion — extensive plugin ecosystem", match: "contains" },
  { name: "Flux", description: "Black Forest Labs' state-of-the-art image generation model — stunning quality", match: "exact" },
  { name: "Midjourney", description: "Premium AI art generator known for artistic style and consistency via Discord", match: "exact" },
  { name: "DALL-E", description: "OpenAI's image generation model integrated into ChatGPT — versatile and easy", match: "exact" },
  { name: "Ideogram", description: "AI image generator with best-in-class text rendering in images", match: "exact" },
  { name: "Leonardo.ai", description: "AI image generation platform focused on game assets and production art", match: "exact" },
  { name: "Playground AI", description: "Free online AI image editor and generator with mixed canvas features", match: "exact" },
  { name: "Kling", description: "Kuaishou's AI video generator — realistic video from text/image prompts", match: "exact" },
  { name: "Runway", description: "Professional AI video generation and editing suite — Gen-3 model", match: "exact" },
  { name: "Pika Labs", description: "AI video creation platform — text/image to video with motion control", match: "exact" },
  { name: "Luma Dream Machine", description: "Free high-quality AI video generator from the makers of Luma field", match: "exact" },
  { name: "HunyuanVideo", description: "Tencent's open-source video generation model with impressive realism", match: "exact" },
  { name: "CogVideo", description: "Tsinghua/Tencent's open-source text-to-video model — self-hosted capable", match: "exact" },
  { name: "Wan2.1", description: "Alibaba's open-source video generation framework supporting multiple resolutions", match: "contains" },
  { name: "Sora", description: "OpenAI's text-to-video model — cinematic quality video generation", match: "exact" },
  { name: "Recraft", description: "AI vector art and illustration tool — perfect for designers needing scalable graphics", match: "exact" },
  { name: "Magnific AI", description: "AI image upscaling and enhancement — add detail and resolution magically", match: "exact" },
  { name: "Upscayl", description: "Free open-source AI image upscaler — runs locally, no limits", match: "exact" },
  { name: "Real-ESRGAN", description: "Advanced image super-resolution toolbox — restore and enhance old photos", match: "contains" },
  { name: "Replicate", description: "Cloud platform for running open-source AI models via simple API calls", match: "exact" },
  { name: "Fal.ai", description: "Fast inference API for image, video, and audio AI models", match: "exact" },
  { name: "Segmind", description: "Fast and affordable API for Stable Diffusion and other image models", match: "exact" },
  { name: "Dreamina", description: "ByteDance's AI creative tool for image generation and editing", match: "exact" },
  { name: "PixVerse", description: "Free AI video generation platform with daily credit allowance", match: "exact" },
  { name: "Genmo", description: "AI video generation with Mochi model — natural motion and physics", match: "exact" },
  { name: "Kolors", description: "Kuaishou's text-to-image model with excellent prompt adherence", match: "exact" },
  { name: "IC-Light", description: "Open-source AI tool for realistic object relighting in images", match: "exact" },
  { name: "ICPaint", description: "AI-powered inpainting and outpainting tool for image editing", match: "exact" },
  { name: "LivePortrait", description: "Animate still photos with expressive head movement — open source", match: "exact" },
  { name: "SadTalker", description: "Animate faces in photos with synchronized speech from audio", match: "exact" },
  { name: "MuseTalk", description: "Real-time high-quality talking face generation from reference image + audio", match: "exact" },
  { name: "EchoMimic", description: "Audio-driven face animation with full expression control", match: "exact" },
  { name: "Diffusers", description: "Hugging Face's modular diffusion model library — build custom image gen pipelines", match: "contains" },
  { name: "LoLLMs", description: "Local AI orchestration studio — manage and use hundreds of AI models locally", match: "exact" },

  // Audio/Voice
  { name: "ElevenLabs", description: "Industry-leading AI voice synthesis and cloning — ultra-realistic TTS", match: "exact" },
  { name: "Bark", description: "Suno's open-source multilingual text-to-speech model with emotional range", match: "exact" },
  { name: "Coqui TTS", description: "Open-source deep learning toolkit for Text-to-Speech — 1100+ languages", match: "contains" },
  { name: "Whisper", description: "OpenAI's open-source speech recognition — supports 99 languages, runs locally", match: "exact" },
  { name: "Faster-Whisper", description: "2-4x faster Whisper reimplementation using CTranslate2 — same accuracy", match: "exact" },
  { name: "XTTS", description: "Coqui's voice cloning model — clone any voice from 6 seconds of audio", match: "exact" },
  { name: "Fish Speech", description: "High-quality open-source voice cloning with multilingual support", match: "exact" },
  { name: "GPT-SoVITS", description: "Few-shot voice cloning — train a TTS model from just a few minutes of audio", match: "exact" },
  { name: "CosyVoice", description: "Alibaba's open-source voice generation with instruction-following capability", match: "exact" },
  { name: "Sparkle TTS", description: "Alibaba's emotion-controllable speech synthesis with natural prosody", match: "exact" },
  { name: "MeloTTS", description: "Fast high-quality TTS with Chinese/English support — optimized for speed", match: "exact" },
  { name: "Suno", description: "AI music generation — create full songs from text prompts with vocals", match: "exact" },
  { name: "Udio", description: "AI music generator producing radio-quality songs with lyrical coherence", match: "exact" },
  { name: "MusicGen", description: "Meta's open-source music generation model — melody and instrumental", match: "exact" },
  { name: "Stable Audio Open", description: "Stability AI's open-source music and sound effect generation model", match: "exact" },
  { name: "RVC", description: "Retrieval-based Voice Conversion — AI singing voice change tool", match: "exact" },
  { name: "So-VITS-SVC", description: "Singing voice conversion based on VITS — popular for AI song covers", match: "exact" },

  // Coding / Dev Tools
  { name: "GitHub Copilot", description: "AI pair programmer by GitHub/OpenAI — autocomplete, chat, and agent mode", match: "exact" },
  { name: "Cursor", description: "AI-first code editor — built on VS Code with deep AI integration throughout", match: "exact" },
  { name: "Windsurf", description: "AI IDE by Codeium — cascade mode for multi-file code understanding and editing", match: "exact" },
  { name: "Claude Code", description: "Anthropic's agentic coding CLI — autonomous software engineering in terminal", match: "exact" },
  { name: "Codestral", description: "Mistral's code-aware generative AI model with IDE integrations", match: "exact" },
  { name: "Aider", description: "AI pair programming in your terminal — pairs with Git for commit-level changes", match: "exact" },
  { name: "Continue", description: "Open-source AI code assistant plugin for VS Code and JetBrains", match: "exact" },
  { name: "Cline", description: "Autonomous AI coding agent for VS Code — can create/edit files, run commands", match: "exact" },
  { name: "Tabnine", description: "AI code completion engine — works offline, privacy-focused for enterprises", match: "exact" },
  { name: "Codeium", description: "Free AI code completion and chat — unlimited usage, 70+ languages", match: "exact" },
  { name: "Amazon Q Developer", description: "AWS's AI assistant for software development — integrated with AWS services", match: "exact" },
  { name: "Replit Agent", description: "AI that builds, deploys, hosts, and maintains software in the browser", match: "exact" },
  { name: "Bolt.new", description: "AI full-stack web app builder — prompt to deployed app in seconds", match: "exact" },
  { name: "v0 Dev", description: "Vercel's AI UI generator — text to React/Shadcn components instantly", match: "exact" },
  { name: "Lovable", description: "AI app builder that creates full-stack React apps from natural language", match: "exact" },
  { name: "DevTool", description: "AI-powered full-stack development environment in the browser", match: "exact" },
  { name: "Open Hands", description: "Open-source AI software developer — autonomous coding agent you can self-host", match: "exact" },
  { name: "SWE-agent", description: "Software Engineering Agent — uses LM to fix real GitHub issues autonomously", match: "exact" },
  { name: "Devin", description: "First fully autonomous AI software engineer — plans, codes, tests, deploys", match: "exact" },
  { name: "Qodo", description: "AI-powered testing and code integrity platform — gen-test, review, coverage", match: "exact" },
  { name: "Graphite", description: "AI-native code review platform — automated reviews with contextual awareness", match: "exact" },
  { name: "PR-Agent", description: "AI Pull Request agent — automates code review, feedback, and documentation", match: "exact" },

  // ── Downloading / Piracy ─────────────────────────
  { name: "LRepacks", description: "Community for repacked software — clean installs of Windows apps/games without bloatware", match: "exact" },
  { name: "Soft98", description: "Russian software forum providing cracked and repacked Windows applications safely", match: "exact" },
  { name: "Mobilism", description: "Massive Android forum for modded apps, games, books, and magazines — requires account", match: "exact" },
  { name: "Nsane Forums", description: "Software discussion community with downloads, news, and tech discussions", match: "exact" },
  { name: "AlternativeTo", description: "Crowdsourced platform for finding software alternatives — filter by license, platform, features", match: "exact" },
  { name: "AIOWares", description: "Software and game download forum with active community and verified uploads", match: "exact" },
  { name: "RuTracker", description: "Russia's largest torrent tracker — enormous library of software, games, media", match: "exact" },
  { name: "1337x", description: "Popular torrent site with curated content — movies, TV, games, software, apps", match: "exact" },
  { name: "The Pirate Bay", description: "The world's most resilient torrent index — vast database of torrents since 2003", match: "exact" },
  { name: "NYAA.si", description: "Specialized torrent tracker for anime, manga, and Japanese media content", match: "exact" },
  { name: "YT-DLP", description: "Command-line tool to download videos from YouTube and 1000+ other sites", match: "contains" },
  { name: "yt-dlp", description: "Command-line tool to download videos from YouTube and 1000+ other sites", match: "exact" },
  { name: "JDownloader", description: "Open-source download manager — auto-extract, captcha solving, batch downloads", match: "exact" },
  { name: "Internet Download Manager (IDM)", description: "Premium download accelerator with browser integration and multi-part downloading", match: "contains" },
  { name: "qBittorrent", description: "Free open-source BitTorrent client — lightweight, ad-free, feature-rich", match: "exact" },
  { name: "Transmission", description: "Minimal, fast, free BitTorrent client — default on many Linux distros", match: "exact" },
  { name: "Deluge", description: "Lightweight cross-platform BitTorrent client with plugin architecture", match: "exact" },
  { name: "aria2", description: "Ultra-fast download utility supporting HTTP/FTP/Bitorrent/Metalink with multi-connection", match: "contains" },
  { name: "MEGA", description: "Encrypted cloud storage with generous free tier — focus on privacy and security", match: "exact" },
  { name: "MediaFire", description: "Simple file hosting and sharing service — easy one-click downloads", match: "exact" },
  { name: "PixelDrain", description: "File sharing service with no size limits and no wait times for free users", match: "exact" },
  { name: "Gofile", description: "Free file hosting with unlimited downloads, speed, and storage", match: "exact" },
  { name: "Archive.org", description: "Internet Archive — digital library offering free access to books, movies, software, websites", match: "exact" },
  { name: "Internet Archive", description: "Digital library preserving billions of web pages, books, movies, and software", match: "exact" },
  { name: "DG-Drive", description: "Search engine for finding publicly shared Google Drive files", match: "exact" },
  { name: "DuckDuckGo", description: "Privacy-first search engine that doesn't track you — bang shortcuts for quick access", match: "exact" },

  // ── VPN / Privacy / Security ──────────────────────
  { name: "Proton VPN", description: "Swiss-based free VPN with strict no-logs policy — created by the Proton Mail team", match: "contains" },
  { name: "Mullvad", description: "Privacy-focused VPN — pay anonymously, no accounts needed, rigorous transparency", match: "exact" },
  { name: "IVPN", description: "Privacy-first VPN with RAM-only servers, open-source clients, and audited no-logs", match: "exact" },
  { name: "Windscribe", description: "VPN with free tier (10GB/month) and built-in ad/tracker blocking", match: "exact" },
  { name: "TunnelBear", description: "User-friendly VPN with free tier (2GB/month) — great design and ease of use", match: "exact" },
  { name: "Tor Browser", description: "Anonymous web browser routing traffic through 3 nodes — strongest privacy available", match: "contains" },
  { name: "I2P", description: "Anonymous network overlay — decentralized, censorship-resistant communication layer", match: "exact" },

  // ── Media Streaming ───────────────────────────────
  { name: "Stremio", description: "All-in-one media streaming hub — combine streaming services + addons in one interface", match: "exact" },
  { name: "Plex", description: "Personal media server + streaming client — organize and stream your own library beautifully", match: "exact" },
  { name: "Jellyfin", description: "Free open-source media server — self-hosted alternative to Plex/Emby, no subscriptions", match: "exact" },
  { name: "Emby", description: "Media server for organizing, playing, and streaming personal media collections", match: "exact" },
  { name: "Kodi", description: "Open-source home theater software — highly customizable with addons ecosystem", match: "exact" },
  { name: "Infuse", description: "Premium iOS/Mac media player — beautiful playback with automatic metadata fetching", match: "exact" },
  { name: "Popcorn Time", description: "Streaming torrent client — browse and watch movies/TV instantly from torrents", match: "exact" },
  { name: "Radarr", description: "Movie collection manager — automatically downloads movies from Usenet/torrents", match: "exact" },
  { name: "Sonarr", description: "TV show collection manager — auto-downloads episodes as they air", match: "exact" },
  { name: "Bazarr", description: "Companion app for Sonarr/Radarr — manages and downloads subtitles automatically", match: "exact" },
  { name: "Lidarr", description: "Music collection manager — like Sonarr but for music libraries and artists", match: "exact" },
  { name: "Readarr", description: "Book and ebook collection manager — organizes and auto-downloads reading material", match: "exact" },
  { name: "Mylar3", description: "Comic book collection manager — auto-downloads issues from RSS/torrents", match: "exact" },
  { name: "Overseerr", description: "Media request management — let family/friends request content for Plex/Jellyfin", match: "exact" },
  { name: "Tube Archivist", description: "Self-hosted YouTube archive — downloads, indexes, and streams your saved videos", match: "contains" },
  { name: "Audiobookshelf", description: "Self-hosted audiobook and podcast server — fully managed web interface", match: "exact" },
  { name: "Calibre", description: "Ebook management powerhouse — convert formats, organize library, sync to e-readers", match: "exact" },
  { name: "Calibre-Web", description: "Web frontend for Calibre — browse, download, and read ebooks from browser", match: "exact" },
  { name: "Kavita", description: "Modern self-hosted ebook/comic server with OPDS support and beautiful reading UI", match: "exact" },
  { name: "Komga", description: "Comic/manga server with OPDS support — perfect for managing digital comic collections", match: "exact" },
  { name: "Tachiyomi", description: "Free open-source manga reader for Android — extensibility via extensions", match: "exact" },
  { name: "Mihon", description: "Continuation of Tachiyomi — free manga reader after original was discontinued", match: "exact" },

  // ── OS / System ──────────────────────────────────
  { name: "Windows 11", description: "Microsoft's latest desktop OS — modern UI, Android apps, gaming optimizations", match: "contains" },
  { name: "Windows 10 LTSC", description: "Long-term servicing channel Windows 10 — no bloatware, 5 years of security updates", match: "contains" },
  { name: "Ventura", description: "macOS 13 — Stage Manager, Continuity Camera, updated system apps", match: "contains" },
  { name: "Sonoma", description: "macOS 14 — widgets on desktop, game mode, screensavers as wallpaper", match: "contains" },
  { name: "Sequoia", description: "macOS 15 — iPhone mirroring, window tiling, Safari updates", match: "contains" },
  { name: "Linux Mint", description: "Beginner-friendly Linux distro — Windows-like experience out of the box", match: "contains" },
  { name: "Ubuntu", description: "Most popular Linux distribution — excellent balance of usability and power", match: "exact" },
  { name: "Fedora", description: "Cutting-edge Linux distro with latest software — Red Hat backed", match: "exact" },
  { name: "Arch Linux", description: "Rolling-release distro — build your system exactly how you want it", match: "exact" },
  { name: "Debian", description: "Rock-stable Linux — foundation for Ubuntu, incredibly reliable for servers", match: "exact" },
  { name: "openSUSE", description: "Enterprise-grade German Linux distro — YaST configuration tool, Tumbleweed rolling release", match: "exact" },
  { name: "Manjaro", description: "User-friendly Arch-based distro — access to AUR with easy installation", match: "exact" },
  { name: "Pop!_OS", description: "System76's Ubuntu-based distro — optimized for workflow and productivity", match: "exact" },
  { name: "NixOS", description: "Declarative Linux distro — reproducible configurations, atomic upgrades", match: "exact" },
  { name: "Vanilla OS", description: "Immutable Debian-based distro — clean, simple, reliable desktop experience", match: "exact" },
  { name: "Fedora Asahi Remix", description: "Apple Silicon native Linux distro — full hardware support for Mac M1/M2/M3", match: "exact" },
  { name: "Windows AME", description: "Minimal Windows 10 build — stripped of all telemetry, bloat, and unnecessary services", match: "exact" },
  { name: "Ghost spectre", description: "Heavily modified Windows 10/11 ISO — debloated, optimized, tiny install size", match: "contains" },
  { name: "AtlasOS", description: "Gaming-optimized Windows — reduced latency, disabled telemetry, maximal performance", match: "exact" },
  { name: "Tiny10/11", description: "Debloated lightweight Windows — fits on small drives, runs on old hardware", match: "contains" },
  { name: "ReviOS", description: "Performance-oriented Windows build — balances gaming performance with functionality", match: "exact" },
  { name: "Cinnamon", description: "Linux desktop environment — traditional layout, polished, beginner-friendly", match: "exact" },
  { name: "GNOME", description: "Modern Linux desktop environment — clean, touch-friendly, default on Fedora", match: "exact" },
  { name: "KDE Plasma", description: "Feature-rich highly customizable Linux desktop — Windows-like power user experience", match: "contains" },
  { name: "XFCE", description: "Lightweight Linux desktop environment — fast, stable, low resource usage", match: "exact" },
  { name: "Hyprland", description: "Dynamic tiling Wayland compositor — sleek animations, keyboard-driven workflow", match: "exact" },
  { name: "qtile", description: "Full-featured tiling window manager written in Python — hackable and efficient", match: "exact" },
  { name: "i3wm", description: "Tiling window manager — keyboard-driven, lightweight, extremely efficient", match: "exact" },
  { name: "Sway", description: "i3-compatible Wayland compositor — drop-in replacement for i3 on Wayland", match: "exact" },
  { name: "VirtualBox", description: "Oracle's free virtualization software — run guest OSes inside your host", match: "exact" },
  { name: "VMware", description: "Enterprise virtualization platform — workstation and enterprise solutions", match: "contains" },
  { name: "QEMU", description: "Open-source machine emulator and virtualizer — emulate any architecture", match: "exact" },
  { name: "UTM", description: "Virtualization for macOS/iOS — run Windows, Linux, macOS VMs on Apple Silicon", match: "exact" },
  { name: "Wine", description: "Compatibility layer for running Windows apps on Unix-like systems", match: "exact" },
  { name: "Bottles", description: "Run Windows software and games on Linux with ease — GUI for Wine prefixes", match: "exact" },

  // ── Office / Documents ────────────────────────────
  { name: "LibreOffice", description: "Full-featured open-source office suite — Word, Excel, PowerPoint alternatives", match: "exact" },
  { name: "OnlyOffice", description: "Modern office suite with excellent MS format compatibility and cloud collaboration", match: "exact" },
  { name: "SoftMaker", description: "German-made MS Office compatible suite — fast, light, great format fidelity", match: "exact" },
  { name: "WPS Office", description: "Chinese office suite — good Microsoft compatibility with free cloud features", match: "exact" },
  { name: "AbiWord", description: "Lightweight word processor — fast, free, handles basic docs efficiently", match: "exact" },
  { name: "Calligra", description: "KDE integrated office suite — words, sheets, stage, and more", match: "exact" },
  { name: "Apache OpenOffice", description: "Original open-source office suite — mature, reliable, widely compatible", match: "contains" },

  // ── Design / Creative ─────────────────────────────
  { name: "GIMP", description: "Free Photoshop alternative — image editing, retouching, compositing, and more", match: "exact" },
  { name: "Krita", description: "Digital painting program — designed for concept artists, illustrators, and VFX", match: "exact" },
  { name: "Inkscape", description: "Free vector graphics editor — Illustrator alternative with SVG native format", match: "exact" },
  { name: "Blender", description: "Free 3D creation suite — modeling, sculpting, animation, rendering, VFX, all in one", match: "exact" },
  { name: "DaVinci Resolve", description: "Professional video editing software with color grading and Fusion VFX — free tier is powerful", match: "contains" },
  { name: "Kdenlive", description: "Open-source video editor — multi-track editing with intuitive timeline interface", match: "exact" },
  { name: "Shotcut", description: "Cross-platform video editor — wide format support with audio mixing", match: "exact" },
  { name: "OBS Studio", description: "Free screen recording and streaming software — industry standard for content creators", match: "exact" },
  { name: "Audacity", description: "Free multi-track audio editor — record, edit, mix, and apply effects", match: "exact" },
  { name: "Tenacity", description: "Fork of Audacity after Muse Group acquisition — community-maintained audio editor", match: "exact" },
  { name: "OpenShot", description: "Simple yet powerful video editor — drag-drop, animations, unlimited tracks", match: "exact" },
  { name: "FFmpeg", description: "Complete multimedia framework — record, convert, stream audio/video via command line", match: "exact" },
  { name: "Handbrake", description: "Open-source video transcoder — convert any video to any format easily", match: "exact" },
  { name: "Canva", description: "Online design platform — templates for social media, presentations, documents, videos", match: "exact" },
  { name: "Figma", description: "Collaborative design tool — UI/UX design, prototyping, and design systems", match: "exact" },
  { name: "Penpot", description: "Open-source Figma alternative — web-based design tool using open standards (SVG)", match: "exact" },
  { name: "Photopea", description: "Free browser-based Photoshop clone — PSD-compatible, no installation needed", match: "exact" },
  { name: "Remove.bg", description: "AI background remover — one-click background removal from any image", match: "exact" },
  { name: "Cleanup.pictures", description: "AI-powered object/defect removal from images — magic eraser for photos", match: "exact" },

  // ── Passwords / Security ──────────────────────────
  { name: "Bitwarden", description: "Open-source password manager — zero-knowledge encryption, cross-platform sync", match: "exact" },
  { name: "KeePass", description: "Free offline password manager — encrypted database stays fully under your control", match: "contains" },
  { name: "1Password", description: "Premium password manager with excellent UX — Watchtower, Travel Mode, family sharing", match: "exact" },
  { name: "Proton Pass", description: "Proton's password manager — email aliases, hide-my-email aliasing built in", match: "exact" },

  // ── Cloud Storage ─────────────────────────────────
  { name: "Google Drive", description: "Google's cloud storage with Docs/Sheets/Slides integration — 15GB free", match: "exact" },
  { name: "Dropbox", description: "Pioneer cloud storage — seamless file sync, excellent version history", match: "exact" },
  { name: "OneDrive", description: "Microsoft's cloud storage — deep Windows/Office integration, 5GB free", match: "exact" },
  { name: "pCloud", description: "Lifetime cloud storage plans available — secure Swiss-based provider", match: "exact" },
  { name: "Icedrive", description: "Modern cloud storage with lifetime deals — mount as virtual drive", match: "exact" },

  // ── Email ─────────────────────────────────────────
  { name: "Proton Mail", description: "Encrypted email service — Switzerland-based, zero-access, open-source", match: "contains" },
  { name: "Tuta", description: "Encrypted email and calendar — Germany-based, fully anonymous signup option", match: "exact" },
  { name: "Gmail", description: "Google's free email service — 15GB storage, spam filtering, ecosystem integration", match: "exact" },
  { name: "Outlook", description: "Microsoft's email service — calendar integration, Focused Inbox, Office 365 synergy", match: "exact" },
  { name: "SimpleLogin", description: "Email alias service by Proton — create unlimited disposable email addresses", match: "exact" },

  // ── Messaging / Social ────────────────────────────
  { name: "Signal", description: "Encrypted messaging — gold standard for privacy, open-source, no ads ever", match: "exact" },
  { name: "Telegram", description: "Cloud-based messaging — fast, feature-rich channels, bots, and large file sharing", match: "exact" },
  { name: "Element", description: "Open messaging protocol/network — decentralized, end-to-end encrypted, self-hostable", match: "exact" },
  { name: "Discord", description: "Voice, video, and text chat for communities — servers, bots, streaming", match: "exact" },
  { name: "Threema", description: "Paid encrypted messenger — doesn't require phone number or email", match: "exact" },
  { name: "Session", description: "Anonymous encrypted messaging — no phone number, metadata-resistant routing", match: "exact" },
  { name: "Wire", description: "Secure messenger for business and personal use — end-to-end encrypted everything", match: "exact" },

  // ── Misc / General Popular ────────────────────────
  { name: "uBlock Origin", description: "Most efficient content blocker — saves bandwidth, speeds browsing, blocks ads/trackers", match: "exact" },
  { name: "AdGuard", description: "System-wide ad blocking — DNS filtering, parental controls, stealth mode", match: "exact" },
  { name: "Pi-hole", description: "Network-wide DNS ad blocker — block ads for every device on your network", match: "exact" },
  { name: "Nextcloud", description: "Self-hosted Dropbox/Google Drive alternative — files, contacts, calendars, more", match: "exact" },
  { name: "Home Assistant", description: "Open-source home automation — connect and control 1000+ smart devices locally", match: "exact" },
  { name: "Immich", description: "Self-hosted Google Photos alternative — AI-powered photo management and backup", match: "exact" },
  { name: "Paperless-ngx", description: "Document management system — scan, index, OCR, and search all your documents", match: "exact" },
  { name: "Vaultwarden", description: "Lightweight Bitwarden-compatible server — self-host your password manager", match: "exact" },
  { name: "n8n", description: "Workflow automation tool — visual programming for connecting APIs and services", match: "exact" },
  { name: "Docker", description: "Container platform — package apps into portable containers for consistent deployments", match: "exact" },

  // ── Productivity / Notes ──────────────────────────
  { name: "Notion", description: "All-in-one workspace for notes, docs, wikis, projects, and databases", match: "exact" },
  { name: "Obsidian", description: "Knowledge base app that works on local Markdown files — link-your-thinking paradigm", match: "exact" },
  { name: "Logseq", description: "Open-source knowledge management — privacy-first, local-first, outliner-style", match: "exact" },
  { name: "Anytype", description: "Local-first Notion alternative — privacy-focused, offline-capable workspace", match: "exact" },
  { name: "AppFlowy", description: "Open-source Notion alternative — data owned by you, extensible with Flutter/Dart", match: "exact" },
  { name: "Affine", description: "Open-source Notion-style workspace with database, whiteboard, and doc editing", match: "exact" },
  { name: "SiliconFlow", description: "Chinese AI inference platform with open-source model hosting and API access", match: "exact" },
  { name: "Z.ai", description: "Zhipu AI's chatbot powered by GLM series language models", match: "exact" },
  { name: "MiniMax", description: "Chinese AI company offering language, video, and music generation models", match: "contains" },
  { name: "StepFun", description: "Chinese AI startup with Step series language and multimodal models", match: "exact" },
  { name: "Moonshot (Kimi)", description: "Moonshot AI's Kimi chatbot — strong at long-context document analysis", match: "contains" },
  { name: "Hyperspace", description: "Peer-to-peer AI compute network — share GPU resources across a decentralized network", match: "exact" },
  { name: "Odysseus", description: "Web-based AI chat interface with customizable model backends", match: "contains" },
  { name: "Leon", description: "Open-source personal AI assistant — self-hostable, extensible, privacy-focused", match: "exact" },
  { name: "Pollinations", description: "Free uncensored AI image, video, and text generation — no signup required", match: "contains" },
  { name: "Apertus", description: "Open-source 70B parameter language model for research and deployment", match: "exact" },
  { name: "LongCat AI", description: "AI image generation and editing tool with generous daily free credits", match: "exact" },
  { name: "Mage", description: "AI image generation space with community-created workflows and models", match: "exact" },
  { name: "Diffusers Image Outpaint", description: "AI tool for extending images beyond their borders intelligently", match: "contains" },
];

// ── 2. 分类模板系统（智能 fallback）───────────────────
// 当字典没有命中时，根据分类生成合理的描述

const CATEGORY_TEMPLATES: Record<string, string> = {
  "Artificial-Intelligence": "AI-powered tool for intelligent tasks and automation",
  "Adblock": "Content and ad blocking solution for cleaner browsing",
  "Mobile": "Mobile application resource for Android and iOS",
  "Misc": "Useful utility tool for everyday tasks",
  "Downloading": "Download platform for software, media, and files",
  "Streaming": "Media streaming and entertainment platform",
  "VPN": "Privacy and security tool for safe internet access",
  "Operating-Systems": "Operating system or system utility software",
  "Office": "Productivity software for documents and work",
  "Passwords": "Security tool for credential and identity management",
  "Cloud": "Cloud storage and file synchronization service",
  "Email": "Email service for private communication",
  "Messaging": "Communication platform for chatting and calling",
  "Reading": "Resource for books, ebooks, and reading materials",
  "Design": "Creative tool for design and media creation",
  "Programming": "Developer tool for software engineering",
};

// ── 3. 垃圾检测模式 ──────────────────────────────────
// 这些 pattern 匹配的描述应该被视为垃圾，不显示

const JUNK_PATTERNS: RegExp[] = [
  /^\s*-?\s*(use|sign[- ]?up|free|paid|freemium)\s*$/i,
  /^\s*-?\s*requires\s+/i,
  /^\s*\*+\s*$/,
  /^[\/,\-*\.]+\s*$/,
  /^\s*-\s*$/i,
  /^use \[translator\]/i,
  /^\s*software forum$/i,
  /^\s*crowdsourced recommendations$/i,
];

const SHORT_JUNK_WORDS = [
  "use", "sign-up", "signup", "free", "paid", "freemium",
  "self-hosted", "unlimited", "web ui", "modded apks",
  "books", "audiobooks", "multi-host",
];

/**
 * 检查一段清洗后的文本是否是垃圾/无意义内容
 */
export function isJunkDescription(text: string): boolean {
  if (!text || text.length < 6) return true;

  const trimmed = text.trim();
  if (JUNK_PATTERNS.some(p => p.test(trimmed))) return true;

  const lower = trimmed.toLowerCase();
  if (SHORT_JUNK_WORDS.some(w => lower === w)) return true;

  // 如果只有一两个词且都是通用词
  const words = trimmed.split(/\s+/).filter(w => w.length > 1);
  if (words.length <= 1 && trimmed.length < 20) return true;

  return false;
}

// ── 主函数：获取增强后的描述 ──────────────────────────

/**
 * 获取工具的最佳描述
 *
 * 优先级：
 *   1. 精选字典精确匹配
 *   2. 精选字典模糊匹配 (contains)
 *   3. 原始描述清洗后质量检查（通过则使用）
 *   4. 分类模板 fallback
 *   5. 最终兜底：返回空（调用方应隐藏描述区域）
 */
export function getEnhancedDescription(
  name: string,
  rawDescription: string | undefined,
  category?: string,
): string {
  const normalizedName = name.trim().replace(/^\W+/, "");

  // 1. 字典查找 — 精确匹配
  const exactMatch = TOOL_DESCRIPTIONS.find(
    (e) =>
      (e.match || "exact") === "exact" &&
      e.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (exactMatch) return exactMatch.description;

  // 2. 字典查找 — 模糊匹配 (name contains key OR key contains name)
  const fuzzyMatch = TOOL_DESCRIPTIONS.find(
    (e) =>
      (e.match || "contains") === "contains" &&
      (normalizedName.toLowerCase().includes(e.name.toLowerCase()) ||
        e.name.toLowerCase().includes(normalizedName.toLowerCase())) &&
      normalizedName.length >= 3 &&
      e.name.length >= 3
  );
  if (fuzzyMatch) return fuzzyMatch.description;

  // 3. 清洗原始描述并检查质量
  if (rawDescription) {
    const cleaned = cleanRawDescription(rawDescription);
    if (!isJunkDescription(cleaned) && cleaned.length > 10) {
      return cleaned.length > 100 ? cleaned.slice(0, 97) + "..." : cleaned;
    }
  }

  // 4. 分类模板 fallback
  if (category && CATEGORY_TEMPLATES[category]) {
    return `${CATEGORY_TEMPLATES[category]} — ${normalizedName}`;
  }

  // 5. 完全没有可用信息 — 返回空字符串让调用方处理
  return "";
}

/**
 * 清洗 FMHY 格式的原始描述（纯文本提取，不含判断逻辑）
 */
function cleanRawDescription(desc: string): string {
  if (!desc) return "";

  // 取最后一个 "- " 之后的内容（FMHY 的真正描述通常在末尾）
  const lastDash = desc.lastIndexOf("- ");
  if (lastDash > desc.length * 0.4) {
    let result = desc.slice(lastDash + 2).trim();
    result = result.replace(/\[.*?\]\(.*?\)/g, " ").trim();
    result = result.replace(/\s{2,}/g, " ").trim();
    if (result.length >= 3) return result;
  }

  // 兜底清洗
  let cleaned = desc
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/^\*+\s*/, "")
    .replace(/^[\/,\s]+/g, "")
    .replace(/\\/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned;
}
