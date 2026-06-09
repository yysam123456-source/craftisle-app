import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface TestSeoPageProps {
  params: Promise<{ tool: string }>;
}

export async function generateMetadata({ params }: TestSeoPageProps): Promise<Metadata> {
  const { tool } = await params;
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[TEST-SEO] generateMetadata called for:", tool);
  }
  return {
    title: `Test SEO - ${tool}`,
    description: `Test SEO page for ${tool}`,
  };
}

export default async function TestSeoPage({ params }: TestSeoPageProps) {
  const { tool } = await params;
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[TEST-SEO] Page rendered for:", tool);
  }

  if (tool === "notfound") {
    notFound();
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Test SEO Page</h1>
      <p>Tool: {tool}</p>
      <p>Check document.title and &lt;title&gt; tag</p>
    </div>
  );
}
