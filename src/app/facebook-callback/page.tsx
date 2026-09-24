"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FacebookCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Connecting Facebook...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      router.replace("/settings/connections?fb_error=access_denied");
      return;
    }

    fetch("/api/auth/facebook/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("Connected! Redirecting...");
          router.replace("/settings/connections?connected=facebook");
        } else {
          console.error("FB exchange error:", data);
          // Pass the real error detail so it's visible in the URL
          const errMsg = encodeURIComponent(
            data.details || data.error || "failed"
          );
          router.replace(`/settings/connections?fb_error=${errMsg}`);
        }
      })
      .catch((err) => {
        router.replace(`/settings/connections?fb_error=${encodeURIComponent(err.message || "network_error")}`);
      });
  }, []);


  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>{status}</p>
        <p style={{ fontSize: "0.875rem", color: "#888", marginTop: "0.5rem" }}>Please wait while we complete your Facebook connection.</p>
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f" }}>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    }>
      <FacebookCallbackInner />
    </Suspense>
  );
}
