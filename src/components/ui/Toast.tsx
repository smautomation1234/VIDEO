"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastProps {
    message: string;
    tone?: ToastTone;
    onClose: () => void;
    duration?: number;
}

const TONE_STYLE: Record<ToastTone, { bg: string; ink: string; Icon: typeof CheckCircle2 }> = {
    success: { bg: "var(--sage-bg)", ink: "var(--sage-ink)", Icon: CheckCircle2 },
    error: { bg: "var(--rose-bg)", ink: "var(--rose-ink)", Icon: AlertCircle },
    info: { bg: "var(--sky-bg)", ink: "var(--sky-ink)", Icon: Info },
};

export default function Toast({ message, tone = "success", onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onClose, duration);
        return () => clearTimeout(t);
    }, [duration, onClose]);

    const { bg, ink, Icon } = TONE_STYLE[tone];

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-full shadow-md animate-fade-in"
            style={{ background: bg, color: ink }}
            role="status"
        >
            <Icon size={15} className="shrink-0" />
            <span className="text-[0.8125rem] font-medium">{message}</span>
            <button onClick={onClose} aria-label="Dismiss" className="ml-1 opacity-60 hover:opacity-100">
                <X size={13} />
            </button>
        </div>
    );
}
