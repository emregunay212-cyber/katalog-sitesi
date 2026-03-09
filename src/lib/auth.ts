import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "default-secret-change-me"
);
const COOKIE_NAME = "katalog_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  slug?: string;
  role?: string;
  companyName?: string | null;
  phone?: string;
  address?: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    slug: user.slug,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      slug: (payload.slug as string) || undefined,
      role: (payload.role as string) || undefined,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });
  const u = user as { id: string; email: string; name: string; slug: string; role?: string; companyName?: string | null; phone?: string | null; address?: string | null };
  return user
    ? {
        id: u.id,
        email: u.email,
        name: u.name,
        slug: u.slug,
        role: u.role,
        companyName: u.companyName ?? undefined,
        phone: u.phone ?? undefined,
        address: u.address ?? undefined,
      }
    : null;
}
