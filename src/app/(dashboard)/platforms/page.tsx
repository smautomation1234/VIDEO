"use client";

import PageHeader from "@/components/ui/PageHeader";
import { HubTile } from "@/components/ui/Helpers";
import {
    MessageCircle,
    Twitter,
    Instagram,
    Youtube,
    Zap,
} from "lucide-react";

const PLATFORMS = [
    {
        href: "/linkedin",
        icon: MessageCircle,
        title: "LinkedIn",
        description: "Authority posts, carousels and video scripts written in your voice.",
        tone: "sky" as const,
    },
    {
        href: "/x",
        icon: Twitter,
        title: "X (Twitter)",
        description: "Single posts and full threads built from live conversations.",
        tone: "lavender" as const,
    },
    {
        href: "/instagram",
        icon: Instagram,
        title: "Instagram",
        description: "Reel scripts, carousels, stories and captions that fit the format.",
        tone: "rose" as const,
    },
    {
        href: "/youtube-strategy",
        icon: Youtube,
        title: "YouTube",
        description: "Video titles, scripts, Shorts and descriptions from real search data.",
        tone: "butter" as const,
    },
];

const EXTRAS = [
    {
        href: "/auto-dm",
        icon: Zap,
        title: "Instagram Auto-DM",
        description: "Send a DM automatically when someone comments a keyword.",
        tone: "sage" as const,
        badge: "Automation",
    },
];

export default function PlatformsHubPage() {
    return (
        <div className="animate-fade-in">
            <PageHeader
                eyebrow="Platforms"
                title="Platform workspaces"
                description="Each workspace researches what is working on that platform right now, then writes content to match. Connect your account in Settings for personal reviews."
            />
            <section>
                <div className="grid gap-4 sm:grid-cols-2">
                    {PLATFORMS.map((p) => (
                        <HubTile key={p.href} {...p} />
                    ))}
                </div>
            </section>
            <section className="mt-10">
                <h2 className="text-base font-semibold text-foreground mb-1">Automations</h2>
                <p className="text-[0.8125rem] text-muted-foreground mb-4">Set it up once, let it run.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                    {EXTRAS.map((p) => (
                        <HubTile key={p.href} {...p} />
                    ))}
                </div>
            </section>
        </div>
    );
}
