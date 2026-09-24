"use client";

import { SectionNav } from "@/components/ui/SectionNav";
import PageHeader from "@/components/ui/PageHeader";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-fade-in">
            <PageHeader
                eyebrow="Settings"
                title="Make The Personal Brand yours"
                description="Teach the AI your voice, connect your accounts, and set how you like to work."
            />
            <SectionNav
                items={[
                    { href: "/settings/brand", label: "Brand profile" },
                    { href: "/settings", label: "Preferences" },
                    { href: "/settings/connections", label: "Connections" },
                ]}
            />
            {children}
        </div>
    );
}
