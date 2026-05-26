import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiny World Builder - 在线游戏",
  description: "建造你的迷你世界",
};

export default function TinyWorldBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
