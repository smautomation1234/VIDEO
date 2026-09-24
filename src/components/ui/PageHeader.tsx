import React from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    eyebrow?: string;
}

export default function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
    return (
        <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                    {eyebrow && (
                        <p className="label-muted mb-1">{eyebrow}</p>
                    )}
                    <h1 className="text-[1.5rem] font-bold text-foreground leading-tight">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
