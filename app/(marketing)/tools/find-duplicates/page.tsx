import { FindDuplicatesPage } from "@/components/tools/find-duplicates-page";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Duplicate Images - Craftisle",
  description: "Compare images and detect duplicates with perceptual hashing (aHash).",
};

export default function Page() {
  return (
    <>
      <FindDuplicatesPage />
      <ToolDetailSections toolId="find-duplicates" />
    </>
  );
}
