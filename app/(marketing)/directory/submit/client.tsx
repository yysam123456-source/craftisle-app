"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GlassCard
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

const CATEGORIES = [
  "AI Tools",
  "Development Tools",
  "Design Tools",
  "Productivity",
  "Communication",
  "File Storage",
  "Self-Hosted",
  "API & Data",
  "Other",
];

export default function SubmitResourcePage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    category: "",
    githubUrl: "",
    email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.url) {
      setError("Resource name and URL are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/directory/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Submission Received!</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Thank you for submitting <strong>{form.name}</strong>. We'll review it and
          get back to you within 2-3 business days.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/directory")}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Back to Directory
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({
                name: "", url: "", description: "",
                category: "", githubUrl: "", email: "",
              });
            }}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-3xl font-bold mb-2">Submit a Resource</h1>
      <p className="text-gray-600 mb-8">
        Know a great free or open-source tool? Share it with the Craftisle community.
      </p>

      <GlassCard className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 资源名称 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Resource Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. VS Code"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Website URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="What does this tool do? Why is it useful?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              GitHub URL <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={form.githubUrl}
              onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Your Email <span className="text-gray-400 text-xs">(optional, for updates)</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Submitting..." : <>Submit Resource <Send className="w-4 h-4" /></>}
          </button>
        </form>
      </GlassCard>

      {/* 说明 */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        By submitting, you agree that the resource is free or open-source.
        We review all submissions before publishing.
      </p>
    </div>
  );
}
