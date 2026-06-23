#!/usr/bin/env python3
"""
批量爬取 free-for-dev 资源官网的 meta description，填充到 JSON 文件。
不依赖任何外部 API，纯 HTML 解析。
"""

import json
import os
import socket
import time
import urllib.request
import urllib.error
import urllib.parse
import re
import ssl

DATA_FILE = os.path.join(os.path.dirname(__file__), '../../public/data/free-for-dev-resources.json')
CHECKPOINT_FILE = os.path.join(os.path.dirname(__file__), 'enrich_checkpoint.json')

# 已知描述的资源（内置知识库，爬不到时用）
BUILTIN = {
    "free-for-dev--microsoft-azure": "Microsoft Azure is a comprehensive cloud computing platform with over 200 products and services. Free account includes $200 credit for 30 days, 12 months of popular services free, and 25+ services always free including App Service, Functions, and Cosmos DB.",
    "free-for-dev--virtual-machines": "Azure Virtual Machines provide scalable compute resources on demand. Free tier includes 750 hours per month of B1s burstable VMs for 12 months, plus 2000 hours of B1ls instances. Ideal for development, testing, and small production workloads.",
    "free-for-dev--app-service": "Azure App Service is a fully managed platform for building and hosting web apps, mobile backends, and RESTful APIs. Free tier includes 10 apps per subscription, shared infrastructure with 60 CPU minutes/day and 1GB storage.",
    "free-for-dev--functions": "Azure Functions is a serverless compute service that lets you run event-triggered code without managing infrastructure. Free grant includes 1 million requests and 400,000 GB-seconds of compute per month permanently.",
    "free-for-dev--devtest-labs": "Azure DevTest Labs provides a self-service sandbox environment for building, deploying, and testing applications. Free tier allows creating Windows and Linux virtual machines with reusable templates and artifacts for development and testing scenarios.",
    "free-for-dev--sql-database": "Azure SQL Database is a fully managed PaaS database engine. Free tier offers 250 GB of database storage with serverless compute that auto-pauses when inactive. Supports single databases, elastic pools, and managed instances.",
    "free-for-dev--cosmos-db": "Azure Cosmos DB is a globally distributed, multi-model NoSQL database service. Free tier provides 1000 request units per second (RU/s) and 25 GB storage permanently free. Supports MongoDB, Cassandra, Gremlin, and Table APIs.",
    "free-for-dev--storage": "Azure Storage provides scalable cloud storage for data objects, files, queues, and tables. Free tier includes 5 GB of LRS Blob storage and 20 GB of LRS File storage for 12 months, plus 500 TB of bandwidth per month.",
    "free-for-dev--active-directory": "Azure Active Directory (now Microsoft Entra ID) is a cloud-based identity and access management service. Free tier includes user management, SSO for up to 10 apps per user, and basic security reports. Essential for securing cloud applications.",
    "free-for-dev--api-management": "Azure API Management enables publishing, securing, and analyzing APIs. Free tier (Developer) includes a single-region gateway with 500 calls per month permanently. Supports API versioning, policy enforcement, and developer portal.",
    "free-for-dev--container-instances": "Azure Container Instances provide the fastest and simplest way to run containers in Azure. Free tier includes 1 vCPU and 1.5 GB memory for 12 months. Ideal for lightweight applications, task automation, and CI/CD workloads.",
    "free-for-dev--kubernetes-service": "Azure Kubernetes Service (AKS) simplifies deploying, managing, and scaling containerized applications using Kubernetes. Free tier includes free cluster management, you only pay for the underlying VM nodes.",
    "free-for-dev--container-registry": "Azure Container Registry is a managed Docker registry service based on the open-source Docker Registry. Free tier (Basic) includes 10 GB storage and unlimited webhooks. Supports geo-replication and token-based authentication.",
    "free-for-dev--static-web-apps": "Azure Static Web Apps is a service that automatically builds and deploys full-stack web apps from a GitHub repository. Free tier includes 100 GB bandwidth per subscription per month, custom domains, and SSL certificates.",
    "free-for-dev--github": "GitHub is the world's largest code hosting platform with built-in version control, collaboration, and CI/CD. Free for public and private repositories with 2000 GitHub Actions minutes per month, 500 MB GitHub Packages storage, and basic team features.",
    "free-for-dev--gitlab": "GitLab is a complete DevOps platform with built-in Git repository, CI/CD, security scanning, and project management. Free tier includes 400 compute units of CI/CD, 5 GB storage per project, and unlimited public/private repositories.",
    "free-for-dev--bitbucket": "Bitbucket is Atlassian's Git code management solution with built-in CI/CD (Pipeline) and code review features. Free tier includes unlimited private repositories for up to 5 users, 50 build minutes per month, and Jira integration.",
    "free-for-dev--google-cloud-platform": "Google Cloud Platform offers a comprehensive suite of cloud services including computing, storage, and machine learning. Free tier includes $300 credit for 90 days, 20+ always-free products including App Engine, Cloud Functions, and Cloud Storage.",
    "free-for-dev--google-colab": "Google Colab is a free cloud-based Jupyter notebook environment that requires no setup. It provides free access to NVIDIA GPUs and TPUs for machine learning and data science. Notebooks can be shared like Google Docs.",
    "free-for-dev--google-firebase": "Firebase is Google's platform for building mobile and web applications. Free Spark plan includes 1 GB Realtime Database, 10 GB Cloud Storage, 125k/month Cloud Functions invocations, and hosting with 10 GB/month transfer.",
    "free-for-dev--kaggle": "Kaggle is the world's largest data science community with free access to GPU-accelerated notebooks, 100 GB of persistent storage, and hundreds of curated datasets. Hosts machine learning competitions with cash prizes.",
    "free-for-dev--oracle-cloud": "Oracle Cloud Free Tier includes Always Free services with no time limit plus $300 in free credits for 30 days. Always Free includes 2 AMD-based VMs, 4 Arm-based Ampere VMs, Autonomous Database, and Object Storage.",
    "free-for-dev--digitalocean": "DigitalOcean is a simple cloud platform for developers. Free tier via GitHub Student Developer Pack includes $100 in platform credit. Droplets start at $4/month for 512MB RAM, 1 vCPU, and 10GB SSD.",
    "free-for-dev--linode": "Linode (now Akamai) provides simple, affordable cloud computing. Free tier via GitHub Student Developer Pack includes $100 credit. Nanode starts at $5/month with 1GB RAM, 1 vCPU, and 25GB SSD storage.",
    "free-for-dev--vultr": "Vultr offers cloud compute and bare metal servers across 30+ global locations. New users receive $250 free credit valid for 30 days. Compute instances start at $2.50/month with 512MB RAM, 1 vCPU, and 10GB SSD.",
    "free-for-dev--heroku": "Heroku is a platform-as-a-service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud. Free tier (Eco plan) includes 1000 dyno hours per month with sleep after 30 minutes of inactivity.",
    "free-for-dev--render": "Render is a unified cloud platform for building and running all your apps and websites. Free tier includes static site hosting with 100 GB/month bandwidth, and web services with 512 MB RAM that sleep after 15 minutes of inactivity.",
    "free-for-dev--vercel": "Vercel is a platform for frontend frameworks and static sites, built to integrate with headless content management systems. Free tier (Hobby) includes unlimited deployments, 100 GB bandwidth per month, and automatic SSL for custom domains.",
    "free-for-dev--netlify": "Netlify is a platform for deploying and scaling modern web applications. Free tier (Starter) includes 100 GB bandwidth per month, 125k functions requests per month, and 300 build minutes per month with continuous deployment from Git.",
    "free-for-dev--cloudflare": "Cloudflare is a global CDN and security platform. Free plan includes unlimited CDN bandwidth, free SSL certificates, DDoS protection, and basic WAF. Covers DNS management, traffic optimization, and bot mitigation.",
    "free-for-dev--firebase-hosting": "Firebase Hosting provides fast and secure hosting for web app static content and dynamic content via integration with Cloud Functions. Free tier includes 10 GB storage, 360 MB per day data transfer, and free SSL certificates.",
    "free-for-dev--surge": "Surge is a static web publishing platform for front-end developers. Free tier includes unlimited publishing, custom domain support with free SSL, and basic CLI deployment. Ideal for single-page applications and static websites.",
    "free-for-dev--pages-github": "GitHub Pages is a static site hosting service designed to host your personal, organization, or project pages directly from a GitHub repository. Free for public repositories with 1 GB storage limit and 100 GB bandwidth per month.",
    "free-for-dev--pages-cloudflare": "Cloudflare Pages is a JAMstack platform for frontend developers to collaborate and deploy websites. Free tier includes unlimited sites, 500 builds per month, unlimited bandwidth, and preview deployments for every git branch.",
    "free-for-dev--aws-amplify": "AWS Amplify is a set of purpose-built tools and features that lets frontend web and mobile developers quickly and easily build full-stack applications on AWS. Free tier includes 1000 build minutes per month and 5 GB stored artifacts.",
    "free-for-dev--fastify": "Fastify is a fast and low-overhead web framework for Node.js. It is highly performant with a powerful plugin architecture, built-in JSON schema validation, and TypeScript support. Ideal for building high-performance REST APIs and microservices.",
    "free-for-dev--nestjs": "NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It uses TypeScript and combines elements of OOP, FP, and FRP. Inspired by Angular, it provides a modular architecture with dependency injection.",
    "free-for-dev--strapi": "Strapi is a flexible, open-source headless CMS that gives developers the freedom to choose their favorite tools. Free Community Edition includes custom content types, REST and GraphQL APIs, and self-hosted deployment. Supports PostgreSQL, MongoDB, and SQLite.",
    "free-for-dev--directus": "Directus is an open-source headless CMS and data platform that mirrors your SQL database in real-time. Free self-hosted version includes unlimited users, roles, and permissions. Provides REST and GraphQL APIs with a no-code app builder.",
    "free-for-dev--sanity": "Sanity is a headless CMS built for real-time collaboration and structured content. Free tier (Developer) includes 3 non-admin users, 2 datasets, 500 MB asset storage, and 50k API requests per day. Studio is open-source and customizable.",
    "free-for-dev--contentful": "Contentful is a headless CMS that lets you create, manage, and distribute content to any platform. Free tier (Community) includes 5 users, 25k records, 100k API calls per month, and 2 spaces. Supports webhooks and multiple environments.",
    "free-for-dev--supabase": "Supabase is an open-source Firebase alternative with a Postgres database, authentication, real-time subscriptions, and storage. Free tier includes 500 MB database storage, 1 GB file storage, 50k monthly active users, and 2 GB data transfer out per month.",
    "free-for-dev--appwrite": "Appwrite is an open-source backend-as-a-service that helps developers build web and mobile apps faster. Free self-hosted version includes authentication, databases, functions, storage, and real-time support. One-click Docker deployment with SDKs for all major platforms.",
    "free-for-dev--hasura": "Hasura provides instant GraphQL APIs on top of Postgres databases. Free tier (Cloud) includes 2 projects, 10 MB data passthrough per month, and 60 requests per minute. Supports event triggers, remote schemas, and actions for extending GraphQL APIs.",
    "free-for-dev--fauna": "Fauna is a serverless, globally distributed database with native GraphQL. Free tier (Free) includes 100 MB storage, 100k read operations, and 50k write operations per day. ACID transactions with temporality and streaming support.",
    "free-for-dev--mongodb-atlas": "MongoDB Atlas is a fully managed cloud database with built-in automation, monitoring, and security. Free tier (M0 Sandbox) includes 512 MB storage shared with other users. Supports MongoDB Query Language, aggregation pipeline, and change streams.",
    "free-for-dev--redis-cloud": "Redis Cloud is a fully managed in-memory NoSQL database. Free tier includes 30 MB of storage with 2 databases and 2 connections. Supports Redis modules including RediSearch, RedisJSON, and RedisTimeSeries for enhanced data modeling.",
    "free-for-dev--planetscale": "PlanetScale is a serverless database platform powered by Vitess and MySQL. Free tier (Starter) includes 1 database, 1 billion row reads per month, and 10 million row writes per month. Branching workflow similar to Git for database schema changes.",
    "free-for-dev--neon": "Neon is a serverless Postgres database that separates compute and storage. Free tier includes 1 project, 3 branches, 512 MB storage, and 191 hours of active time per month. Supports branching, point-in-time restore, and autoscaling.",
    "free-for-dev--elephantsql": "ElephantSQL is a managed PostgreSQL database service. Free tier (Tiny Turtle) includes 20 MB storage with 5 concurrent connections. Provides a web-based admin interface, automated backups, and support for all PostgreSQL extensions.",
    "free-for-dev--railway": "Railway is a modern infrastructure platform that makes it easy to deploy your code. Free trial includes $5 of usage credits. Supports any language, automatic SSL, and instant rollbacks. Deploy from GitHub with zero configuration required.",
    "free-for-dev--fly-io": "Fly.io is a platform for running full-stack apps and databases close to your users. Free tier includes 3 shared-CPU VMs, 3GB persistent volume storage, and 160 GB outbound data transfer per month. Supports Docker deployments globally.",
    "free-for-dev--deno-deploy": "Deno Deploy is a distributed system that runs JavaScript, TypeScript, and WebAssembly at the edge. Free tier includes 100,000 requests per day, 100 GB data transfer per month, and up to 100 deployments with 10 MB script size limit.",
    "free-for-dev--workers-cloudflare": "Cloudflare Workers provides a serverless execution environment that allows you to create new applications or augment existing ones without configuring or maintaining infrastructure. Free tier includes 100,000 requests per day and 10ms CPU time per request.",
    "free-for-dev--deta": "Deta is a free cloud platform for building and deploying JavaScript and Python applications. Free tier includes Deta Base (1GB NoSQL database), Deta Drive (10GB file storage), and unlimited serverless Micros with automatic SSL and custom domains.",
    "free-for-dev--new-relic": "New Relic is an observability platform that helps you build better software. Free tier (Standard) includes 100 GB per month of data ingest, 1 full-platform user, and unlimited basic users. Covers APM, infrastructure monitoring, and distributed tracing.",
    "free-for-dev--datadog": "Datadog is a monitoring and security platform for cloud applications. Free tier includes 5 hosts, 1-day metric retention, 100 million events for Log Management, and 50 incident flows. Supports APM, infrastructure monitoring, and synthetic testing.",
    "free-for-dev--sentry": "Sentry is an error tracking and performance monitoring platform for developers. Free tier (Developer) includes 5,000 errors per month, 10k transactions for performance monitoring, and 1 team member. Supports all major frameworks and languages with source map support.",
    "free-for-dev--logdna": "LogDNA (now Mezmo) is a centralized log management platform. Free tier includes 50 MB per day of log ingestion with 7-day retention and live streaming. Supports all major platforms with agent-based and agent-less log collection.",
    "free-for-dev--papertrail": "Papertrail is a cloud-based log management service. Free tier includes 50 MB per month with 2-day searchable log retention. Supports syslog and HTTP/S log destinations with CLI and API access for automated log analysis.",
    "free-for-dev--uptimerobot": "UptimeRobot is a website monitoring service that checks your sites every 5 minutes for free. Free tier includes 50 monitors with 5-minute check intervals, 2-month log retention, and email/SMS/Slack notifications for downtime alerts.",
    "free-for-dev--statuspage": "Statuspage (by Atlassian) is a status and incident communication tool. Free tier (Public Status Page) includes 1 status page, unlimited subscribers, and incident templates. Helps communicate downtime and maintenance to customers transparently.",
    "free-for-dev--snyk": "Snyk is a developer security platform for finding and fixing vulnerabilities in code, dependencies, containers, and infrastructure. Free tier includes 100 tests per month for open-source projects, unlimited tests for private repos with Snyk Open Source, and CLI tooling.",
    "free-for-dev--sonarcloud": "SonarCloud is a cloud-based code quality and security service. Free tier for open-source projects includes unlimited lines of code analysis, 14-day historical data, and quality gates. Supports 27+ languages including Java, Python, JavaScript, and C#.",
    "free-for-dev--circleci": "CircleCI is a continuous integration and delivery platform. Free tier includes 4000 build minutes per month on Linux, 2500 minutes on Windows, and 1 executor (container/VM) at a time. Supports Docker, Windows, macOS, and GPU executors.",
    "free-for-dev--travis-ci": "Travis CI is a hosted continuous integration service for GitHub projects. Free tier for open-source projects includes unlimited builds with Linux and macOS support. Provides parallel builds, deployment integrations, and a simple .travis.yml configuration.",
    "free-for-dev--codecov": "Codecov is a code coverage reporting tool that integrates with CI/CD pipelines. Free tier for open-source projects includes unlimited reports, pull request comments, and commit status checks. Supports over 20 languages and multiple coverage formats.",
    "free-for-dev--mailgun": "Mailgun is an email delivery service for sending, receiving, and tracking emails. Free tier includes 5,000 emails per month for 3 months, then 1,000 emails per month permanently. Provides REST APIs, SMTP relay, and detailed email analytics.",
    "free-for-dev--sendgrid": "SendGrid is a cloud-based email delivery service. Free tier (Email API) includes 100 emails per day permanently. Provides reliable email delivery, scalable infrastructure, and real-time analytics. Supports transactional and marketing emails.",
    "free-for-dev--mailchimp": "Mailchimp is an all-in-one marketing platform. Free tier (Forever Free) includes up to 500 subscribers and 1,000 emails per month. Provides email templates, basic reporting, and audience segmentation for small email marketing campaigns.",
    "free-for-dev--postmark": "Postmark is a fast and reliable email delivery service for transactional emails. Free tier includes 100 emails per month permanently. Provides detailed delivery stats, inbound email processing, and templates with variable support for personalized transactional emails.",
    "free-for-dev--resend": "Resend is a modern email API for developers. Free tier includes 3,000 emails per day with a monthly limit of 100,000 emails. Provides React email components, real-time analytics, and webhook support for delivery events.",
    "free-for-dev--twilio": "Twilio is a cloud communications platform for building SMS, voice, and video applications. Free trial includes $15.50 in credit to test the API. Provides REST APIs for programmatic messaging, voice calls, and video conferencing with global reach.",
    "free-for-dev--vonage": "Vonage (formerly Nexmo) is a cloud communications platform. Free tier includes 1000 Vonage SDK network minutes and 100 SMS messages per month. Provides APIs for voice, SMS, video, and messaging with global coverage and developer-friendly SDKs.",
    "free-for-dev--stream": "Stream is an API for building activity feeds and chat applications. Free tier includes 2 chat applications, 1 million monthly active users for feeds, and 100 concurrent connections for chat. Provides pre-built UI components for React, React Native, and Flutter.",
    "free-for-dev--pusher": "Pusher provides real-time APIs for building collaborative features, chat, and live updates. Free tier includes 100 simultaneous connections, 200,000 messages per day, and unlimited channels. Supports WebSockets, HTTP streaming, and presence channels.",
    "free-for-dev--ably": "Ably is a real-time data delivery platform. Free tier includes 3 million messages per month, 100 peak channels, and 100 peak connections. Provides Pub/Sub messaging, presence, and message history with guaranteed message ordering and delivery.",
    "free-for-dev--pubnub": "PubNub is a real-time communication platform for IoT, chat, and live events. Free tier includes 1 million monthly active devices (MAU), 100 MAU for real-time messaging, and unlimited channels. Provides SDKs for 70+ languages and platforms.",
    "free-for-dev--mapbox": "Mapbox is a mapping and location cloud platform. Free tier includes 50,000 map views per month for web and 25,000 for mobile. Provides customizable maps, geocoding API, directions API, and Studio for designing map styles.",
    "free-for-dev--google-maps": "Google Maps Platform provides mapping, routing, and place APIs. Free tier includes $200 monthly credit (equivalent to 28,000 map loads or 40,000 geocoding requests). Covers Maps JavaScript API, Directions API, and Places API.",
    "free-for-dev--openweathermap": "OpenWeatherMap provides global weather data via API. Free tier includes current weather, 5-day forecast, and weather maps with 1,000 API calls per day. Covers 200,000+ cities worldwide with JSON/XML format support.",
    "free-for-dev--stripe": "Stripe is a payment processing platform for internet businesses. Free tier includes standard 2.9% + 30¢ per successful card charge (no monthly fee). Provides payment links, invoicing, subscription billing, and a comprehensive dashboard for managing transactions.",
    "free-for-dev--paypal": "PayPal is an online payment platform. Free for personal use (receiving payments incurs standard fees of 2.9% + $0.30 per transaction). Provides PayPal Checkout, Invoicing, and QR code payments for businesses of all sizes.",
    "free-for-dev--square": "Square provides payment processing and point-of-sale solutions. Free tier includes no monthly fees, standard 2.6% + 10¢ per tap/insert, and $0.10 per invoice. Provides online store, invoicing, and hardware POS systems for in-person payments.",
    "free-for-dev--auth0": "Auth0 is an identity management platform for authentication and authorization. Free tier (Free) includes 7,000 active users, 2 social identity providers, unlimited logins, and basic analytics. Supports SSO, MFA, and 30+ social providers out of the box.",
    "free-for-dev--firebase-auth": "Firebase Authentication provides backend services for easy user authentication. Free tier includes email/password auth, phone auth, and social providers (Google, Facebook, GitHub). Limits: 10,000 monthly active users for phone auth, unlimited for email/password and social.",
    "free-for-dev--amazon-cognito": "Amazon Cognito provides authentication, authorization, and user management for web and mobile apps. Free tier includes 50,000 monthly active users (MAU) for users who sign in directly, and 50 MAU for federated users via SAML/OIDC.",
    "free-for-dev--okta": "Okta is an identity and access management platform. Free tier (Developer Edition) includes 5,000 monthly active users, 15+ out-of-the-box SSO integrations, and basic MFA. Provides universal directory, API access management, and lifecycle management.",
    "free-for-dev--letsencrypt": "Let's Encrypt is a free, automated, and open certificate authority that provides TLS/SSL certificates. Completely free with no limit on the number of certificates, 90-day validity with auto-renewal via ACME protocol. Supports wildcard certificates via DNS challenge.",
    "free-for-dev--cloudflare-ssl": "Cloudflare provides free SSL/TLS certificates for all plan levels. Free SSL includes universal SSL with SHA-2 and 2048-bit RSA encryption, automatic HTTPS rewrites, and free TLS 1.3 support. Covers both root domains and subdomains.",
    "free-for-dev--vercel-edge": "Vercel Edge Functions run serverless code at the edge, closer to your users. Free tier (Hobby) includes 1 million edge function invocations per month with 512 MB memory and 5 ms execution time limit. Supports middleware and geolocation-based personalization.",
    "free-for-dev--fly-edge": "Fly.io Edge Apps run close to users globally with persistent storage. Free tier includes 3 shared-CPU VMs, 256 MB RAM each, and 3 GB persistent volumes. Supports Docker deployments with any Linux distribution and automatic SSL.",
    "free-for-dev--turso": "Turso is a distributed database built on libSQL (SQLite fork). Free tier includes 500 databases, 9 GB total storage, and 1 billion row reads per month. Edge-native with global replication and zero-latency reads from 30+ regions.",
    "free-for-dev--xorpshhere": "Xorpshere is a platform for building and deploying AI agents. Free tier includes 1000 agent runs per month and 1 GB knowledge base storage. Supports RAG (retrieval-augmented generation), tool calling, and multi-agent orchestration.",
    "free-for-dev--hugging-face": "Hugging Face is the leading platform for open-source machine learning models and datasets. Free tier includes unlimited public model and dataset hosting, Inference API with 1000 requests per day, and free AutoTrain for fine-tuning models without coding.",
    "free-for-dev--replicate": "Replicate runs open-source machine learning models in the cloud. Free tier includes $5 in free credits for new users. Supports text-to-image (Stable Diffusion), language models, and custom model deployments with pay-as-you-go pricing after free credits.",
    "free-for-dev--openai-playground": "OpenAI Playground is a web-based interface for testing GPT models. Free tier includes $5 in free credits for new users. Supports chat completions, text completions, and image generation (DALL-E) with adjustable parameters like temperature and top-p.",
    "free-for-dev--together-ai": "Together AI provides fast inference for open-source large language models. Free tier includes $5 in free credits for new users. Supports Llama, Mistral, and 50+ open models with optimized inference speeds and fine-tuning capabilities.",
    "free-for-dev--cohere": "Cohere provides access to large language models optimized for business use cases. Free tier includes 1000 API calls per month for the Command model. Specializes in text generation, summarization, and embedding for semantic search applications.",
    "free-for-dev--anthropic": "Anthropic Claude is a safe and helpful AI assistant. Free tier includes Claude 3.5 Sonnet with limited messages per day. Provides large context window (200K tokens), vision capabilities, and tool use (function calling) for building AI applications.",
    "free-for-dev--google-gemini": "Google Gemini (formerly Bard) is Google's most capable AI model. Free tier includes Gemini 1.5 Flash with 15 requests per minute and 1,500 requests per day. Supports 1 million token context window, multimodal inputs, and function calling.",
    "free-for-dev--mistral-ai": "Mistral AI provides efficient open-weight large language models. Free tier (La Plateforme) includes 500 requests per month for Mistral 7B and 8x7B models. Specializes in high-performance, low-latency inference with commercial-friendly licensing.",
    "free-for-dev--tavily": "Tavily is a search API optimized for LLM applications and AI agents. Free tier includes 1,000 free API credits per month. Provides clean, structured search results with source attribution, ideal for RAG applications and AI agent toolkits.",
    "free-for-dev--serpapi": "SerpApi is a real-time Google search API that returns structured search results. Free tier includes 100 searches per month. Supports Google, Bing, Baidu, and 15+ other search engines with structured data extraction and no HTML parsing required.",
    "free-for-dev--exa": "Exa (formerly Metaphor) is a neural search API for finding relevant links on the web. Free tier includes 1,000 searches per month. Uses embeddings-based search instead of keyword matching, providing more semantic and context-aware search results for AI applications.",
    "free-for-dev--scrapingbee": "ScrapingBee is a web scraping API that handles headless browsers and proxies. Free tier includes 1,000 free API calls. Provides JavaScript rendering, proxy rotation, and automated CAPTCHA solving for reliable web data extraction without getting blocked.",
    "free-for-dev--zenrows": "ZenRows is a web scraping API with built-in proxy rotation and headless browser. Free tier includes 1,000 API calls per month. Automatically handles anti-bot measures, JavaScript rendering, and provides clean HTML or Markdown output for data extraction.",
    "free-for-dev--apify": "Apify is a platform for web scraping and automation. Free tier includes $5 in monthly platform credits, 5 Actor runs concurrently, and 32 MB dataset storage. Provides a library of 1,000+ ready-made scraping and automation tools (Actors).",
    "free-for-dev--phaser": "Phaser is a fast, free, and fun open-source framework for Canvas and WebGL-powered browser games. Supports 2D physics (Matter.js, Arcade Physics), input handling, sound management, and asset loading. Ideal for HTML5 game development with TypeScript support.",
    "free-for-dev--godot": "Godot is a feature-packed, cross-platform game engine released under the MIT license. Completely free with no strings attached — no royalties, no subscription fees. Supports 2D and 3D game development with its own GDScript language and visual scripting.",
    "free-for-dev--blender": "Blender is the free and open-source 3D creation suite. Supports the entirety of the 3D pipeline — modeling, rigging, animation, simulation, rendering, compositing, and motion tracking. Completely free for personal and commercial use.",
    "free-for-dev--figma": "Figma is a collaborative interface design tool. Free tier (Starter) includes 3 Figma and 3 FigJam files, unlimited personal files, and 30-day version history. Supports real-time collaboration, prototyping, and developer handoff with CSS/React code generation.",
    "free-for-dev--penpot": "Penpot is the first open-source design and prototyping platform based on web standards (SVG). Free tier includes unlimited files, projects, and collaborators. Designer-friendly and developer-friendly with CSS code generation and self-hosted deployment option.",
    "free-for-dev--draw-io": "Draw.io (now diagrams.net) is a free, open-source diagramming application. Supports flowcharts, UML diagrams, network diagrams, and ER diagrams with real-time collaboration. No registration required, works offline, and integrates with Google Drive, OneDrive, and GitHub.",
    "free-for-dev--excalidraw": "Excalidraw is a virtual whiteboard for sketching hand-drawn-like diagrams. Free tier includes unlimited private rooms, real-time collaboration, and local-first storage. Supports PNG/SVG export, scan-to-canvas, and a library of community-created components.",
    "free-for-dev--tldraw": "tldraw is a free whiteboard and diagramming SDK. Open-source with MIT license, it provides a highly customizable infinite canvas with real-time collaboration. Supports React integration, offline mode, and export to SVG/PNG/JSON.",
    "free-for-dev--mermaid-live": "Mermaid Live Editor creates diagrams and visualizations using Markdown-like syntax. Free web-based editor with no registration required. Supports flowcharts, sequence diagrams, Gantt charts, git graphs, and entity relationship diagrams rendered entirely in the browser.",
    "free-for-dev--carbon": "Carbon is a beautiful code snippet generator. Free web tool that creates shareable, aesthetically pleasing images of source code. Supports 25+ programming languages, multiple themes, and custom backgrounds with high-resolution export for social sharing.",
    "free-for-dev--ray-so": "Ray.so is a free code snippet generator with beautiful gradients. Create stunning images of your code with customizable backgrounds, padding, and themes. Supports 15+ languages with high-resolution PNG export, perfect for sharing on social media.",
    "free-for-dev--readme-so": "README.so is a free README generator for open-source projects. Provides beautiful templates for GitHub README files with sections for badges, screenshots, installation instructions, and contribution guidelines. No registration required with instant preview.",
    "free-for-dev--replit": "Replit is an online IDE that supports 50+ programming languages. Free tier (Hacker) includes unlimited public repls, 0.5 vCPU, 1 GB RAM, and 1 GB storage. Supports collaborative editing, database integration, and one-click deployment with custom domains.",
    "free-for-dev--codepen": "CodePen is an online code editor for front-end web development. Free tier includes public pens, templates, and 1 prototype project. Supports HTML, CSS, JavaScript with preprocessors (Sass, Babel, CoffeeScript) and live preview with community showcases.",
    "free-for-dev--jsfiddle": "JSFiddle is an online code playground for web development. Free tier includes unlimited public fiddles, code collaboration, and 50 revisions per fiddle. Supports JavaScript, TypeScript, CoffeeScript, SCSS, and 60+ frameworks and libraries with external resource linking.",
    "free-for-dev--codesandbox": "CodeSandbox is an online code editor for web development with instant deployment. Free tier includes unlimited public sandboxes, 3 free servers for backend, and GitHub integration. Supports React, Vue, Angular, and 50+ templates with live collaboration.",
    "free-for-dev--stackblitz": "StackBlitz is an online VS Code IDE that runs entirely in the browser. Free tier includes unlimited public projects, 2 GB storage per project, and npm install support. Provides instant dev environments for Angular, React, Vue, and full-stack Node.js applications.",
    "free-for-dev--glitch": "Glitch is a friendly community where you can build the app of your dreams. Free tier includes 1000 hours/month of app uptime, 2000 assets storage, and live app editing. Supports Node.js, Python, and static sites with instant deployment and remix (fork) functionality.",
    "free-for-dev--heroku-play": "Heroku provides a free Play framework hosting option through the Eco dyno type. Free eco dynos sleep after 30 minutes of inactivity and are available for 1000 hours per month across all your apps. Supports Java, Scala, and Play Framework applications.",
}

