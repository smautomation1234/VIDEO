"use client";

import { SectionNav } from "@/components/ui/SectionNav";
import PageHeader from "@/components/ui/PageHeader";

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-fade-in">
            <PageHeader
                eyebrow="Performance"
                title="How your content is doing"
                description="Track results, audit a profile or post, and get a weekly summary of what worked."
            />
            <SectionNav
                items={[
                    { href: "/performance", label: "Overview" },
                    { href: "/performance/channel-audit", label: "Profile & post audit" },
                    { href: "/performance/weekly-report", label: "Weekly report" },
                ]}
            />
            {children}
        </div>
    );
}
