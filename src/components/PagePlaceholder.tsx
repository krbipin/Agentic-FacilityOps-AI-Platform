import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/misc";
import { Icon, type IconName } from "@/components/ui/icons";

export function PagePlaceholder({
  title,
  subtitle,
  phase,
  icon,
}: {
  title: string;
  subtitle: string;
  phase: string;
  icon: IconName;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-ice-white">{title}</h1>
          <p className="mt-1 font-body-sm text-body-sm text-steel-slate">{subtitle}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-control bg-panel-slate px-3 py-1.5 font-data-table text-data-table text-steel-slate glow-border">
          <Icon name={icon} size={15} className="text-primary" />
          {phase}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card bg-panel-slate glow-border p-card-padding">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="mb-2 h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-card bg-panel-slate glow-border p-6">
            <Skeleton className="mb-3 h-3 w-28" />
            <Skeleton className="mb-2 h-32 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 rounded-card bg-panel-slate glow-border px-6 py-10 text-center">
        <Icon name={icon} size={28} className="text-steel-slate" />
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-ice-white">
          Building this page now
        </h2>
        <p className="max-w-md font-body-sm text-body-sm text-steel-slate">
          {title} ships in {phase}. The AppShell, design system, and navigation are
          live — pages fill in as the platform builds out.
        </p>
        <Chip tone="blue">{phase}</Chip>
      </div>
    </div>
  );
}
