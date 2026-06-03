"use client";

import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const QUICK_PROMPTS = [
  "What should I review first?",
  "Show me onboarding blockers",
  "How do I reset demo data?",
];

function buildAssistantReply(raw: string): string {
  const text = raw.toLowerCase();

  if (text.includes("reset")) {
    return "Use Test Center > Reset Demo Story Data to restore the full demo baseline in one click.";
  }

  if (text.includes("request") || text.includes("approval")) {
    return "Start with Access Requests to unblock intake, then move to submitted questionnaires for closure.";
  }

  if (text.includes("questionnaire")) {
    return "Open Questionnaires to review submitted packets first, then draft items that need supplier follow-up.";
  }

  if (text.includes("dashboard") || text.includes("blocker")) {
    return "The reviewer dashboard highlights queue pressure. Prioritize access approvals when queue is above moderate.";
  }

  if (text.includes("profile") || text.includes("capabilities") || text.includes("certification")) {
    return "Use Profile, Capabilities, and Certifications pages to verify supplier readiness before final approvals.";
  }

  return "I can help with triage, review flow, and demo navigation. Try asking about requests, questionnaires, or demo reset.";
}

export function FloatingChatAgent() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "seed-1",
      role: "assistant",
      text: "Hi, I am your demo assistant. Ask me for review priorities or use quick prompts below.",
    },
  ]);

  const canSend = input.trim().length > 0;

  const jumpLinks = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Access Requests", href: "/admin/requests" },
      { label: "Questionnaires", href: "/questionnaires" },
      { label: "Test Center", href: "/test-center" },
    ],
    []
  );

  function submitMessage(text: string) {
    const message = text.trim();
    if (!message) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: message,
    };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: buildAssistantReply(message),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/15 p-1.5 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Supplier Hub Assistant</p>
                <p className="text-xs text-muted-foreground">Demo copilot for walkthroughs</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                  m.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-primary text-primary-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  onClick={() => submitMessage(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mb-2 flex flex-wrap gap-1.5">
              {jumpLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  onClick={() => router.push(link.href)}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about demo flow..."
                aria-label="Assistant prompt"
              />
              <Button size="icon" type="submit" disabled={!canSend} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg"
          size="icon"
          aria-label="Open chat assistant"
          title="Open chat assistant"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
