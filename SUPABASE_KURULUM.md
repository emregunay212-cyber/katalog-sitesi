# Supabase ile Katalog Sitesi – Kurulum Rehberi

Bu rehber, projeyi **Supabase** (PostgreSQL) veritabanına bağlamanız ve **Vercel** üzerinde yayınlamanız için adım adım anlatır.

---

## 1. Supabase projesi oluşturma

1. [supabase.com](https://supabase.com) → **Start your project** → Giriş yapın.
2. **New project**:
   - **Name:** Örn. `katalog-sitesi`
   - **Database password:** Güçlü bir şifre belirleyin (kaydedin).
   - **Region:** **Europe (Frankfurt)** veya **Southeast Asia** – Türkiye için gecikme düşük olsun diye EU tercih edin.
3. **Create new project** ile projeyi oluşturun (birkaç dakika sürebilir).

---

## 2. Veritabanı bağlantı bilgisi

1. Sol menüden **Project Settings** (dişli) → **Database**.
2. **Connection string** bölümünde:
   - **URI** sekmesini seçin.
   - **Mode:** **Session** (connection pooling – Vercel için uygun).
   - Görünen adres şöyle olacak:
     ```txt
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
     ```
   - `[YOUR-PASSWORD]` kısmını proje oluştururken yazdığınız veritabanı şifresiyle değiştirin.
3. Bu tam adresi kopyalayın; sonuna `?pgbouncer=true` ekleyin (pooler kullanıyorsanız bazen gerekir). Örnek:
   ```txt
   postgresql://postgres.xxxxx:SIFRENIZ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

---

## 3. Projede ortam değişkenleri

### Yerel (bilgisayarınızda)

Proje kökündeki `.env` dosyasını açın (yoksa oluşturun). **SQLite** satırını kapatıp **Supabase** satırını kullanın:

```env
# Supabase (canlı / geliştirme)
DATABASE_URL="postgresql://postgres.XXXX:SIFRENIZ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Eski yerel SQLite (şu an kullanılmıyor)
# DATABASE_URL="file:./dev.db"

SESSION_SECRET="buraya-rastgele-uzun-bir-metin-yazin"

# Google ile giriş (isteğe bağlı)
# GOOGLE_CLIENT_ID="..."
# GOOGLE_CLIENT_SECRET="..."
```

`DATABASE_URL` içinde gerçek proje ref’i ve şifreyi kullanın.

### Tabloları oluşturma (ilk kez)

Terminalde proje kökünde:

```bash
npx prisma migrate deploy
```

Bu komut Supabase’deki boş veritabanında gerekli tabloları oluşturur.

Ardından Prisma client’ı güncelleyin:

```bash
npx prisma generate
```

Uygulamayı çalıştırın:

```bash
npm run dev
```

Tarayıcıda site açıldığında kayıt olup giriş yapabiliyorsanız Supabase bağlantısı çalışıyor demektir.

---

## 4. Vercel’de yayınlama

1. [vercel.com](https://vercel.com) → Giriş → **Add New** → **Project**.
2. Bu projeyi GitHub/GitLab/Bitbucket ile bağlayın veya **Import** ile yükleyin.
3. **Settings** → **Environment Variables** kısmına şunları ekleyin:

| Name             | Value                                                                 | Environment   |
|------------------|-----------------------------------------------------------------------|---------------|
| `DATABASE_URL`   | Supabase’den kopyaladığınız connection string (Session mode, şifreli) | Production, Preview |
| `SESSION_SECRET` | Uzun rastgele bir metin (örn. `openssl rand -base64 32` çıktısı)     | Production, Preview |
| `GOOGLE_CLIENT_ID`     | (Google ile giriş kullanıyorsanız)                                  | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | (Google ile giriş kullanıyorsanız)                                  | Production, Preview |

4. **Deploy** edin. Build sırasında Vercel `prisma generate` ve gerekirse `prisma migrate deploy` için **Build Command**’ta ek ayar gerekebilir. Varsayılan `next build` çoğu zaman yeterlidir; Prisma, `postinstall` ile generate ediliyorsa ekstra bir şey yapmanız gerekmez.

5. Build komutu projede zaten `prisma generate && next build` olarak ayarlı; Vercel deploy sırasında Prisma client otomatik üretilir.

Önemli: Tabloların Supabase’de mutlaka olması gerekir. Bunu **yerelde** bir kez çalıştırın: `npx prisma migrate deploy`. Vercel’de migration çalıştırmaya gerek yok.

---

## 5. Resim yükleme (önemli not)

Şu an resimler **sunucunun dosya sistemine** (`public/uploads`) yazılıyor. **Vercel**’de dosya sistemi kalıcı değildir; her deploy’da sıfırlanır. Bu yüzden:

- **Seçenek A – Supabase Storage (önerilen):** Resimleri Supabase Storage’a yükleyip URL’leri veritabanına kaydetmek için `/api/upload` ve ilgili kodu Supabase Storage kullanacak şekilde güncellemek gerekir. İsterseniz bir sonraki adımda buna göre kod değişikliği yapabiliriz.
- **Seçenek B – Geçici:** Sadece veritabanı Supabase’de, resimler olmadan veya harici bir depolama (örn. başka bir CDN) kullanarak test edebilirsiniz.

---

## 6. Özet kontrol listesi

- [ ] Supabase projesi oluşturuldu (tercihen EU bölgesi).
- [ ] `DATABASE_URL` (Session mode, şifreyle) kopyalandı.
- [ ] `.env` içinde `DATABASE_URL` ve `SESSION_SECRET` ayarlandı.
- [ ] `npx prisma migrate deploy` çalıştırıldı.
- [ ] `npx prisma generate` çalıştırıldı.
- [ ] Yerelde `npm run dev` ile giriş/kayıt test edildi.
- [ ] Vercel’de `DATABASE_URL` ve `SESSION_SECRET` (ve isteğe bağlı Google) tanımlandı.
- [ ] Deploy alındı ve canlı sitede test edildi.

---

## Sık karşılaşılan hatalar

- **"Can't reach database server"**  
  `DATABASE_URL` doğru mu, şifre özel karakter içeriyorsa URL-encode edildi mi kontrol edin. Supabase **Database** → **Connection string** sayfasındaki değeri aynen kullanın.

- **"Migration failed"**  
  Supabase’de proje tam açılmış mı, şifre doğru mu bakın. İlk migration’ı yerelde `prisma migrate deploy` ile deneyin.

- **Vercel’de build hatası**  
  `prisma generate` build sırasında çalışsın diye **Build Command:** `npx prisma generate && next build` yapın (gerekirse).

Bu rehberle projeniz Supabase’e bağlanıp Vercel’de yayınlanabilir. Resimleri Supabase Storage’a taşımak isterseniz bir sonraki adımda ona göre kod tarafını da anlatabilirim.
