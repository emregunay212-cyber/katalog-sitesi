import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, companyName, role, phone, address } = body;
    const isMusteri = role === "musteri";
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "E-posta, şifre ve ad soyad gerekli." },
        { status: 400 }
      );
    }
    if (!isMusteri && !companyName?.trim()) {
      return NextResponse.json(
        { error: "Firma adı gerekli." },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 400 }
      );
    }
    const hashed = await hashPassword(password);
    let finalSlug: string;
    if (isMusteri) {
      let slug = "m-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      while (await prisma.user.findUnique({ where: { slug } })) {
        slug = "m-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      }
      finalSlug = slug;
    } else {
      const firmaAdi = companyName?.trim() || name.trim();
      const userSlug = slugify(firmaAdi) || "firma";
      let suffix = 0;
      while (await prisma.user.findUnique({ where: { slug: suffix ? `${userSlug}-${suffix}` : userSlug } })) {
        suffix++;
      }
      finalSlug = suffix ? `${userSlug}-${suffix}` : userSlug;
    }
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name.trim(),
        role: isMusteri ? "musteri" : "firma",
        companyName: isMusteri ? null : (companyName?.trim() || null),
        slug: finalSlug,
        phone: isMusteri ? (phone?.trim() || null) : null,
        address: isMusteri ? (address?.trim() || null) : null,
      } as { email: string; password: string; name: string; companyName: string | null; slug: string },
    });
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kayıt başarısız." }, { status: 500 });
  }
}
