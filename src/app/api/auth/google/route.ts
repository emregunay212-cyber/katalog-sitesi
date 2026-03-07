import { NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SCOPES = "openid email profile";

export async function GET(request: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(new URL("/giris?error=google_not_configured", request.url));
  }
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const state = Buffer.from(JSON.stringify({ from })).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return NextResponse.redirect(url.toString());
}