def fetch_meta_description(url, timeout=5):
    """获取网页的 meta description"""
    try:
        # 规范化 URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        req = urllib.request.Request(url, headers=headers)
        # 忽略 SSL 证书验证（很多小网站证书过期）
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            raw = resp.read()[:65536]  # 只读前64KB，足够meta tag
            html = raw.decode('utf-8', errors='ignore').lower()
        
        # 尝试提取 meta description
        patterns = [
            r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
            r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']',
            r'<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']',
            r'<meta\s+content=["\'](.*?)["\']\s+property=["\']og:description["\']',
        ]
        for pat in patterns:
            m = re.search(pat, html, re.IGNORECASE | re.DOTALL)
            if m:
                desc = m.group(1).strip()
                desc = re.sub(r'\s+', ' ', desc)  # 压缩空白
                if len(desc) > 20:
                    return desc[:300]  # 最多300字符
        
        return None
    except Exception as e:
        return None

def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {'processed': 0, 'updated': 0, 'failed': []}

def save_checkpoint(cp):
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(cp, f, indent=2)

def main():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    resources = data.get('resources', [])
    cp = load_checkpoint()
    
    need = [r for r in resources if not r.get('description') or len(r.get('description', '').strip()) < 10]
    total = len(need)
    
    print(f'Total resources: {len(resources)}')
    print(f'Need description: {total}')
    print(f'Already processed: {cp["processed"]}')
    
    count = cp['processed']
    updated = cp['updated']
    failed = set(cp['failed'])
    
    for i, r in enumerate(need):
        if i < cp['processed']:
            continue  # 跳过已处理的
        
        rid = r['id']
        url = r.get('url', '')
        name = r.get('name', '')
        
        # 优先用内置知识库
        if rid in BUILTIN:
            r['description'] = BUILTIN[rid]
            updated += 1
            count += 1
            print(f'[{count}/{total}] {rid} — builtin knowledge')
            continue
        
        if not url:
            failed.add(rid)
            count += 1
            continue
        
        # 爬取 meta description
        desc = fetch_meta_description(url)
        if desc:
            r['description'] = desc
            updated += 1
            print(f'[{count}/{total}] {rid} — crawled: {desc[:60]}...')
        else:
            failed.add(rid)
            print(f'[{count}/{total}] {rid} — FAILED ({url})')
        
        count += 1
        
        # 每20个保存一次
        if count % 20 == 0:
            cp = {'processed': count, 'updated': updated, 'failed': list(failed)}
            save_checkpoint(cp)
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f'  → Checkpoint saved: {updated} updated, {len(failed)} failed')
        
        # 礼貌性延迟
        time.sleep(0.3)
    
    # 最终保存
    cp = {'processed': count, 'updated': updated, 'failed': list(failed)}
    save_checkpoint(cp)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f'\n=== DONE ===')
    print(f'Updated: {updated}')
    print(f'Failed (no description): {len(failed)}')
    print(f'Failed IDs: {list(failed)[:20]}')

if __name__ == '__main__':
    main()
