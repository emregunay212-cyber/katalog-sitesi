import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

/** Parse one CSV line respecting quoted fields (e.g. "a;b";c) */
function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && c === sep) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/** Normalize header: Turkish or English -> key */
function headerToKey(h: string): "name" | "description" | "price" | null {
  const lower = h.toLowerCase().trim();
  if (lower === "ürün adı" || lower === "name" || lower === "urun_adi") return "name";
  if (lower === "açıklama" || lower === "description" || lower === "aciklama") return "description";
  if (lower === "fiyat" || lower === "price") return "price";
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id: catalogId } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id: catalogId, userId: user.id },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Dosya gönderilmedi veya format hatalı." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Lütfen bir CSV dosyası seçin." },
      { status: 400 }
    );
  }

  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
  if (!isCsv && !isXlsx) {
    return NextResponse.json(
      { error: "Sadece .csv veya .xlsx dosyaları kabul edilir." },
      { status: 400 }
    );
  }

  let headerCells: string[];
  let dataRows: string[][];

  if (isXlsx) {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const firstSheet = wb.SheetNames[0];
    if (!firstSheet) {
      return NextResponse.json(
        { error: "Excel dosyasında sayfa bulunamadı." },
        { status: 400 }
      );
    }
    const ws = wb.Sheets[firstSheet];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
    if (!Array.isArray(aoa) || aoa.length < 2) {
      return NextResponse.json(
        { error: "Excel en az başlık satırı ve bir veri satırı içermelidir." },
        { status: 400 }
      );
    }
    const toStr = (c: unknown) => (c == null ? "" : String(c)).trim();
    headerCells = (aoa[0] ?? []).map(toStr);
    dataRows = aoa.slice(1).map((row) => (Array.isArray(row) ? row : []).map(toStr));
  } else {
    let text: string;
    try {
      text = await file.text();
    } catch {
      return NextResponse.json(
        { error: "Dosya okunamadı. UTF-8 kodlamalı CSV kullanın." },
        { status: 400 }
      );
    }
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV en az başlık satırı ve bir veri satırı içermelidir." },
        { status: 400 }
      );
    }
    const sep = lines[0].includes(";") ? ";" : ",";
    headerCells = parseCsvLine(lines[0], sep);
    dataRows = lines.slice(1).map((line) => parseCsvLine(line, sep));
  }

  const colMap: { name?: number; description?: number; price?: number } = {};
  headerCells.forEach((h, i) => {
    const key = headerToKey(h);
    if (key) colMap[key] = i;
  });

  if (colMap.name == null || colMap.price == null) {
    return NextResponse.json(
      {
        error:
          "Başlık satırında 'Ürün adı' ve 'Fiyat' sütunları olmalı. Excel veya CSV şablonunu indirip onu düzenleyin.",
      },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  const toCreate: { name: string; description: string | null; price: number }[] = [];

  for (let row = 0; row < dataRows.length; row++) {
    const cells = dataRows[row] ?? [];
    const name = (cells[colMap.name] ?? "").trim().replace(/^"|"$/g, "");
    const description =
      colMap.description != null
        ? (cells[colMap.description] ?? "").trim().replace(/^"|"$/g, "") || null
        : null;
    const rawPrice = cells[colMap.price] ?? "";
    const priceStr = String(rawPrice)
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/\s*₺\s*$/i, "")
      .replace(/\s+/g, "")
      .replace(",", ".");

    if (!name) {
      errors.push(`Satır ${row + 2}: Ürün adı boş, atlandı.`);
      continue;
    }
    if (!priceStr) {
      continue;
    }
    const price = parseFloat(priceStr);
    if (Number.isNaN(price) || price < 0) {
      errors.push(`Satır ${row + 2}: Geçersiz fiyat "${rawPrice}", atlandı.`);
      continue;
    }
    toCreate.push({ name, description, price });
  }

  if (toCreate.length === 0) {
    return NextResponse.json({
      added: 0,
      totalRows: dataRows.length,
      errors: errors.slice(0, 20),
      message: errors.length ? "Hiçbir satır eklenemedi." : "Eklenebilir satır yok.",
    });
  }

  const maxOrder = await prisma.catalogItem.aggregate({
    where: { catalogId },
    _max: { orderIndex: true },
  });
  let nextIndex = (maxOrder._max.orderIndex ?? -1) + 1;

  for (const row of toCreate) {
    await prisma.catalogItem.create({
      data: {
        catalogId,
        name: row.name,
        description: row.description,
        price: row.price,
        imageUrl: null,
        orderIndex: nextIndex++,
      },
    });
  }

  return NextResponse.json({
    added: toCreate.length,
    totalRows: dataRows.length,
    errors: errors.slice(0, 20),
    message: `${toCreate.length} ürün eklendi. Resimleri isterseniz sonradan düzenleyerek yükleyebilirsiniz.`,
  });
}
