"use client";

import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, Unlock, Copy } from "lucide-react";
import { toast } from "sonner";
import ToolDetailSections from "@/components/tools/ToolDetailSections";

const ALGORITHMS = [
  { value: "AES", label: "AES" },
  { value: "DES", label: "DES" },
  { value: "TripleDES", label: "TripleDES" },
  { value: "Rabbit", label: "Rabbit" },
  { value: "RC4", label: "RC4" },
];

export default function AesDesPage() {
  const [input, setInput] = useState("");
  const [key, setKey] = useState("");
  const [algorithm, setAlgorithm] = useState("AES");
  const [output, setOutput] = useState("");

  const handleProcess = (mode: "encrypt" | "decrypt") => {
    if (!input) return;
    if (!key) {
        toast.error("Enter key");
        return;
    }

    try {
        let result = "";
        const algo = (CryptoJS as any)[algorithm];

        if (mode === "encrypt") {
            result = algo.encrypt(input, key).toString();
            toast.success("Encryption successful");
        } else {
            const bytes = algo.decrypt(input, key);
            result = bytes.toString(CryptoJS.enc.Utf8);
            if (!result) throw new Error("Decryption failed (wrong key?)");
            toast.success("Decryption successful");
        }
        setOutput(result);
    } catch (e: any) {
        toast.error("Process failed: " + e.message);
        setOutput("");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-rose-600 shadow-lg">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Symmetric Encrypt/Decrypt</h1>
          <p className="text-muted-foreground">Supports AES, DES, RC4, and other common symmetric encryption algorithms</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-8">
            <CardHeader>
                <CardTitle>Text Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Input Text (Plaintext or Ciphertext)</Label>
                    <Textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter..."
                        className="min-h-37.5 font-mono"
                    />
                </div>
                
                <div className="flex gap-4">
                    <Button onClick={() => handleProcess("encrypt")} className="flex-1 gap-2">
                        <Lock className="h-4 w-4" /> Encrypt
                    </Button>
                    <Button onClick={() => handleProcess("decrypt")} variant="secondary" className="flex-1 gap-2">
                        <Unlock className="h-4 w-4" /> Decrypt
                    </Button>
                </div>

                <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <Label>ProcessResult</Label>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output)} disabled={!output}>
                            <Copy className="h-4 w-4 mr-2" /> Copy
                        </Button>
                    </div>
                    <Textarea 
                        readOnly
                        value={output}
                        placeholder="Results will appear here..."
                        className="min-h-37.5 font-mono bg-muted/30"
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="md:col-span-4 h-fit">
            <CardHeader>
                <CardTitle>Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Algorithm</Label>
                    <Select value={algorithm} onValueChange={setAlgorithm}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ALGORITHMS.map(a => (
                                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Key (Passphrase)</Label>
                    <Input 
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter encryption/decryption key"
                    />
                    <p className="text-xs text-muted-foreground">
                        💡 Security Tip: All calculations are performed locally in your browser. Your key is never sent to any server.
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
    <ToolDetailSections toolId="aes-des" />
    </div>
  );
}
