<div align="center">
  <img src="public/logo.png" alt="QR Card Logo" width="200" />
  
  # QR Card
  
  **Modern Dijital Kartvizit Sistemi**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
</div>

---

## 📖 Hakkında

**QR Card**, şirketlerin çalışanları için dijital kartvizitler oluşturmasını ve yönetmesini sağlayan modern bir SaaS uygulamasıdır. Her çalışan için benzersiz QR kodlar oluşturur ve SEO dostu public profil sayfaları sunar.

### 🌟 Özellikler

#### 🏢 Şirket Yönetimi

- ✅ Güvenli şirket kaydı ve girişi (Supabase Auth)
- ✅ Şirket profil yönetimi (logo, arka plan görseli, iletişim bilgileri)
- ✅ Çoklu dil desteği (Türkçe/İngilizce)
- ✅ Şirket dashboard'u

#### 👥 Çalışan Yönetimi

- ✅ Çalışan ekleme, düzenleme, silme
- ✅ Profil fotoğrafı yükleme
- ✅ Sosyal medya linkleri (Instagram, LinkedIn, Facebook, YouTube, WhatsApp)
- ✅ QR kod oluşturma ve indirme
- ✅ Çalışan bazlı kullanıcı adı ve şifre sistemi

#### 📅 Randevu Sistemi

- ✅ Çalışan bazlı müsait saat yönetimi
- ✅ Müşteri randevu rezervasyonu
- ✅ Randevu onaylama, iptal etme, tamamlama
- ✅ Takvim görünümü (aylık)
- ✅ Randevu bildirimleri

#### 📊 CRM & Satış Takibi

- ✅ Lead yönetimi (Yeni, Görüşüldü, Satış Yapıldı, Reddedildi, Takipte)
- ✅ Kanban board görünümü (drag & drop)
- ✅ Liste görünümü
- ✅ Çalışan bazlı lead atama
- ✅ Takip tarihi yönetimi
- ✅ CRM istatistikleri

#### 📈 Raporlar & Analitik

- ✅ CRM istatistikleri (toplam lead, satış, takip)
- ✅ Randevu istatistikleri (toplam, onaylanan, beklemede)
- ✅ QR kod görüntülenme ve tıklama takibi
- ✅ Aylık trend grafikleri (son 6 ay)
- ✅ Çalışan performans raporları

#### 🌐 Public Profil Sayfaları

- ✅ SEO optimizasyonu (meta tags, OG tags)
- ✅ Responsive tasarım
- ✅ Sosyal medya entegrasyonu
- ✅ WhatsApp direkt mesaj
- ✅ vCard indirme (telefona kaydetme)
- ✅ Google Maps / Yandex Maps navigasyon
- ✅ Dosya paylaşımı (CV, PDF, Brochure, Presentation)
- ✅ Mini portfolio/galeri
- ✅ Linktree tarzı ekstra linkler
- ✅ Google Meet / Zoom entegrasyonu
- ✅ Geri bildirim ve değerlendirme sistemi

#### 📱 Mobil Uygulama

- ✅ React Native ile cross-platform mobil uygulama
- ✅ Şirket ve çalışan girişi
- ✅ Dashboard ve takvim görünümü
- ✅ CRM yönetimi

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı (ücretsiz tier yeterli)

### Kurulum

1. **Repository'yi klonlayın**

   ```bash
   git clone https://github.com/husobiker/qrcard.git
   cd qrcard
   ```

2. **Bağımlılıkları yükleyin**

   ```bash
   npm install
   ```

3. **Environment değişkenlerini ayarlayın**

   `.env` dosyası oluşturun:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PUBLIC_URL=https://qrcard.gozcu.tech
   ```

4. **Supabase'i yapılandırın**

   - [Supabase](https://supabase.com) hesabı oluşturun
   - Yeni proje oluşturun
   - SQL Editor'de `supabase/migrations/` klasöründeki migration dosyalarını sırayla çalıştırın
   - Storage'da `company-assets` bucket'ı oluşturun (public)

5. **Geliştirme sunucusunu başlatın**

   ```bash
   npm run dev
   ```

   Uygulama `http://localhost:5173` adresinde çalışacaktır.

---

