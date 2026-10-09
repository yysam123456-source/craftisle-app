"use client";

/**
 * 静态段 client —— 委托给共享组件。
 *
 * 🔴 2026-10-09：此前这里有一份独立的 ImageCompressClient 副本，而
 * app/tools/image-compress/page.tsx 是静态段、优先于 app/tools/[tool] 动态段
 * ⇒ `/components/tools/ImageCompressTool.tsx` 里注册的组件在这个 URL 上
 * **从未被渲染**（幽灵组件）。两份实现必然漂移，现改为单一来源。
 */
export { default } from "@/components/tools/ImageCompressTool";
