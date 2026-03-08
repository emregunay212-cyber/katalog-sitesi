import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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
  if (user.role !== "firma") {
    return NextResponse.json({ error: "Sadece firma hesabı düzenlenebilir." }, { status: 403 });
  }
  let body: { companyName?: string; name?: string; slug?: string; phone?: string; address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const updates: { companyName?: string | null; name?: string; slug?: string; phone?: string | null; address?: string | null } = {};
  if (body.companyName !== undefined) updates.companyName = body.companyName?.trim() || null;
  if (body.name !== undefined) {
    const n = body.name?.trim();
    if (!n) return NextResponse.json({ error: "Ad soyad boş olamaz." }, { status: 400 });
    updates.name = n;
  }
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (body.address !== undefined) updates.address = body.address?.trim() || null;
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
