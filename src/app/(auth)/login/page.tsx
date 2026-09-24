"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const ALLOWED_EMAIL = "princeguptaca9@gmail.com";

export default function LoginPage() {
  const [state, setState] = useState<"idle" | "signing-in">("idle");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setState("signing-in");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: ALLOWED_EMAIL,
        password,
      });
      if (authError) throw authError;
      window.location.assign("/dashboard");
    } catch (caughtError) {
      setState("idle");
      setError(caughtError instanceof Error ? caughtError.message : "We could not sign you in. Please try again.");
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f5ef] text-[#1f1c16] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#27231d] p-12 text-[#fffdf7] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.13) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
        <div className="relative flex items-center gap-3 text-xl font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4c621] text-[#1f1c16]">✦</span> The Personal Brand</div>
        <div className="relative max-w-xl"><p className="mb-5 text-xs font-bold tracking-[.18em] text-[#f4c621]">PRIVATE WORKSPACE</p><h1 className="text-5xl font-semibold leading-[.98] tracking-[-.055em]">Your expertise in.<br />Your content engine on.</h1><p className="mt-7 text-lg leading-relaxed text-[#ddd7ca]">Research market signals, turn them into LinkedIn posts and short videos, then learn what gets attention — all from one workspace.</p></div>
        <div className="relative flex gap-6 text-sm text-[#ddd7ca]"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#f4c621]" /> Private access</span><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#f4c621]" /> Secure sign-in</span></div>
      </section>

      <section className="flex min-h-screen items-center justify-center p-6 sm:p-10"><div className="w-full max-w-md">
        <div className="mb-9 flex items-center gap-3 text-xl font-bold lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#27231d] text-white">✦</span> The Personal Brand</div>
        <div className="mb-8"><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4c621] text-[#1f1c16]"><ShieldCheck size={22} /></span><h2 className="mt-5 text-3xl font-semibold tracking-[-.045em]">Welcome back</h2><p className="mt-3 leading-relaxed text-[#706b61]">This workspace is restricted to its owner. Sign in with your issued workspace password to continue.</p></div>
        <form onSubmit={signIn} className="rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-[8px_8px_0_rgba(39,35,29,.08)] sm:p-8">
          <div className="rounded-xl bg-[#f4f1ea] p-4"><p className="text-xs font-bold tracking-[.12em] text-[#706b61]">APPROVED WORKSPACE EMAIL</p><p className="mt-2 flex items-center gap-2 font-medium"><Mail size={16} className="text-[#8a8478]" /> {ALLOWED_EMAIL}</p></div>
          <label className="mt-5 block text-sm font-semibold" htmlFor="workspace-password">Workspace password</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#ded8cc] px-4 focus-within:border-[#27231d] focus-within:ring-2 focus-within:ring-[#f4c621]"><LockKeyhole size={17} className="shrink-0 text-[#8a8478]" /><input id="workspace-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="min-w-0 flex-1 bg-transparent py-4 outline-none" placeholder="Enter your password" /></div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-[#fae1dc] px-4 py-3 text-sm leading-relaxed text-[#9d321d]">{error}</p>}
          <button type="submit" disabled={state === "signing-in" || !password} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#27231d] px-5 py-4 font-semibold text-white transition hover:bg-[#3a342b] disabled:cursor-not-allowed disabled:opacity-70">{state === "signing-in" ? "Signing in…" : "Sign in to workspace"}<ArrowRight size={18} /></button>
          <p className="mt-4 text-center text-xs leading-relaxed text-[#857f73]">Only the approved owner email can access this workspace.</p>
        </form>
      </div></section>
    </main>
  );
}
