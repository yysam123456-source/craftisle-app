import { useState } from "react";
import { Users, Copy, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const FIRST = ["Ada", "Alan", "Grace", "Linus", "Marie", "Nikola", "Katherine", "Dennis", "Barbara", "Guido", "Margaret", "Ken"];
const LAST = ["Lovelace", "Turing", "Hopper", "Torvalds", "Curie", "Tesla", "Johnson", "Ritchie", "Liskov", "Rossum", "Hamilton", "Thompson"];
const DOMAINS = ["example.com", "mail.test", "demo.dev", "sample.org"];
const COMPANIES = ["Acme Inc", "Globex", "Initech", "Umbrella", "Hooli", "Stark Industries", "Wayne Corp"];
const CITIES = ["Springfield", "Riverside", "Fairview", "Greenville", "Madison", "Franklin"];
const STREETS = ["Main St", "Oak Ave", "Maple Rd", "Cedar Ln", "Park Blvd"];
const STREET_TYPES = ["", "#12", "#305", "Suite 4"];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const digits = (n: number): string =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

interface Record {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  address: string;
  date: string;
}

function makeRecords(n: number): Record[] {
  const rows: Record[] = [];
  for (let i = 1; i <= n; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const y = 2000 + Math.floor(Math.random() * 24);
    const mo = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
    const d = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
    rows.push({
      id: i,
      name: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase() + "@" + pick(DOMAINS),
      phone: `+1-${digits(3)}-${digits(3)}-${digits(4)}`,
      company: pick(COMPANIES),
      city: pick(CITIES),
      address: `${digits(3)} ${pick(STREETS)} ${pick(STREET_TYPES)}`.trim(),
      date: `${y}-${mo}-${d}`,
    });
  }
  return rows;
}

const FIELDS: (keyof Record)[] = ["id", "name", "email", "phone", "company", "city", "address", "date"];

export default function FakeDataGeneratorTool() {
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState("json");
  const [output, setOutput] = useState("");

  const generate = () => {
    const n = Math.max(1, Math.min(500, count || 1));
    const rows = makeRecords(n);
    if (format === "json") {
      setOutput(JSON.stringify(rows, null, 2));
    } else if (format === "csv") {
      const head = FIELDS.join(",");
      const body = rows.map((r) => FIELDS.map((f) => `"${String(r[f]).replace(/"/g, '""')}"`).join(",")).join("\n");
      setOutput(`${head}\n${body}`);
    } else {
      setOutput(rows.map((r, i) => `${i + 1}. ${r.name} <${r.email}> — ${r.company}, ${r.city}`).join("\n"));
    }
    toast.success(`Generated ${n} records`);
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const download = () => {
    if (!output) return;
    const ext = format === "csv" ? "csv" : format === "json" ? "json" : "txt";
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fake-data.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Fake Data Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Rows</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="text">Plain text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generate} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" /> Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Result</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copy}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={download}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea readOnly className="min-h-72 font-mono text-sm resize-y" value={output} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Fake Data</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Generates mock person records (name, email, phone, company, address, date) for testing
            and demos. All data is randomized locally and is not real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
