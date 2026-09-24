"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
    text: string;
    label?: string;
    className?: string;
}

export default function CopyButton({ text, label = "Copy", className = "" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    }

    return (
        <button onClick={handleCopy} className={`btn-secondary ${className}`} style={copied ? { background: "var(--sage-bg)", borderColor: "var(--sage)", color: "var(--sage-ink)" } : undefined}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : label}
        </button>
    );
}
