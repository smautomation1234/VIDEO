"use client";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
    const control = (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="relative shrink-0 rounded-full transition-colors duration-200"
            style={{
                width: 40,
                height: 22,
                background: checked ? "var(--primary)" : "#D9D2C7",
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
                border: "none",
            }}
        >
            <span
                className="absolute top-[3px] left-[3px] rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ width: 16, height: 16, transform: checked ? "translateX(18px)" : "translateX(0)" }}
            />
        </button>
    );

    if (!label) return control;

    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            {control}
        </div>
    );
}
