import ImageConvertClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Image Converter - Craftisle Tools",
  description: "Convert images to different formats online for free. JPG, PNG, WebP, GIF, BMP. No upload needed.",
  canonical: "https://craftisle.com/tools/image-convert",
});

export default function ImageConvertPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🔄 Image Converter
        </h1>
        <p className="mt-2 text-muted-foreground">
          Convert images to different formats online for free. JPG, PNG,
          WebP, GIF, BMP. No upload to server — all processing happens in your
          browser.
        </p>
      </div>
      <ImageConvertClient />
    </main>
  );
}
