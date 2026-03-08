# Google ile Giriş Kurulumu

"Google ile giriş şu an yapılandırılmamış" hatasını gidermek için aşağıdaki adımları uygulayın.

---

## 1. Google Cloud Console’da proje ve OAuth ayarları

1. **[Google Cloud Console](https://console.cloud.google.com/)** adresine gidin ve Google hesabınızla giriş yapın.
2. Üstten **Proje seçin** → **Yeni Proje** → İsim verin (örn. `Katalog Sitesi`) → **Oluştur**.
3. Sol menüden **API’ler ve Hizmetler** → **OAuth consent screen** (OAuth onay ekranı):
   - **User Type:** "External" seçin → **Oluştur**.
   - **Uygulama adı:** Örn. "Katalog Sitesi".
   - **Kullanıcı destek e-postası:** Kendi e-postanızı seçin.
   - **Geliştirici iletişim bilgisi:** E-postanızı girin.
   - **Kaydet ve Devam** deyin; **Scopes** ve **Test users** adımlarında da **Kaydet ve Devam** ile ilerleyip **Ana sayfaya dön** deyin.
4. Sol menüden **API’ler ve Hizmetler** → **Credentials** (Kimlik bilgileri):
   - **+ Create Credentials** → **OAuth client ID**.
   - **Application type:** "Web application".
   - **Name:** Örn. "Katalog Web".
   - **Authorized redirect URIs** bölümüne şu adresi **tek tek** ekleyin:
     - Canlı site: `https://katalog-sitesi.vercel.app/api/auth/google/callback`
     - (Vercel’de farklı bir domain kullanıyorsanız onu yazın, örn. `https://SIZIN-DOMAIN.vercel.app/api/auth/google/callback`)
     - Yerelde test için: `http://localhost:3000/api/auth/google/callback`
   - **Oluştur** deyin.
5. Açılan pencerede **Client ID** ve **Client secret** değerlerini kopyalayın (bir yere not alın veya sonraki adımda kullanın).

---

## 2. Vercel’de ortam değişkenlerini ekleme

1. **[Vercel Dashboard](https://vercel.com/dashboard)** → **katalog-sitesi** projesi → **Settings** → **Environment Variables**.
2. İki değişken ekleyin:

| Name | Value | Environment |
|------|--------|-------------|
| `GOOGLE_CLIENT_ID` | Google’dan kopyaladığınız Client ID | Production, Preview (isterseniz Development de seçin) |
| `GOOGLE_CLIENT_SECRET` | Google’dan kopyaladığınız Client secret | Production, Preview |

3. **Save** deyin.

---

## 3. Yeniden deploy

1. **Deployments** sekmesine gidin.
2. En son deployment’ın sağındaki **⋯** → **Redeploy**.
3. Deploy bitene kadar bekleyin.

---

## 4. Yerelde denemek için (isteğe bağlı)

Proje klasöründeki `.env` dosyasına ekleyin:

```
GOOGLE_CLIENT_ID=...buraya_client_id...
GOOGLE_CLIENT_SECRET=...buraya_client_secret...
```

Redirect URI olarak `http://localhost:3000/api/auth/google/callback` eklediyseniz yerelde de "Google ile Giriş Yap" çalışır.

---

## Özet

1. Google Cloud Console’da OAuth consent screen + OAuth client ID (Web application) oluşturun.
2. Authorized redirect URI: `https://katalog-sitesi.vercel.app/api/auth/google/callback` (ve yerel için `http://localhost:3000/api/auth/google/callback`).
3. Client ID ve Client secret’ı Vercel’de **GOOGLE_CLIENT_ID** ve **GOOGLE_CLIENT_SECRET** olarak ekleyin.
4. Projeyi **Redeploy** edin.

Bu adımlardan sonra "Google ile Giriş Yap" butonu çalışır; ilk kez Google ile giren kullanıcı otomatik olarak "müşteri" rolüyle kayıt olur.
