import type { Metadata } from "next";

type Props = {
  params: Promise<{ tool: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  return {
    title: `TEST: ${tool} | Craftisle Free Tools`,
    description: `Test description for ${tool}`,
  };
}

export default async function ToolPage({ params }: Props) {
  const { tool } = await params;
  return (
    <div>
      <h1>Test Page: {tool}</h1>
      <a href="/tools">Back to tools</a>
    </div>
  );
}
