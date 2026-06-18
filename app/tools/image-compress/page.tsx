import ImageCompressClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Image Compress - Craftisle Tools",
  description: "Compress images online for free. Reduce image file size without losing quality. Supports JPG, PNG, WebP.",
  canonical: "https://craftisle.com/tools/image-compress",
});

export default function ImageCompressPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🗜️ Image Compress
        </h1>
        <p className="mt-2 text-muted-foreground">
          Compress images online for free. Reduce file size without losing
          quality. Supports JPG, PNG, WebP.
        </p>
      </div>
      <ImageCompressClient />
    </main>
  );
}
