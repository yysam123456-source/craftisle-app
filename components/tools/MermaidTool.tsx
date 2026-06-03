import MermaidClient from './MermaidClient'
import ToolDetailSections from "@/components/tools/ToolDetailSections";

export default function MermaidTool() {
  return (
    <>
      <MermaidClient />
      <ToolDetailSections toolId="mermaid" />
    </>
  );
}
