"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("alex.morgan@facilityops.ai");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function signIn() {
    setBusy(true);
    window.setTimeout(() => {
      localStorage.setItem("facilityops_session", JSON.stringify({ email, name: "Alex Morgan", role: "Facility Manager" }));
      router.push("/");
    }, 400);
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-[45%] flex-col justify-between border-r border-hairline-slate bg-abyss-navy p-10 lg:flex">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" width={34} height={34} aria-hidden="true">
            <polygon
              points="16,2 28,9 28,23 16,30 4,23 4,9"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <text
              x="16"
              y="21.5"
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill="#38BDF8"
              fontFamily="Inter, sans-serif"
            >
              F
            </text>
          </svg>
          <div>
            <p className="font-headline-lg-mobile text-headline-lg-mobile text-ice-white leading-tight">
              FacilityOps AI
            </p>
            <p className="font-caption text-caption text-steel-slate">
              Autonomous AI Agents for Smart, Secure &amp; Sustainable Facilities
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="font-headline-lg text-headline-lg text-ice-white">
            Agentic FacilityOps AI Platform
          </h1>
          <p className="mt-2 font-body-sm text-body-sm text-steel-slate">
            AI-Powered Building Operations &amp; Facility Intelligence System
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-signal-green" aria-hidden="true" />
            <div>
              <p className="font-label-caps text-label-caps text-steel-slate uppercase">Facility Health</p>
              <p className="font-data-table text-data-table text-ice-white">94/100</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-alert-amber" aria-hidden="true" />
            <div>
              <p className="font-label-caps text-label-caps text-steel-slate uppercase">Active Alerts</p>
              <p className="font-data-table text-data-table text-ice-white">4</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-signal-green" aria-hidden="true" />
            <div>
              <p className="font-label-caps text-label-caps text-steel-slate uppercase">Current Load</p>
              <p className="font-data-table text-data-table text-ice-white">1.28 MWh</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-abyss-navy px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Icon name="bolt" size={26} className="text-primary" />
            <div>
              <p className="font-headline-lg-mobile text-headline-lg-mobile text-ice-white leading-tight">
                FacilityOps AI
              </p>
              <p className="font-caption text-caption text-steel-slate">
                Agentic FacilityOps AI Platform
              </p>
            </div>
          </div>

          <div className="rounded-card bg-panel-slate glow-border panel-glow p-8">
            <h2 className="font-headline-lg text-headline-lg text-ice-white">
              Sign in to FacilityOps AI
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-steel-slate">Operator access only</p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); signIn(); }}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-10 rounded-control border border-hairline-slate bg-abyss-navy px-3 font-body-md text-body-md text-ice-white placeholder:text-steel-slate/50 focus:outline focus:outline-2 focus:outline-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">
                    Password
                  </label>
                  <a href="#" className="font-caption text-caption text-ice-white hover:text-primary">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 rounded-control border border-hairline-slate bg-abyss-navy px-3 font-data-table text-data-table text-ice-white placeholder:text-steel-slate/50 focus:outline focus:outline-2 focus:outline-primary"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 h-10 w-full rounded-control bg-primary font-body-md text-body-md font-semibold text-abyss-navy transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-60"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-hairline-slate" aria-hidden="true" />
                <span className="font-caption text-caption text-steel-slate">or</span>
                <div className="h-px flex-1 bg-hairline-slate" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={signIn}
                  className="h-10 flex-1 rounded-control border border-hairline-slate bg-panel-slate font-body-sm text-body-sm text-ice-white transition-colors hover:bg-elevated-slate"
                >
                  Continue with Microsoft
                </button>
                <button
                  type="button"
                  onClick={signIn}
                  className="h-10 flex-1 rounded-control border border-hairline-slate bg-panel-slate font-body-sm text-body-sm text-ice-white transition-colors hover:bg-elevated-slate"
                >
                  Continue with Google
                </button>
              </div>

              <a href="#" className="text-center font-caption text-caption text-steel-slate hover:text-ice-white">
                Emergency contact
              </a>
            </form>
          </div>

          <p className="mt-6 text-center font-caption text-caption text-steel-slate/70">
            SOC 2 Type II · Audited access ·{" "}
            <span className="font-data-table text-data-table">v2.4.0</span>
          </p>
        </div>
      </main>
    </div>
  );
}
