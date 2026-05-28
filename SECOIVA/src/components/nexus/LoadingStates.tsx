import { Skeleton } from "@/components/ui/skeleton";

export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3"
        >
          <Skeleton className="h-3 w-20 bg-white/[0.04]" />
          <Skeleton className="h-7 w-24 bg-white/[0.06]" />
          <Skeleton className="h-2 w-full bg-white/[0.03]" />
        </div>
      ))}
    </div>
  );
}

export function RowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border border-white/[0.05] bg-white/[0.02] px-4 py-3"
        >
          <Skeleton className="h-8 w-8 rounded-full bg-white/[0.05]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3 bg-white/[0.06]" />
            <Skeleton className="h-2 w-1/2 bg-white/[0.03]" />
          </div>
          <Skeleton className="h-6 w-16 bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01]">
      <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1 max-w-sm">
        <div className="text-sm font-semibold">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}
