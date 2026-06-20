"use client";

import { useEffect, useRef } from "react";

/**
 * 滚动触发动画 hook
 * 用法：const ref = useScrollAnimation();
 *       <section ref={ref as any}>...</section>
 * 元素进入视口时自动添加 `animate-fade-in-up` 类
 */
export function useScrollAnimation() {
  const ref = useRef<Element | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    // 也观察带 data-animate 的子元素
    el.querySelectorAll("[data-animate]").forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref as React.RefObject<any>;
}
