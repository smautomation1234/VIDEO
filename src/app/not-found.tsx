import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="card max-w-md w-full text-center py-12 px-8">
                <div className="w-14 h-14 rounded-full bg-sky-bg flex items-center justify-center mx-auto mb-5">
                    <Compass size={24} className="text-sky-ink" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Page not found</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    The page you are looking for does not exist or was moved during a recent update.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                    <Link href="/dashboard" className="btn-primary">Go home</Link>
                    <Link href="/create" className="btn-secondary">Browse tools</Link>
                </div>
            </div>
        </main>
    );
}
