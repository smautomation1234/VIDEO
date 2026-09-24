interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`rounded-lg animate-pulse-soft ${className}`}
            style={{ background: "var(--muted)" }}
        />
    );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
    return (
        <div className="card space-y-3">
            <Skeleton className="h-4 w-1/3" />
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
            ))}
        </div>
    );
}
