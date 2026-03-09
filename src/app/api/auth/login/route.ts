import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gerekli." },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }
    const u = user as { id: string; email: string; name: string; slug: string; role?: string };
    const token = await createSession({
      id: u.id,
      email: u.email,
      name: u.name,
      slug: u.slug,
      role: u.role,
    });
    await setSessionCookie(token);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: (user as { role?: string }).role ?? "firma",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Giriş başarısız." }, { status: 500 });
  }
}
