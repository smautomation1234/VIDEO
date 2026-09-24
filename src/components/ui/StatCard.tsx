interface StatCardProps {
    label: string;
    value: React.ReactNode;
    hint?: string;
    icon?: React.ReactNode;
    tone?: "default" | "sage" | "butter" | "rose" | "lavender" | "sky";
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, { bg: string; ink: string }> = {
    default: { bg: "var(--muted)", ink: "var(--foreground)" },
    sage: { bg: "var(--sage-bg)", ink: "var(--sage-ink)" },
    butter: { bg: "var(--butter-bg)", ink: "var(--butter-ink)" },
    rose: { bg: "var(--rose-bg)", ink: "var(--rose-ink)" },
    lavender: { bg: "var(--lavender-bg)", ink: "var(--lavender-ink)" },
    sky: { bg: "var(--sky-bg)", ink: "var(--sky-ink)" },
};

export default function StatCard({ label, value, hint, icon, tone = "default" }: StatCardProps) {
    const t = TONES[tone];
    return (
        <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                {icon && (
                    <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: t.bg, color: t.ink }}>
                        {icon}
                    </span>
                )}
            </div>
            <div className="text-[1.375rem] font-bold text-foreground leading-tight">{value}</div>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
    );
}
