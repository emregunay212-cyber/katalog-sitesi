import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ catalog });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id, userId: user.id },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }
  const body = await request.json();
  const updated = await prisma.catalog.update({
    where: { id },
    data: {
      name: body.name ?? catalog.name,
      description: body.description !== undefined ? body.description : catalog.description,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : catalog.imageUrl,
    },
  });
  return NextResponse.json({ catalog: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id, userId: user.id },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }
  await prisma.catalog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
