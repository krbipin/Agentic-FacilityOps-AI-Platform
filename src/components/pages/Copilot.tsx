"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { fetcher, type CopilotAgentsPayload } from "@/lib/api";

interface ChatStep {
  agent: string;
  step: string;
  detail: string;
}

interface ChatResponse {
  reply: string;
  agents_collaborated: number;
  reasoning: ChatStep[];
}

interface Message {
  id: number;
  role: "user" | "copilot";
  text: string;
  agents: string[];
  reasoning: ChatStep[];
  collaborated: number;
}

const EMPTY: CopilotAgentsPayload = { agents: [], facility_health: 0, correlations: [] };

const SUGGESTIONS = [
  "Summarize today's energy anomalies",
  "Which assets are at risk this week?",
  "How can I cut costs next quarter?",
  "Show me occupancy for the last 7 days",
];

const agentIcon: Record<string, IconName> = {
  "Energy Agent": "bolt",
  "Maintenance Agent": "wrench",
  "Occupancy Agent": "users",
  "Security Agent": "shield",
  "Cost Optimization Agent": "dollar",
  "Facility Intelligence Engine": "brain",
};

const agentColor: Record<string, string> = {
  "Energy Agent": "var(--color-primary)",
  "Maintenance Agent": "var(--color-alert-amber)",
  "Occupancy Agent": "var(--color-signal-green)",
  "Security Agent": "var(--color-alert-red)",
  "Cost Optimization Agent": "var(--color-violet)",
  "Facility Intelligence Engine": "var(--color-violet)",
};

