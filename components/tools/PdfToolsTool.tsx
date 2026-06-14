"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PdfToolsTool() {
  const [file, setFile] = useState<File | null>(null);
  const [action, setAction] = useState<"merge" | "split" | "compress">("merge");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setFile(uploadedFile);
    }
  };

  const handleProcess = () => {
    if (!file) return;
    // Simplified - full PDF processing would require pdf-lib or similar
    alert("PDF processing requires pdf-lib library. This is a simplified version.");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">PDF Tools</h1>
      
      <Card className="p-6">
        <Tabs value={action} onValueChange={(v) => setAction(v as "merge" | "split" | "compress")}>
          <TabsList className="mb-4">
            <TabsTrigger value="merge">Merge PDFs</TabsTrigger>
            <TabsTrigger value="split">Split PDF</TabsTrigger>
            <TabsTrigger value="compress">Compress PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="merge">
            <div className="mb-4">
              <Label>Select PDF Files</Label>
              <Input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Select multiple PDF files to merge into one
              </p>
            </div>
          </TabsContent>

          <TabsContent value="split">
            <div className="mb-4">
              <Label>Select PDF File</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Split PDF into individual pages
              </p>
            </div>
          </TabsContent>

          <TabsContent value="compress">
            <div className="mb-4">
              <Label>Select PDF File</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Reduce PDF file size while maintaining quality
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleProcess} disabled={!file} className="mt-4">
          Process PDF
        </Button>
      </Card>
    </div>
  );
}
