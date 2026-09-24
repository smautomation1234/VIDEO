"use client";

import PageHeader from "@/components/ui/PageHeader";
import { HubTile } from "@/components/ui/Helpers";
import {
    PenLine,
    Type,
    Hash,
    RefreshCw,
    Layers,
    Twitter,
    Image as ImageIcon,
    Wand2,
    Film,
    Youtube,
    Newspaper,
    Rocket,
    Presentation,
    Flame,
} from "lucide-react";

const GROUPS: {
    title: string;
    blurb: string;
    tools: {
        href: string;
        icon: typeof PenLine;
        title: string;
        description: string;
        tone: "sage" | "rose" | "butter" | "lavender" | "sky";
        external?: boolean;
    }[];
}[] = [
    {
        title: "Write",
        blurb: "Scripts, hooks and captions for any platform.",
        tools: [
            { href: "/scripts", icon: PenLine, title: "Script Writer", description: "Reel, carousel and short-form video scripts.", tone: "sky" },
            { href: "/title-generator", icon: Type, title: "Hooks & Titles", description: "Scroll-stopping opening lines and titles.", tone: "lavender" },
            { href: "/hashtag-lab", icon: Hash, title: "Hashtag Lab", description: "Balanced hashtag sets tuned per platform.", tone: "sage" },
            { href: "/repurpose", icon: RefreshCw, title: "Repurpose", description: "Turn one piece into a full asset pack.", tone: "butter" },
        ],
    },
    {
        title: "Design visuals",
        blurb: "Carousels, covers and AI imagery.",
        tools: [
            { href: "/carousel", icon: Layers, title: "Carousel Studio", description: "Multi-slide carousels with live preview and export.", tone: "rose" },
            { href: "/tweet-carousel", icon: Twitter, title: "Tweet Carousel", description: "Turn tweets into beautiful screenshot carousels.", tone: "sky" },
            { href: "/thumbnails", icon: ImageIcon, title: "Thumbnails & Covers", description: "Click-worthy thumbnails generated from your topic.", tone: "butter" },
            { href: "/ai-media", icon: Wand2, title: "AI Media Studio", description: "Generate images, audio and visual assets.", tone: "lavender" },
        ],
    },
    {
        title: "Make videos",
        blurb: "Short-form video, start to finish.",
        tools: [
            { href: "/reels", icon: Film, title: "Reels Maker", description: "Scene-by-scene reels with visuals and voiceover.", tone: "sage" },
            { href: "/youtube", icon: Youtube, title: "YouTube Shorts", description: "Create AI shorts and publish to your channel.", tone: "rose" },
            { href: "/geo-finance", icon: Newspaper, title: "News Explainers", description: "Turn world events into simple explainer slides.", tone: "sky" },
        ],
    },    {
        title: "Guided flows",
        blurb: "Step-by-step workflows that do the heavy lifting.",
        tools: [
            { href: "/autopilot", icon: Rocket, title: "Personal Brand Engine", description: "Find a trend, generate the post, review and share.", tone: "lavender" },
            { href: "/pitchdeck", icon: Presentation, title: "Pitch Deck", description: "Investor-ready decks from a short brief.", tone: "butter" },
            { href: "/viralforge", icon: Flame, title: "Viral Forge", description: "Six research and remix tools in one suite.", tone: "sage" },
        ],
    },
];

export default function CreateHubPage() {
    return (
        <div className="animate-fade-in">
            <PageHeader
                eyebrow="Create"
                title="What are we making today?"
                description="Pick a tool. Every tool follows the same simple flow: describe what you need, review the result, save or export it."
            />
            <div className="space-y-10">
                {GROUPS.map((group) => (
                    <section key={group.title}>
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-foreground">{group.title}</h2>
                            <p className="text-[0.8125rem] text-muted-foreground">{group.blurb}</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {group.tools.map((tool) => (
                                <HubTile key={tool.href} {...tool} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
