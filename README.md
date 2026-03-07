# Katalog & Sipariş Sitesi

Yerel firma için katalog paylaşımı ve sipariş yönetimi. Katalog sahibi katalog oluşturur, ürün ekler; müşteriler linke tıklayıp ürün seçerek sipariş verir. Siparişler katalog sahibinin panelinde listelenir.

## Özellikler

- **Firma (katalog sahibi):** Kayıt ol, giriş yap. **Tek firma linki:** Müşteriye `/firma/[slug]` linkini atarsınız; müşteri firmanın **tüm kategorilerini ve ürünlerini** görür.
- **Kategoriler (kataloglar):** Panelde "Kataloglarım" aslında kategorileriniz (örn. Kış Koleksiyonu, Aksesuar). Her kategoriye **resim** ekleyebilirsiniz.
- **Ürünler:** Her ürüne ad, fiyat, açıklama ve **resim** eklenebilir (yükleme: Panel → Katalog → Ürün Ekle → Resim Seç).
- **Müşteri:** Firma linkine gir → kategorilere göre ürünleri görür → sepete ekler → bilgilerini doldurur → sipariş verir.
- **Siparişler:** Tüm siparişler **Panel → Siparişler** sayfasında toplanır. Her siparişte hangi **kategoriden** hangi ürünlerin seçildiği gösterilir. **Bekleyen** ve **Tamamlanan / Geçmiş** siparişler ayrı bölümlerdedir; okundu işaretle, durum güncelle (beklemede / tamamlandı / iptal).

## Gereksinimler

- Node.js 18+
- npm

## Kurulum

1. Proje klasörüne girin:
   ```bash
   cd katalog-sitesi
   ```

2. Bağımlılıklar zaten yüklü. Veritabanı ilk kurulumda oluşturuldu (`prisma migrate dev`). Tekrar oluşturmak için:
   ```bash
   npx prisma migrate dev
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcıda **http://localhost:3000** adresine gidin.

## Kullanım

1. **Kayıt / Giriş:** Ana sayfadan "Kayıt Ol" ile hesap oluşturun (firma linki otomatik üretilir).
2. **Firma linki:** Panel ana sayfada "Firma linki" kutusunda tek link görünür (örn. `http://localhost:3000/firma/ahmet-yilmaz`). Bu linki müşteriye atın; müşteri **tüm kategorilerinizi ve ürünlerinizi** görür.
3. **Kategoriler:** Panel → "Yeni Katalog" → kategori adı, açıklama, isteğe bağlı **kategori resmi** (Katalog sayfasında "Resim yükle").
4. **Ürünler:** Her katalog (kategori) sayfasında "Ürün Ekle" ile ad, fiyat, açıklama ve **ürün resmi** (Resim: Seç) ekleyin.
5. **Sipariş:** Müşteri firma linkine girip kategorilere göre ürünleri görür, sepete ekler, "Sipariş Ver" ile bilgilerini doldurup gönderir.
6. **Siparişler:** Panel → **Siparişler** sayfasında tüm siparişler listelenir. Her satırda "[Kategori adı] Ürün × adet = tutar" şeklinde hangi kategoriden ne seçildiği görünür. **Bekleyen siparişler** ve **Tamamlanan / Geçmiş siparişler** ayrı bölümlerdedir; "Okundu işaretle", durum (Beklemede / Tamamlandı / İptal) kullanılır.

## Ortam Değişkenleri

- **.env** (proje kökünde):
  - `DATABASE_URL="file:./dev.db"` — SQLite veritabanı (varsayılan)
  - `SESSION_SECRET` — Oturum imzası için gizli anahtar (üretimde mutlaka değiştirin)

## Üretim (Production)

- `npm run build` ile derleyin, `npm start` ile çalıştırın.
- Aynı sunucuda veya yerel ağda çalıştırabilirsiniz; SQLite tek dosya olduğu için ek veritabanı sunucusu gerekmez.
- Üretimde `.env` içinde `SESSION_SECRET` değerini güçlü ve rastgele bir string yapın.

## Proje Yapısı (Kısa)

- `src/app/page.tsx` — Ana sayfa
- `src/app/giris`, `src/app/kayit` — Giriş / Kayıt
- `src/app/panel` — Katalog sahibi paneli (kataloglar, katalog detay, siparişler)
- `src/app/katalog/[slug]` — Müşteri katalog sayfası (ürünler, sepet, sipariş formu)
- `src/app/api/*` — Auth, kataloglar, ürünler, sipariş API’leri
- `prisma/schema.prisma` — Veritabanı şeması (User, Catalog, CatalogItem, Order, OrderItem)
