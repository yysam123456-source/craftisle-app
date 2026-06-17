import type { Metadata } from "next";
import ImageConvertClient from "./client";

export const metadata: Metadata = {
  title: "Image Converter - Craftisle Tools",
  description:
    "Convert images to different formats online for free. JPG, PNG, WebP, GIF, BMP. No upload needed.",
};

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
