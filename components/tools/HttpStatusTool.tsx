import { useMemo, useState } from "react";
import { Search, Globe2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Status {
  code: number;
  name: string;
  desc: string;
}

const STATUSES: Status[] = [
  { code: 100, name: "Continue", desc: "The server has received the request headers; the client should proceed to send the body." },
  { code: 101, name: "Switching Protocols", desc: "The requester asked to switch protocols and the server agreed." },
  { code: 200, name: "OK", desc: "The request succeeded and the response contains the result." },
  { code: 201, name: "Created", desc: "The request succeeded and a new resource was created." },
  { code: 202, name: "Accepted", desc: "The request has been accepted for processing but is not complete." },
  { code: 204, name: "No Content", desc: "The request succeeded but there is no content to return." },
  { code: 206, name: "Partial Content", desc: "The server is delivering only part of the resource (range request)." },
  { code: 301, name: "Moved Permanently", desc: "The resource has permanently moved to a new URL." },
  { code: 302, name: "Found", desc: "The resource temporarily resides at a different URL." },
  { code: 303, name: "See Other", desc: "The response can be found under a different URL using GET." },
  { code: 304, name: "Not Modified", desc: "The cached copy is still valid; no need to retransmit." },
  { code: 307, name: "Temporary Redirect", desc: "The resource temporarily moved; preserve the HTTP method." },
  { code: 308, name: "Permanent Redirect", desc: "The resource permanently moved; preserve the HTTP method." },
  { code: 400, name: "Bad Request", desc: "The server cannot process the request due to a client error." },
  { code: 401, name: "Unauthorized", desc: "Authentication is required and has failed or not been provided." },
  { code: 403, name: "Forbidden", desc: "The server understood the request but refuses to authorize it." },
  { code: 404, name: "Not Found", desc: "The requested resource could not be found." },
  { code: 405, name: "Method Not Allowed", desc: "The request method is not supported for this resource." },
  { code: 408, name: "Request Timeout", desc: "The server timed out waiting for the request." },
  { code: 409, name: "Conflict", desc: "The request conflicts with the current state of the resource." },
  { code: 410, name: "Gone", desc: "The resource is no longer available and will not be available again." },
  { code: 413, name: "Payload Too Large", desc: "The request body is larger than the server is willing to process." },
  { code: 415, name: "Unsupported Media Type", desc: "The payload format is not supported by the server." },
  { code: 418, name: "I'm a teapot", desc: "An April Fools' joke status code (RFC 2324)." },
  { code: 422, name: "Unprocessable Entity", desc: "The request was well-formed but contained semantic errors." },
  { code: 429, name: "Too Many Requests", desc: "The client has sent too many requests in a given time." },
  { code: 500, name: "Internal Server Error", desc: "The server encountered an unexpected condition." },
  { code: 501, name: "Not Implemented", desc: "The server does not support the requested functionality." },
  { code: 502, name: "Bad Gateway", desc: "The server, acting as a gateway, received an invalid response upstream." },
  { code: 503, name: "Service Unavailable", desc: "The server is temporarily unable to handle the request." },
  { code: 504, name: "Gateway Timeout", desc: "The upstream server failed to respond in time." },
  { code: 505, name: "HTTP Version Not Supported", desc: "The server does not support the HTTP version used in the request." },
];

const CLASS_COLOR = (code: number) => {
  if (code < 200) return "text-sky-600 bg-sky-50";
  if (code < 300) return "text-emerald-600 bg-emerald-50";
  if (code < 400) return "text-amber-600 bg-amber-50";
  if (code < 500) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
};

export default function HttpStatusTool() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return STATUSES;
    return STATUSES.filter(
      (x) => String(x.code).includes(s) || x.name.toLowerCase().includes(s) || x.desc.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" /> HTTP Status Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by code, name, or meaning (e.g. 404, timeout)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.code} className="flex items-start gap-3 rounded-lg border p-3">
                <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-sm font-semibold ${CLASS_COLOR(s.code)}`}>
                  {s.code}
                </span>
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No matching status code.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
