import ImageCompressClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Image Compressor Free — Compress JPG/PNG/WebP Online | Craftisle",
  description: "Free image compressor online. Compress JPG, PNG, WebP, AVIF with quality control. Reduce image file size without losing quality. 100% browser-based, no signup.",
  canonical: "https://craftisle.com/tools/image-compress",
});

export default function ImageCompressPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🗜️ Image Compressor — Compress JPG/PNG/WebP Online
        </h1>
        <p className="mt-2 text-muted-foreground">
          Free image compressor online. Compress JPG, PNG, WebP, AVIF with quality control. 
          Reduce image file size without losing quality. 100% browser-based, no signup.
        </p>
      </div>
      <ImageCompressClient />
    </main>
  );
}
