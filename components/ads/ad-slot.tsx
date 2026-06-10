"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  /** AdSense 广告单元 ID */
  slot: string;
  /** 广告格式：横幅/矩形/自适应 */
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  /** 是否全宽 */
  fullWidth?: boolean;
}

/**
 * AdSense 广告位组件
 *
 * 开发环境：显示占位符
 * 生产环境：加载 AdSense 广告
 *
 * 上线前替换：
 * 1. 在 <head> 中加入 AdSense JS
 * 2. 将 data-ad-slot 替换为真实 slot ID
 */
export default function AdSlot({
  slot,
  format = "auto",
  fullWidth = false,
}: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // 生产环境 + 已加载 AdSense SDK → 触发广告渲染
    if (
      process.env.NODE_ENV === "production" &&
      (window as any).adsbygoogle
    ) {
      try {
        ((window as any).adsbygoogle as any[]).push();
      } catch { /* silent */ }
    }
  }, []);

  // 开发/预览环境：显示占位符
  if (process.env.NODE_ENV !== "production") {
    const dims: Record<string, string> = {
      auto: "w-full h-24",
      rectangle: "w-72 h-60",
      horizontal: "w-full h-20",
      vertical: "w-40 h-96",
    };
    return (
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs ${dims[format] || dims.auto} ${fullWidth ? "w-full" : "mx-auto"}`}
      >
        <span>AdSense · {slot}</span>
      </div>
    );
  }

  // 生产环境：渲染 AdSense 广告
  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidth ? "true" : "false"}
    />
  );
}
