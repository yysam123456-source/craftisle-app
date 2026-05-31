"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowLeftRight, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import dayjs from "dayjs";

export default function TimestampPage() {
  const [timestamp, setTimestamp] = useState("");
  const [dateTime, setDateTime] = useState<string>("");
  const [unit, setUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [currentTimestamp, setCurrentTimestamp] = useState("");

  useEffect(() => {
    // Initialize date time with current time
    setDateTime(dayjs().format("YYYY-MM-DDTHH:mm:ss"));
  }, []);

  useEffect(() => {
    const updateCurrent = () => {
      const now = Date.now();
      setCurrentTimestamp(
        unit === "seconds" ? Math.floor(now / 1000).toString() : now.toString()
      );
    };
    updateCurrent();
    const timer = setInterval(updateCurrent, 1000);
    return () => clearInterval(timer);
  }, [unit]);

  const handleUnitChange = (newUnit: "seconds" | "milliseconds") => {
    if (timestamp && !isNaN(Number(timestamp))) {
      const ts = Number(timestamp);
      if (unit === "seconds" && newUnit === "milliseconds") {
        setTimestamp((ts * 1000).toString());
      } else if (unit === "milliseconds" && newUnit === "seconds") {
        setTimestamp(Math.floor(ts / 1000).toString());
      }
    }
    setUnit(newUnit);
  };

  const timestampToDate = () => {
    if (!timestamp) {
      toast.warning("EnterTimestamp");
      return;
    }
    const ts = parseInt(timestamp);
    if (isNaN(ts)) {
      toast.error("Invalid timestamp");
      return;
    }
    const date = unit === "seconds" ? dayjs.unix(ts) : dayjs(ts);
    if (!date.isValid()) {
      toast.error("Invalid timestamp");
      return;
    }
    setDateTime(date.format("YYYY-MM-DDTHH:mm:ss"));
    toast.success("ConvertSuccess");
  };

  const dateToTimestamp = () => {
    if (!dateTime) {
      toast.warning("Please select date/time");
      return;
    }
    const date = dayjs(dateTime);
    const ts = unit === "seconds" ? date.unix() : date.valueOf();
    setTimestamp(ts.toString());
    toast.success("ConvertSuccess");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const setNow = () => {
    const now = dayjs();
    setDateTime(now.format("YYYY-MM-DDTHH:mm:ss"));
    const ts = unit === "seconds" ? now.unix() : now.valueOf();
    setTimestamp(ts.toString());
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TimestampConvert</h1>
          <p className="text-muted-foreground">
            Unix TimestampDateTimemutualConvert
          </p>
        </div>
      </div>

      {/* Current Timestamp */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Clock className="h-4 w-4" />
            CurrentTimestamp
          </CardTitle>
          <Tabs
            value={unit}
            onValueChange={(v) => handleUnitChange(v as "seconds" | "milliseconds")}
            className="w-45"
          >
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="seconds" className="text-xs">sec(s)</TabsTrigger>
              <TabsTrigger value="milliseconds" className="text-xs">ms(ms)</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="font-mono text-3xl font-bold text-primary tracking-wider">
              {currentTimestamp}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(currentTimestamp)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timestamp to Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Timestamp → DateTime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder={`InputTimestamp (${unit === "seconds" ? "sec" : "ms"})`}
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="pr-20 font-mono"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setTimestamp(currentTimestamp)}
                >
                  Use current
                </Button>
              </div>
            </div>
            <Button onClick={timestampToDate} className="w-full gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Convert to datetime
            </Button>
          </CardContent>
        </Card>

        {/* Date to Timestamp */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">DateTime → Timestamp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="datetime-local"
                  step="1"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <Button onClick={dateToTimestamp} className="w-full gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Convert to timestamp
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Result Display */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">ConvertResult</CardTitle>
          <Button variant="ghost" size="sm" onClick={setNow} className="gap-2 h-8">
            <RefreshCw className="h-3.5 w-3.5" />
            Set to current time
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <p className="text-xs text-muted-foreground">
                Timestamp ({unit === "seconds" ? "sec" : "ms"})
              </p>
              <div className="font-mono text-lg font-semibold truncate">
                {timestamp || "-"}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <p className="text-xs text-muted-foreground">
                DateTime
              </p>
              <div className="font-mono text-lg font-semibold truncate">
                {dateTime ? dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss") : "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Unix timestamp is the number of seconds since 1970-01-01 00:00:00 UTC</li>
                <li>Supports second and millisecond timestamp conversion</li>
                <li>JavaScript typically uses millisecond timestamps</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Backend languages (e.g., PHP, Python) typically use second timestamps</li>
                <li>Click "Use current" to quickly fill in current timestamp</li>
                <li>Supports copying current timestamp</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
