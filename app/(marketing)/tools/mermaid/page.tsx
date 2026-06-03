import MermaidClient from './MermaidClient'
import ToolDetailSections from "@/components/tools/ToolDetailSections";

export default function MermaidPage() {
  return (
    <>
      <MermaidClient />
      <ToolDetailSections toolId="mermaid" />
    </>
  );
}