## 📁 Proje Yapısı

```
qrcard/
├── src/
│   ├── components/          # UI bileşenleri
│   │   ├── ui/             # Shadcn UI bileşenleri
│   │   ├── Layout.tsx      # Ana layout
│   │   └── QRCodeGenerator.tsx
│   ├── pages/
│   │   ├── auth/           # Kimlik doğrulama sayfaları
│   │   ├── dashboard/      # Şirket dashboard sayfaları
│   │   ├── employee/       # Çalışan sayfaları
│   │   └── public/         # Public profil sayfaları
│   ├── services/           # API servis fonksiyonları
│   ├── contexts/           # React context'ler
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Yardımcı fonksiyonlar
│   └── types/              # TypeScript type tanımları
├── supabase/
│   └── migrations/         # SQL migration dosyaları
├── mobile/                 # React Native mobil uygulama
└── public/                 # Statik dosyalar
```

---

## 🗄️ Veritabanı Şeması

### Companies

- Şirket bilgileri, logo, arka plan görseli, dil tercihi

### Employees

- Çalışan bilgileri, profil fotoğrafı, sosyal medya linkleri
- Müsait saatler, varsayılan randevu süresi
- Kullanıcı adı ve şifre (hash'lenmiş)

### Appointments

- Randevu bilgileri, müşteri detayları, durum takibi

### CRM Leads

- Lead bilgileri, durum, takip tarihi, atanan çalışan

### Analytics

- QR kod görüntülenme ve tıklama istatistikleri

Detaylı şema için `supabase/migrations/` klasörüne bakın.

---

## 🚀 Production Deployment

### PM2 ile Deployment

1. **Build oluşturun**

   ```bash
   npm run build
   ```

2. **PM2 ile başlatın**
   ```bash
   pm2 start ecosystem.config.js
   ```

Detaylı deployment talimatları için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

### Environment Variables (Production)

```env
VITE_PUBLIC_URL=https://qrcard.gozcu.tech
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🛠️ Teknolojiler

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: TailwindCSS + Shadcn UI
- **Backend**: Supabase (Auth, Database, Storage, RLS)
- **Routing**: React Router v6
- **QR Codes**: react-qr-code
- **Icons**: Lucide React
- **Mobile**: React Native + Expo

---

## 📱 Kullanım

### Şirket Hesabı

1. **Kayıt Ol**: Şirket hesabı oluşturun
2. **Profil Düzenle**: Şirket bilgilerini ve logoyu yükleyin
3. **Çalışan Ekle**: Çalışanları ekleyin ve bilgilerini doldurun
4. **QR Kod Oluştur**: Her çalışan için QR kod oluşturun ve indirin
5. **Randevu Yönet**: Randevuları görüntüleyin ve yönetin
6. **CRM Takibi**: Lead'leri yönetin ve satış takibi yapın
7. **Raporlar**: Detaylı istatistikleri görüntüleyin

### Çalışan Hesabı

1. **Giriş Yap**: Şirket tarafından verilen kullanıcı adı ve şifre ile giriş yapın
2. **Profil Görüntüle**: Kendi dijital kartvizitinizi görüntüleyin
3. **Takvim**: Randevularınızı görüntüleyin ve yönetin
4. **CRM**: Size atanan lead'leri takip edin

### Public Profil

Her çalışan için benzersiz bir public URL:

```
https://qrcard.gozcu.tech/{companyId}/{employeeId}
```

Bu URL'ye QR kod ile veya direkt link ile erişilebilir.

---

## 🔒 Güvenlik

- ✅ Row Level Security (RLS) tüm tablolarda aktif
- ✅ Şirketler sadece kendi verilerine erişebilir
- ✅ Çalışanlar sadece kendi verilerini görebilir
- ✅ Public profil sayfaları sadece okuma erişimi
- ✅ Şifreler bcrypt ile hash'lenir
- ✅ Supabase Auth ile güvenli kimlik doğrulama

---

## 📝 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen:

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📞 İletişim

**Gözcu Yazılım**

- Website: [gozcu.tech](https://gozcu.tech)
- Made with ❤️ by Gözcu Yazılım

---

<div align="center">
  <p>⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!</p>
</div>
