"use client";

import Link from "next/link";
import { Radar } from "lucide-react";
import { SectionNav } from "@/components/ui/SectionNav";
import PageHeader from "@/components/ui/PageHeader";

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-fade-in">
            <PageHeader
                eyebrow="Research"
                title="Find your next idea"
                description="Live trends for right now, durable ideas for later, and a look at what competitors are doing."
            />
            <SectionNav
                items={[
                    { href: "/research/trends", label: "Today's trends" },
                    { href: "/research/evergreen", label: "Evergreen ideas" },
                    { href: "/research/ideas", label: "Competitor spy" },
                ]}
            />
            <Link
                href="/content-engine"
                className="inline-flex items-center gap-1.5 mb-6 text-[0.8125rem] font-semibold rounded-full px-3.5 py-1.5 transition-transform hover:scale-[1.02]"
                style={{ background: "var(--sky-bg)", color: "var(--sky-ink)", border: "1px solid var(--sky)", textDecoration: "none" }}
            >
                <Radar size={13} />
                Need a full opportunity report? Open the Content Engine
            </Link>
            {children}
        </div>
    );
}
