import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  let body: { companyName?: string; name?: string; slug?: string; phone?: string; address?: string; logoUrl?: string | null; email?: string; currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Müşteri: sadece ad, telefon, adres güncellenebilir
  if (user.role === "musteri") {
    const musteriUpdates: { name?: string; phone?: string | null; address?: string | null } = {};
    if (body.name !== undefined) {
      const n = body.name?.trim();
      if (!n) return NextResponse.json({ error: "Ad soyad boş olamaz." }, { status: 400 });
      musteriUpdates.name = n;
    }
    if (body.phone !== undefined) musteriUpdates.phone = body.phone?.trim() || null;
    if (body.address !== undefined) musteriUpdates.address = body.address?.trim() || null;
    if (Object.keys(musteriUpdates).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data: musteriUpdates });
    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        phone: (updated as unknown as { phone?: string | null }).phone ?? undefined,
        address: (updated as unknown as { address?: string | null }).address ?? undefined,
      },
    });
  }

  // Firma değilse erişim yok
  if (user.role !== "firma") {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const updates: { companyName?: string | null; name?: string; slug?: string; phone?: string | null; address?: string | null; logoUrl?: string | null; email?: string; password?: string } = {};
  if (body.companyName !== undefined) updates.companyName = body.companyName?.trim() || null;
  if (body.name !== undefined) {
    const n = body.name?.trim();
    if (!n) return NextResponse.json({ error: "Ad soyad boş olamaz." }, { status: 400 });
    updates.name = n;
  }
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (body.address !== undefined) updates.address = body.address?.trim() || null;
  if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl || null;
  if (body.email !== undefined) {
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { email, id: { not: user.id } } });
    if (existing) return NextResponse.json({ error: "Bu e-posta başka bir hesap tarafından kullanılıyor." }, { status: 400 });
    updates.email = email;
  }
  if (body.newPassword !== undefined) {
    if (!body.currentPassword) return NextResponse.json({ error: "Mevcut şifrenizi girin." }, { status: 400 });
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
    if (!dbUser || !(await verifyPassword(body.currentPassword, dbUser.password))) {
      return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
    }
    if (body.newPassword.length < 6) return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalı." }, { status: 400 });
    updates.password = await hashPassword(body.newPassword);
  }
  if (body.slug !== undefined) {
    const raw = body.slug?.trim();
    if (!raw) return NextResponse.json({ error: "Firma linki boş olamaz." }, { status: 400 });
    const slug = slugify(raw) || "firma";
    const existing = await prisma.user.findFirst({
      where: { slug, id: { not: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Bu link başka bir firma tarafından kullanılıyor. Farklı bir link seçin." }, { status: 400 });
    }
    updates.slug = slug;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updates,
  });
  const u = updated as { id: string; email: string; name: string; slug: string; role?: string; companyName?: string | null; phone?: string | null; address?: string | null };
  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      slug: u.slug,
      role: u.role,
      companyName: u.companyName ?? undefined,
      phone: u.phone ?? undefined,
      address: u.address ?? undefined,
    },
  });
}