export function Copilot() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const [data, setData] = useState<CopilotAgentsPayload>(EMPTY);
  const [railLoading, setRailLoading] = useState(true);
  const [railError, setRailError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      fetcher<CopilotAgentsPayload>("/api/copilot/agents")
        .then((d) => {
          if (cancelled) return;
          setData(d);
          setRailError(null);
        })
        .catch((e) => {
          if (!cancelled) setRailError(e instanceof Error ? e.message : "Request failed");
        })
        .finally(() => {
          if (!cancelled) setRailLoading(false);
        });
    };
    run();
    const id = window.setInterval(run, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activity]);

  const postChat = useCallback(async (message: string): Promise<ChatResponse> => {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    } finally {
      window.clearTimeout(timer);
    }
  }, []);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;
    const userMsg: Message = { id: nextId.current++, role: "user", text: q, agents: [], reasoning: [], collaborated: 0 };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const body = await postChat(q);
      setActivity(body.reasoning.map((r) => `${r.agent} → ${r.step}`));
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: "copilot",
          text: body.reply,
          agents: [...new Set(body.reasoning.map((r) => r.agent))],
          reasoning: body.reasoning,
          collaborated: body.agents_collaborated,
        },
      ]);
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "AbortError";
      toast(timedOut ? "Copilot timed out — cold agent startup can take ~30s. Try again." : "Agents offline — couldn't reach the backend", "error");
      setMessages((m) => [...m, { id: nextId.current++, role: "copilot", text: timedOut ? "I timed out waiting for the agents — they can take ~30s to spin up cold. Try again in a moment." : "Agents offline — I couldn't reach the backend. Try again in a moment.", agents: [], reasoning: [], collaborated: 0 }]);
    } finally {
      setSending(false);
      setActivity([]);
    }
  }, [sending, postChat, toast]);

  return (
    <div>
      <PageIntro
        title="Facility Copilot"
        subtitle={`${data.agents.length} agents standing by · Facility Intelligence Engine orchestrating`}
        agent="Facility Intelligence Engine"
        actions={
          <Button variant="secondary" size="sm" onClick={() => { setMessages([]); setActivity([]); toast("New conversation started"); }}>
            <Icon name="plus" size={14} /> New conversation
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <Card className="flex h-[60dvh] flex-col xl:h-[calc(100dvh-14rem)]">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-card bg-violet/15 text-violet">
                  <Icon name="brain" size={28} />
                </div>
                <div>
                  <p className="text-body-md font-semibold text-ice-white">Ask your building anything</p>
                  <p className="mt-1 text-caption text-steel-slate">Questions route to the right agents automatically</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-hairline-slate bg-elevated-slate px-4 py-2 text-caption text-steel-slate transition-colors hover:border-primary hover:text-ice-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-control px-4 py-3 ${m.role === "user" ? "bg-primary text-abyss-navy" : "border border-hairline-slate bg-elevated-slate"}`}>
                    <p className={`whitespace-pre-line text-body-sm ${m.role === "user" ? "font-medium" : "text-ice-white"}`}>{m.text}</p>
                    {m.role === "copilot" && (
                      <div className="mt-3 border-t border-hairline-slate pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {m.agents.map((a) => (
                            <Chip key={a} tone="steel">
                              <Icon name={agentIcon[a] ?? "cpu"} size={10} className={a in agentColor ? "text-inherit" : ""} /> {a.replace(" Agent", "")} ✓ consulted
                            </Chip>
                          ))}
                          {m.collaborated > 0 && <Chip tone="violet">{m.collaborated} agents collaborated</Chip>}
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-caption text-violet">Show reasoning</summary>
                          <ul role="list" className="mt-2 space-y-1.5">
                            {m.reasoning.map((r) => (
                              <li key={`${r.agent}-${r.step}`} className="text-caption text-steel-slate">
                                <span className="font-medium text-violet">{r.agent}:</span> {r.step} — {r.detail}
                              </li>
                            ))}
                            {m.reasoning.length === 0 && <li className="text-caption text-steel-slate/70">No reasoning trace for this reply.</li>}
                          </ul>
                        </details>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => toast("Create work order from chat isn't wired — use the Work Orders page", "info")}>
                            <Icon name="clipboard" size={12} /> Create work order
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => toast("Apply recommendation not available in this demo", "info")}>
                            <Icon name="sparkles" size={12} /> Apply recommendation
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-control border border-hairline-slate bg-elevated-slate px-4 py-3">
                    <span className="flex items-center gap-1.5 text-caption text-steel-slate">
                      <span className="size-2 animate-pulse rounded-full bg-primary" />
                      Agents working on it…
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-hairline-slate p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Ask about energy, assets, occupancy, security, or costs…"
                aria-label="Message"
                className="max-h-32 min-h-10 flex-1 resize-none rounded-control border border-hairline-slate bg-abyss-navy px-3 py-2.5 font-body-md text-body-md text-ice-white placeholder:text-steel-slate/50 focus:outline focus:outline-2 focus:outline-primary"
              />
              <Button type="submit" disabled={sending || !input.trim()} aria-label="Send">
                <Icon name="send" size={16} />
              </Button>
            </form>
            <p className="mt-2 text-caption text-steel-slate">Answers cite live data</p>
          </div>
        </Card>

        <Card className="flex flex-col xl:h-[calc(100dvh-14rem)]">
          <h3 className="px-5 pb-2 pt-4 font-section-header text-section-header uppercase tracking-wider text-steel-slate">Agent activity</h3>
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {railLoading ? (
              <div className="space-y-2 py-1">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : railError ? (
              <p className="pt-2 text-caption text-steel-slate">Agents unreachable — check the backend service.</p>
            ) : activity.length === 0 ? (
              <p className="pt-2 text-caption text-steel-slate/70">Idle — send a message to dispatch agents</p>
            ) : (
              activity.map((line, i) => (
                <p key={i} className="flex items-start gap-2 py-1.5 text-caption text-steel-slate">
                  <span className={line.toLowerCase().includes("dispatching") ? "text-violet" : "text-steel-slate"}>
                    <Icon name="cpu" size={12} />
                  </span>
                  {line}
                </p>
              ))
            )}
          </div>
          <div className="border-t border-hairline-slate px-5 py-4">
            <h4 className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Standing by</h4>
            {railLoading ? (
              <div className="mt-2 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : railError ? (
              <p className="mt-2 text-caption text-steel-slate">Agents unreachable — check the backend service.</p>
            ) : (
              <ul role="list" className="mt-2 space-y-2">
                {data.agents.map((a) => (
                  <li key={a.name} className="flex items-center gap-2">
                    <span className="rounded-md bg-panel-slate p-1.5" style={{ color: agentColor[a.name] ?? "var(--color-steel-slate)" }}>
                      <Icon name={agentIcon[a.name] ?? "cpu"} size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-caption text-ice-white">{a.name}</p>
                      <p className="truncate text-caption text-steel-slate/70">{a.insight}</p>
                    </div>
                    <span className={`size-2 rounded-full ${a.status === "coordinating" ? "bg-violet" : "bg-signal-green"}`} aria-hidden="true" />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-hairline-slate px-5 py-4">
            <div className="flex items-center justify-between">
              <h4 className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Facility health</h4>
              {!railLoading && !railError && <Chip tone="violet">{data.facility_health}/100</Chip>}
            </div>
            <h4 className="mt-3 font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Correlations</h4>
            {railLoading ? (
              <div className="mt-2 space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : railError ? (
              <p className="mt-2 text-caption text-steel-slate">Correlations unavailable.</p>
            ) : (
              <ul role="list" className="mt-2 space-y-1.5">
                {data.correlations.map((c) => (
                  <li key={c.pair} className="flex items-center justify-between gap-3 text-caption text-steel-slate">
                    <span className="min-w-0 truncate">{c.pair}</span>
                    <span className="shrink-0 font-mono text-violet">{c.r != null ? `r = ${c.r.toFixed(2)}` : (c.confidence ?? "—")}</span>
                  </li>
                ))}
                {data.correlations.length === 0 && <li className="text-caption text-steel-slate/70">No correlations computed yet</li>}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
