import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie, hashPassword } from "@/lib/auth";
import { randomBytes } from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

type GoogleUserInfo = { id: string; email: string; name?: string; picture?: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(new URL(`/giris?error=google_denied`, baseUrl));
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/giris?error=google_not_configured", baseUrl));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/giris?error=no_code", baseUrl));
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Google token error:", err);
    return NextResponse.redirect(new URL("/giris?error=token_failed", baseUrl));
  }
  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/giris?error=no_token", baseUrl));
  }

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userInfoRes.ok) {
    return NextResponse.redirect(new URL("/giris?error=userinfo_failed", baseUrl));
  }
  const googleUser = (await userInfoRes.json()) as GoogleUserInfo;
  const email = googleUser.email?.trim();
  const name = (googleUser.name || email?.split("@")[0] || "Kullanıcı").trim();
  if (!email) {
    return NextResponse.redirect(new URL("/giris?error=no_email", baseUrl));
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    let slug = "g-" + randomBytes(4).toString("hex");
    while (await prisma.user.findUnique({ where: { slug } })) {
      slug = "g-" + randomBytes(4).toString("hex");
    }
    const randomPassword = randomBytes(32).toString("hex");
    const hashed = await hashPassword(randomPassword);
    user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: "musteri",
        companyName: null,
        slug,
        phone: null,
        address: null,
      } as Parameters<typeof prisma.user.create>[0]["data"],
    });
  }

  const u = user as { id: string; email: string; name: string; role?: string };
  const token = await createSession({
    id: u.id,
    email: u.email,
    name: u.name,
  });
  await setSessionCookie(token);

  let from = "";
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      if (decoded.from && String(decoded.from).startsWith("/")) from = decoded.from;
    } catch {
      /* ignore */
    }
  }
  const redirectPath = from || (u.role === "musteri" ? "/" : "/panel");
  return NextResponse.redirect(new URL(redirectPath, baseUrl));
}
