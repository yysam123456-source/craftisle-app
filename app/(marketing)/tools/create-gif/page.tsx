import { CreateGifPage } from "@/components/tools/create-gif-page";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Animated GIF - Craftisle",
  description: "Create animated GIFs from multiple image frames. Free, no upload limits.",
};

export default function Page() {
  return (
    <>
      <CreateGifPage />
      <ToolDetailSections toolId="create-gif" />
    </>
  );
}
