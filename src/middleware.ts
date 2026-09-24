import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_EMAIL = "princeguptaca9@gmail.com";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.redirect(new URL("/login", request.url));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ALLOWED_EMAIL) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = {
  matcher: [
    "/activity/:path*", "/ai-media/:path*", "/auto-dm/:path*", "/autopilot/:path*",
    "/carousel/:path*", "/content-engine/:path*", "/create/:path*", "/dashboard/:path*",
    "/geo-finance/:path*", "/hashtag-lab/:path*", "/instagram/:path*", "/linkedin/:path*",
    "/onboarding/:path*", "/performance/:path*", "/pitchdeck/:path*", "/plan/:path*",
    "/platforms/:path*", "/post-production/:path*", "/post/:path*", "/prompt-library/:path*",
    "/reels/:path*", "/repurpose/:path*", "/research/:path*", "/scripts/:path*",
    "/settings/:path*", "/studio/:path*", "/thumbnails/:path*", "/title-generator/:path*",
    "/tweet-carousel/:path*", "/upgrade/:path*", "/viral-grader/:path*", "/viralforge/:path*",
    "/x/:path*", "/youtube/:path*", "/youtube-strategy/:path*",
  ],
};
