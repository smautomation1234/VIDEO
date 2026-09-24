"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResearchIndexPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/research/trends");
    }, [router]);
    return null;
}
