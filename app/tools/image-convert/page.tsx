import ImageConvertClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Image Converter Free — Convert JPG/PNG/WebP/AVIF Online",
  description: "Free image converter online. Convert between JPG, PNG, WebP, AVIF, TIFF formats. Batch conversion supported. 100% browser-based, no signup required.",
  canonical: "https://craftisle.com/tools/image-convert",
});

export default function ImageConvertPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🔄 Image Converter — Convert JPG/PNG/WebP/AVIF Online
        </h1>
        <p className="mt-2 text-muted-foreground">
          Free image converter online. Convert between JPG, PNG, WebP, AVIF, TIFF formats. 
          Batch conversion supported. 100% browser-based, no signup.
        </p>
      </div>
      <ImageConvertClient />
    </main>
  );
}
