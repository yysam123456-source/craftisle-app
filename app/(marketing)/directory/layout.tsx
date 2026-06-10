import { ReactNode } from "react";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import AdSlot from "@/components/ads/ad-slot";

interface DirectoryLayoutProps {
  children: ReactNode;
}

export default function DirectoryLayout({ children }: DirectoryLayoutProps) {
  return (
    <div className="relative">
      {/* 顶部广告位 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <AdSlot slot="header-directory" format="horizontal" fullWidth />
      </div>

      {children}

      {/* 底部广告位 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdSlot slot="footer-directory" format="rectangle" />
      </div>

      {/* 浮动"提交资源"按钮 —— 已隐藏，需要时取消注释
      <a
        href="/directory/submit"
        className={cn(
          "fixed bottom-6 right-6 z-40",
          "inline-flex items-center gap-2",
          "bg-primary text-white",
          "px-5 py-3 rounded-full",
          "shadow-lg hover:shadow-xl",
          "hover:bg-primary/90",
          "transition-all duration-200",
          "text-sm font-medium",
        )}
        title="Submit a free or open-source resource"
      >
        <PlusCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Submit Resource</span>
      </a>
      */}
    </div>
  );
}
