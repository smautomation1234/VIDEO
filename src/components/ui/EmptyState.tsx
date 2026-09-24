import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-14 px-6">
            {Icon && (
                <div className="w-12 h-12 rounded-full bg-primary-muted flex items-center justify-center mb-4">
                    <Icon size={20} className="text-muted-foreground" />
                </div>
            )}
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="text-[0.8125rem] text-muted-foreground mt-1 max-w-xs leading-relaxed">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
