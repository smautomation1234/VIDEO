"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: number;
}

export default function Modal({ open, onClose, title, children, footer, width = 520 }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" onClick={onClose} />
            <div
                className="relative bg-card border border-border rounded-2xl shadow-lg animate-fade-in w-full max-h-[85vh] flex flex-col"
                style={{ maxWidth: width }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h2 className="text-base font-semibold">{title}</h2>
                    <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-5 overflow-y-auto">{children}</div>
                {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">{footer}</div>}
            </div>
        </div>
    );
}
