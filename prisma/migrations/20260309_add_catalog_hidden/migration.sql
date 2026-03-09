-- Katalog gizleme özelliği
ALTER TABLE "Catalog" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
