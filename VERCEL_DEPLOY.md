# Vercel'e Yayınlama Adımları

## 1. Projeyi GitHub'a at (henüz yoksa)

1. [github.com](https://github.com) → **New repository** → isim ver (örn. `katalog-sitesi`) → **Create**.
2. Bilgisayarında proje klasöründe terminal aç:
   ```bash
   cd C:\Users\Gunay\katalog-sitesi
   git init
   git add .
   git commit -m "İlk commit"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/katalog-sitesi.git
   git push -u origin main
   ```
   `KULLANICI_ADIN` yerine kendi GitHub kullanıcı adını yaz. (Repo zaten varsa sadece `git push` yeter.)

**Önemli:** `.env` dosyası `.gitignore`'da olduğu için GitHub'a **gitmez**. Şifreler güvende.

---

## 2. Vercel'de proje oluştur

1. [vercel.com](https://vercel.com) → Giriş yap (GitHub ile giriş en kolayı).
2. **Add New…** → **Project**.
3. **Import** kısmında GitHub repo’nu seç: `katalog-sitesi` (veya repo adın). **Import** tıkla.
4. **Configure Project** ekranında:
   - **Framework Preset:** Next.js (otomatik seçili olmalı).
   - **Root Directory:** boş bırak.
   - **Build Command:** `prisma generate && next build` (zaten `package.json`'da tanımlı, değiştirme).
   - **Environment Variables** bölümüne geç.

---

## 3. Ortam değişkenlerini ekle

**Environment Variables** alanına şunları ekle (her biri için **Name** ve **Value** doldur, **Environment** olarak Production ve Preview seç):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Supabase’ten aldığın Session pooler adresi (`.env`’deki ile aynı; şifreli tam adres) |
| `SESSION_SECRET` | `katalog-sitesi-gizli-anahtar-degistirin` (istersen daha uzun rastgele bir metin yap) |

Google ile giriş kullanıyorsan:

| Name | Value |
|------|--------|
| `GOOGLE_CLIENT_ID` | (Google Console’daki Client ID) |
| `GOOGLE_CLIENT_SECRET` | (Google Console’daki Client Secret) |

Sonra **Deploy** butonuna bas.

---

## 4. Deploy bitince

- Birkaç dakika sonra **Visit** ile site açılır (örn. `katalog-sitesi.vercel.app`).
- Kayıt ol / giriş yap dene; çalışıyorsa Supabase + Vercel bağlantısı tamamdır.
- İleride kod değiştirip GitHub’a push edersen Vercel otomatik yeni deploy alır.

---

## Özet

1. Projeyi GitHub’a push et (`.env` gitmez).
2. Vercel’de **Import** → repo seç.
3. **DATABASE_URL** ve **SESSION_SECRET** ekle → **Deploy**.
