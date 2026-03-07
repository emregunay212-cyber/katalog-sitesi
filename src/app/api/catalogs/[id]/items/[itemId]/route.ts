import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id: catalogId, itemId } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id: catalogId, userId: user.id },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }
  const item = await prisma.catalogItem.findFirst({
    where: { id: itemId, catalogId },
  });
  if (!item) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }
  const body = await request.json();
  const updated = await prisma.catalogItem.update({
    where: { id: itemId },
    data: {
      name: body.name ?? item.name,
      description: body.description !== undefined ? body.description : item.description,
      price: body.price !== undefined ? Number(body.price) : item.price,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : item.imageUrl,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id: catalogId, itemId } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id: catalogId, userId: user.id },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }
  const item = await prisma.catalogItem.findFirst({
    where: { id: itemId, catalogId },
  });
  if (!item) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }
  await prisma.catalogItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
