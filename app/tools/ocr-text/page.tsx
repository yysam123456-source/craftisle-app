import OCRTool from "@/components/tools/OCRTool";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Free Online OCR — Extract Text from Images AI Powered",
  description: "Free AI OCR online. Extract text from images using AI. Supports English, Chinese, Japanese, Korean, and 100+ languages. Copy or download extracted text. 100% browser-based, no upload.",
  canonical: "https://craftisle.com/tools/ocr-text",
});

export default function OCRTextPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          📝 AI OCR Text Extractor — Extract Text from Images
        </h1>
        <p className="mt-2 text-muted-foreground">
          Free AI OCR online. Extract text from images using AI. Supports English, Chinese,
          Japanese, Korean, and 100+ languages. 100% browser-based, no upload.
        </p>
      </div>
      <OCRTool />
    </main>
  );
}
