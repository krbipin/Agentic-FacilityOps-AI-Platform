import { Icon } from "@/components/ui/icons";

interface PageIntroProps {
  title: string;
  subtitle: string;
  agent?: string;
  live?: boolean;
  actions?: React.ReactNode;
}

export function PageIntro({ title, subtitle, agent, live = true, actions }: PageIntroProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-headline-lg font-semibold tracking-tight text-ice-white">{title}</h1>
        <p className="mt-1 flex items-center gap-2 text-body-sm text-steel-slate">
          {subtitle}
          {agent && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline-slate bg-elevated-slate px-2 py-0.5 text-caption text-steel-slate">
              <Icon name="cpu" size={12} />
              {agent}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline-slate bg-elevated-slate px-2.5 py-1 text-caption font-semibold uppercase tracking-wider text-signal-green">
            <span className="relative flex h-2 w-2">
              <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-signal-green" />
            </span>
            Live
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}
