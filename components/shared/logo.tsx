import type { SVGProps } from "react";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 40"
      fill="none"
      className={className}
      {...props}
    >
      {/* Craft — 深蓝（浅色模式）/ 青绿（暗色模式） */}
      <text
        x="4"
        y="30"
        fontFamily="'Cal Sans', 'Inter', system-ui, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill="#1E3A5F"
        className="dark:fill-[#00C9A7]"
        letterSpacing="-0.5"
      >
        Craft
      </text>

      {/* 宝石菱形 i 图标 */}
      <polygon
        points="96,8 104,16 96,26 88,16"
        fill="#00C9A7"
        stroke="#F0FDFA"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon
        points="96,10 101,16 96,23 91,16"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.7"
        opacity="0.5"
        strokeLinejoin="round"
      />
      <circle cx="96" cy="12" r="1.8" fill="#ffffff" opacity="0.7" />

      {/* isle — 青绿（浅色模式）/ 浅蓝白（暗色模式） */}
      <text
        x="110"
        y="30"
        fontFamily="'Cal Sans', 'Inter', system-ui, sans-serif"
        fontSize="28"
        fontWeight="400"
        fill="#00C9A7"
        className="dark:fill-[#F1F5F9]"
        letterSpacing="0.5"
      >
        isle
      </text>
    </svg>
  );
}

export function LogoCompact({ className, ...props }: SVGProps<SVGSVGElement>) {
  // 纯图标版，用于侧边栏折叠态、favicon 等小空间
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      {...props}
    >
      {/* 深蓝底（暗色模式下切换为青绿） */}
      <circle cx="16" cy="16" r="15" fill="#1E3A5F" className="dark:fill-[#00C9A7]" />
      <polygon
        points="16,6 24,14 16,26 8,14"
        fill="#00C9A7"
        stroke="#1E3A5F"
        strokeWidth="1.2"
        strokeLinejoin="round"
        className="dark:stroke-[#00C9A7]"
      />
      <polygon
        points="16,9 22,14 16,23 10,14"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.6"
        opacity="0.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="10" r="1.5" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}
