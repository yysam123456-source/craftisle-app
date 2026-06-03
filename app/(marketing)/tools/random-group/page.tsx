"use client";

import { useState } from "react";
import { Users, Shuffle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import ToolDetailSections from "@/components/tools/ToolDetailSections";
export default function RandomGroupPage() {
  const [namesText, setNamesText] = useState("");
  const [groupCount, setGroupCount] = useState(2);
  const [groups, setGroups] = useState<string[][]>([]);

  const handleShuffle = () => {
    const names = namesText
      .split(/[,\n，]+/)
      .map((n) => n.trim())
      .filter((n) => n !== "");

    if (names.length === 0) {
      toast.error("Enter member names");
      return;
    }

    if (groupCount <= 0) {
      toast.error("Group count must be greater than 0");
      return;
    }

    // Shuffle names
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    
    // Create groups
    const newGroups: string[][] = Array.from({ length: groupCount }, () => []);
    shuffled.forEach((name, index) => {
      newGroups[index % groupCount].push(name);
    });

    setGroups(newGroups.filter(g => g.length > 0));
    toast.success("Random grouping complete");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const formatGroupsText = () => {
    return groups
      .map((group, index) => `Group ${index + 1}:\n${group.join(", ")}`)
      .join("\n\n");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 shadow-lg">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Random Group Generator</h1>
          <p className="text-muted-foreground">Enter member names for fair random grouping</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">List & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Member list (newline or comma separated)</Label>
              <Textarea
                placeholder="Alice
Bob
Charlie
Diana..."
                className="min-h-50 font-mono"
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Number of groups</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="1"
                  value={groupCount}
                  onChange={(e) => setGroupCount(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <Button onClick={handleShuffle} className="flex-1 gap-2">
                  <Shuffle className="h-4 w-4" />
                  Group Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Group Result</CardTitle>
            {groups.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(formatGroupsText())}
              >
                <Copy className="h-4 w-4 mr-2" />
                CopyAll
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-125">
            {groups.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12 italic">
                <Shuffle className="h-12 w-12 mb-2 opacity-10" />
                <p>Click "Group Now" to view results</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {groups.map((group, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border border-muted-foreground/10 space-y-2">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-primary">Group {index + 1}</span>
                      <span className="text-xs text-muted-foreground">{group.length} members</span>
                    </div>
      <ToolDetailSections toolId="random-group" />
                    <div className="flex flex-wrap gap-2">
                      {group.map((name, ni) => (
                        <span key={ni} className="px-2 py-1 bg-background rounded border text-sm">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
