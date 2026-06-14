import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImageInfoTool() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<Record<string, string>>({});

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        setInfo({
          "File Name": f.name,
          "File Size": `${(f.size / 1024).toFixed(2)} KB`,
          "File Type": f.type || "Unknown",
          "Width": `${img.width} px`,
          "Height": `${img.height} px`,
          "Aspect Ratio": `${(img.width / img.height).toFixed(2)}:1`,
          "Last Modified": new Date(f.lastModified).toLocaleString(),
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Image Info</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
        </div>
        {info.width && (
          <div className="space-y-2">
            <h3 className="font-medium">Image Information</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(info).map(([key, value]) => (
                    <tr key={key} className="border-b">
                      <td className="px-4 py-2 font-medium bg-muted/50">{key}</td>
                      <td className="px-4 py-2">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
