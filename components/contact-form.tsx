"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// 联系人收件邮箱（无后端方案：提交时构造 mailto，打开用户邮件客户端）
const CONTACT_EMAIL = "hello@craftisle.com";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();

    const mailSubject = subject
      ? `[Craftisle Contact] ${subject}`
      : "[Craftisle Contact] New message";
    const mailBody = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      message,
    ].join("\n");

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      mailSubject
    )}&body=${encodeURIComponent(mailBody)}`;

    window.location.href = mailto;
    // 稍作延迟以便邮件客户端唤起后恢复按钮状态
    setTimeout(() => setSubmitting(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Your name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="What is this about?"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Type your message here..."
          rows={5}
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Opening your email app…" : "Send Message"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Clicking “Send Message” opens your email app with the details pre-filled.
        You can also email us directly at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </form>
  );
}
