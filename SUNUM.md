# QR Card - Pazarlama Personeli Yönetim Sistemi
## Proje Sunumu

---

## 📋 Proje Özeti

**QR Card**, şirketlerin pazarlama personellerini kapsamlı bir şekilde yönetmelerini sağlayan modern bir SaaS (Software as a Service) uygulamasıdır. Sistem, dijital kartvizit yönetiminden başlayarak, CRM, randevu takibi, görev yönetimi, performans hedefleri, finansal işlemler, müşteri iletişimi, komisyon takibi ve IP telefon entegrasyonuna kadar geniş bir yelpazede hizmet sunmaktadır.

---

## 🎯 Proje Amacı

Pazarlama personellerinin tüm iş süreçlerini tek bir platformda toplayarak:
- **Verimliliği artırmak**
- **Satış süreçlerini optimize etmek**
- **Müşteri ilişkilerini güçlendirmek**
- **Performans takibini kolaylaştırmak**
- **İletişim kanallarını merkezileştirmek**

---

## 🏗️ Mimari ve Teknolojiler

### Frontend
- **Framework**: React 18.2.0 + TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **UI Framework**: TailwindCSS 3.3.6 + Shadcn UI
- **Routing**: React Router v6.20.0
- **State Management**: React Hooks (useState, useEffect, Context API)
- **Icons**: Lucide React
- **QR Code**: react-qr-code
- **SIP/Telephony**: sip.js 0.20.0

### Backend
- **Platform**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Database**: PostgreSQL (Row Level Security ile güvenli)
- **Authentication**: Supabase Auth (şirketler için) + Custom Auth (çalışanlar için)
- **Storage**: Supabase Storage (logo, profil fotoğrafları, dosyalar)
- **Edge Functions**: Deno runtime (API proxy için)

### Güvenlik
- **Row Level Security (RLS)**: Tüm tablolarda aktif
- **Data Isolation**: Şirketler sadece kendi verilerine erişebilir
- **Password Hashing**: bcrypt ile şifre hash'leme
- **CORS Protection**: Edge Functions ile API güvenliği

---

## 📦 Modüller ve Özellikler

### 1. 🏢 Şirket Yönetimi
- Şirket kaydı ve girişi (Supabase Auth)
- Şirket profil yönetimi (logo, arka plan görseli, iletişim bilgileri)
- Vergi bilgileri (vergi numarası, vergi dairesi)
- Çoklu dil desteği (Türkçe/İngilizce)
- Sanal Santral API ayarları (IP telefon entegrasyonu için)

### 2. 👥 Çalışan Yönetimi
- Çalışan ekleme, düzenleme, silme
- Profil fotoğrafı yükleme
- Sosyal medya linkleri (Instagram, LinkedIn, Facebook, YouTube, WhatsApp)
- QR kod oluşturma ve indirme
- Çalışan bazlı kullanıcı adı ve şifre sistemi
- IP telefon ayarları (SIP kullanıcı adı, şifre, extension)

### 3. 📅 Randevu Sistemi
- Çalışan bazlı müsait saat yönetimi
- Müşteri randevu rezervasyonu (public form)
- Randevu onaylama, iptal etme, tamamlama
- Takvim görünümü (aylık)
- Randevu durum takibi (pending, confirmed, cancelled, completed)

### 4. 📊 CRM & Satış Takibi
- Lead yönetimi (Yeni, Görüşüldü, Satış Yapıldı, Reddedildi, Takipte)
- Kanban board görünümü (drag & drop)
- Liste görünümü
- Çalışan bazlı lead atama
- Takip tarihi yönetimi
- CRM istatistikleri
- Müşteri bilgileri ve iletişim geçmişi

### 5. ✅ Görev Yönetimi
- Görev oluşturma, atama, takip
- Görev durumları (pending, in_progress, completed, cancelled)
- Öncelik seviyeleri (low, medium, high, urgent)
- Çalışan bazlı görev listesi
- Görev istatistikleri

### 6. 🎯 Performans Hedefleri
- Performans hedefi oluşturma
- Hedef türleri (satış, lead, görüşme, vb.)
- Hedef takibi ve ilerleme raporlama
- Çalışan bazlı hedef atama
- Hedef istatistikleri

### 7. 💰 Finansal İşlemler
- Gelir/gider kayıtları
- İşlem kategorileri
- İşlem durumları (pending, completed, cancelled)
- Çalışan bazlı işlem takibi
- Finansal raporlar

### 8. 💬 Müşteri İletişimi
- İletişim kayıtları (email, telefon, toplantı, not)
- Müşteri bazlı iletişim geçmişi
- İletişim istatistikleri
- Çalışan bazlı iletişim takibi

### 9. 💵 Komisyon Sistemi
- Komisyon ayarları (yüzde, sabit tutar)
- Komisyon ödemeleri
- Ödeme durumları (pending, paid, cancelled)
- Çalışan bazlı komisyon takibi
- Komisyon raporları

### 10. 📞 IP Telefon Entegrasyonu
- Sanal Santral API entegrasyonu (Sanal Santral, vb.)
- Web tabanlı arama yapma
- Arama geçmişi kayıtları
- Arama kayıtları (ses kayıtları)
- Çalışan bazlı IP telefon ayarları
- Şirket bazlı API ayarları

### 11. 📈 Raporlar & Analitik
- **CRM İstatistikleri**: Toplam lead, satış, takip
- **Randevu İstatistikleri**: Toplam, onaylanan, beklemede
- **QR Kod Analitiği**: Görüntülenme ve tıklama sayıları
- **Görev İstatistikleri**: Toplam, devam eden, tamamlanan
- **Hedef İstatistikleri**: Hedef ilerleme ve başarı oranları
- **Finansal İstatistikler**: Gelir, gider, net kar
- **İletişim İstatistikleri**: Toplam iletişim, tür bazlı dağılım
- **Komisyon İstatistikleri**: Toplam komisyon, ödenen, bekleyen
- **Arama İstatistikleri**: Toplam arama, süre, durum
- **Aylık Trend Grafikleri**: Son 6 ay için tüm modüller

### 12. 🌐 Public Profil Sayfaları
- SEO optimizasyonu (meta tags, OG tags)
- Responsive tasarım
- Sosyal medya entegrasyonu
- WhatsApp direkt mesaj
- vCard indirme (telefona kaydetme)
- Google Maps / Yandex Maps navigasyon
- Dosya paylaşımı (CV, PDF, Brochure, Presentation)
- Mini portfolio/galeri
- Linktree tarzı ekstra linkler

---

## 🔐 Güvenlik Özellikleri

### Row Level Security (RLS)
- Tüm tablolarda aktif RLS politikaları
- Şirketler sadece kendi verilerine erişebilir
- Çalışanlar sadece kendi verilerini görebilir
- Public profil sayfaları sadece okuma erişimi

### Authentication
- Şirketler: Supabase Auth (email/password)
- Çalışanlar: Custom authentication (username/password, bcrypt hash)
- Session yönetimi
- Protected routes

### Data Protection
- Şifreler bcrypt ile hash'lenir
- API key'ler güvenli şekilde saklanır
- CORS koruması (Edge Functions ile)

---

## 📊 Veritabanı Yapısı

### Ana Tablolar
1. **companies**: Şirket bilgileri, API ayarları
2. **employees**: Çalışan bilgileri, profil fotoğrafları
3. **appointments**: Randevu kayıtları
4. **crm_leads**: CRM lead'leri
5. **analytics**: QR kod görüntülenme/tıklama istatistikleri
6. **tasks**: Görev kayıtları
7. **performance_goals**: Performans hedefleri
8. **transactions**: Finansal işlemler
9. **customer_communications**: Müşteri iletişim kayıtları
10. **commission_settings**: Komisyon ayarları
11. **commission_payments**: Komisyon ödemeleri
12. **call_logs**: Arama geçmişi
13. **employee_sip_settings**: Çalışan IP telefon ayarları

### İlişkiler
- Tüm tablolar `company_id` ile şirketlere bağlı
- Çalışan bazlı tablolar `employee_id` ile çalışanlara bağlı
- Foreign key constraints ile veri bütünlüğü

---

## 🚀 Kullanıcı Rolleri ve Yetkiler

### 🏢 Şirket Yöneticisi
- Tüm modüllere tam erişim
- Çalışan yönetimi (ekleme, düzenleme, silme)
- Raporlama ve analitik
- Şirket ayarları
- API ayarları
- Manuel veri girişi

### 👤 Çalışan
- Kendi profilini görüntüleme
- Kendi randevularını görüntüleme ve yönetme
- Kendi lead'lerini görüntüleme ve yönetme
- Kendi görevlerini görüntüleme ve yönetme
- Kendi hedeflerini görüntüleme
- Kendi işlemlerini görüntüleme
- Kendi iletişimlerini görüntüleme
- Kendi komisyonlarını görüntüleme
- Kendi arama geçmişini görüntüleme
- Web tabanlı arama yapma
- Dashboard (özet istatistikler)

---

## 📱 Kullanıcı Arayüzü

### Şirket Dashboard
- **Genel Bakış**: Tüm modüller için özet istatistikler
- **Çalışan Yönetimi**: Çalışan listesi, ekleme, düzenleme
- **CRM**: Kanban board ve liste görünümü
- **Randevular**: Takvim görünümü
- **Görevler**: Görev listesi ve yönetimi
- **Hedefler**: Performans hedefleri
- **Finansal İşlemler**: Gelir/gider kayıtları
- **İletişimler**: Müşteri iletişim kayıtları
- **Komisyonlar**: Komisyon ayarları ve ödemeleri
- **Arama Geçmişi**: Tüm arama kayıtları
- **Raporlar**: Detaylı analitik ve grafikler

### Çalışan Dashboard
- **Anasayfa**: Özet istatistikler (lead, komisyon, görev, hedef, iletişim)
- **CRM**: Kendi lead'leri
- **Randevular**: Kendi randevuları
- **Görevler**: Kendi görevleri
- **Hedefler**: Kendi hedefleri
- **Finansal İşlemler**: Kendi işlemleri
- **İletişimler**: Kendi iletişimleri
- **Komisyonlar**: Kendi komisyonları
- **Arama Geçmişim**: Kendi arama geçmişi
- **Arama Yap**: Web tabanlı arama arayüzü

### Navigation Menü
- **Gruplu Menü Yapısı**: İlgili öğeler gruplandırılmış
- **Açılır/Kapanır Menüler**: Dropdown menüler ile kompakt yapı
- **Kategoriler**:
  - Genel (Anasayfa, Profilim)
  - Satış & Müşteri (CRM, Randevular, İletişimler)
  - Görevler & Hedefler (Görevler, Hedefler)
  - Finansal (İşlemler, Komisyonlar)
  - Raporlar (Raporlar, Arama Geçmişi)

---

## 🔧 Teknik Detaylar

### API Entegrasyonları
- **Supabase REST API**: Veritabanı işlemleri
- **Supabase Storage API**: Dosya yükleme
- **Supabase Edge Functions**: Sanal Santral API proxy (CORS bypass)
- **Sanal Santral API**: IP telefon entegrasyonu (geliştirme aşamasında)

### SIP/WebRTC Entegrasyonu
- **sip.js**: Web tabanlı SIP client
- **WebRTC**: Tarayıcı tabanlı ses iletişimi
- **API-based Calling**: Sanal Santral gibi üçüncü parti servisler için REST API

### State Management
- **React Context API**: Dil yönetimi (LanguageContext)
- **React Hooks**: Local state yönetimi
- **Supabase Realtime**: Gerçek zamanlı veri senkronizasyonu (opsiyonel)

---

## 📈 Performans ve Ölçeklenebilirlik

### Optimizasyonlar
- **Lazy Loading**: Route bazlı kod bölme
- **Image Optimization**: Supabase Storage ile CDN
- **Database Indexing**: Sık kullanılan sorgular için index'ler
- **Caching**: Browser cache ve Supabase cache

### Ölçeklenebilirlik
- **Supabase**: Otomatik ölçeklenebilir backend
- **Edge Functions**: Serverless fonksiyonlar
- **Storage**: Sınırsız dosya depolama (plan limitleri içinde)

---

## 🎨 Kullanıcı Deneyimi (UX)

### Tasarım Prensipleri
- **Modern ve Minimalist**: Temiz, kullanıcı dostu arayüz
- **Responsive Design**: Mobil, tablet, desktop uyumlu
- **Accessibility**: Erişilebilirlik standartlarına uygun
- **Dark Mode Ready**: Gelecekte dark mode desteği eklenebilir

### Kullanıcı Akışları
- **Şirket Kaydı**: Basit kayıt formu → Email doğrulama → Dashboard
- **Çalışan Ekleme**: Form doldurma → QR kod oluşturma → Paylaşım
- **Lead Yönetimi**: Lead ekleme → Kanban'da sürükleme → Durum güncelleme
- **Arama Yapma**: Telefon numarası girme → Arama başlatma → Kayıt

---

## 🔄 Geliştirme Durumu

### ✅ Tamamlanan Özellikler
- [x] Şirket yönetimi
- [x] Çalışan yönetimi
- [x] QR kod oluşturma
- [x] Public profil sayfaları
- [x] Randevu sistemi
- [x] CRM & Satış takibi
- [x] Görev yönetimi
- [x] Performans hedefleri
- [x] Finansal işlemler
- [x] Müşteri iletişimi
- [x] Komisyon sistemi
- [x] Raporlar & Analitik
- [x] IP telefon entegrasyonu (temel yapı)
- [x] Arama geçmişi
- [x] Gruplu navigation menü

### 🚧 Geliştirme Aşamasında
- [ ] Sanal Santral API entegrasyonu (endpoint formatı belirlenmesi gerekiyor)
- [ ] WebRTC ses iletişimi (API entegrasyonu sonrası)
- [ ] Arama kayıtları (ses kayıtları)
- [ ] Gelen arama bildirimleri

### 📋 Gelecek Özellikler
- [ ] Mobil uygulama (React Native)
- [x] Dark mode
- [ ] Bildirim sistemi (email, SMS, push)
- [ ] Excel/PDF export
- [ ] Gelişmiş filtreleme ve arama
- [ ] Toplu işlemler

---

## 📊 İstatistikler

### Kod Metrikleri
- **Toplam Dosya Sayısı**: 100+ dosya
- **TypeScript Dosyaları**: 50+ dosya
- **React Bileşenleri**: 30+ bileşen
- **Servis Fonksiyonları**: 15+ servis
- **Database Migration**: 32+ migration
- **Supabase Edge Functions**: 2 fonksiyon

### Özellik Sayıları
- **Modül Sayısı**: 12 ana modül
- **Sayfa Sayısı**: 20+ sayfa
- **API Endpoint**: 50+ endpoint (Supabase üzerinden)
- **Database Tablosu**: 13+ tablo

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Yeni Çalışan Ekleme
1. Şirket yöneticisi çalışan ekler
2. Çalışan bilgilerini doldurur (isim, telefon, email, sosyal medya)
3. Profil fotoğrafı yükler
4. QR kod oluşturur
5. QR kodu çalışana verir veya dijital olarak paylaşır

### Senaryo 2: Lead Yönetimi
1. Çalışan yeni lead ekler
2. Lead'i "Yeni" kolonuna yerleştirir
3. Lead ile görüşme yapar
4. Lead'i "Görüşüldü" kolonuna taşır
5. Satış yapılırsa "Satış Yapıldı" kolonuna taşır
6. Sistem otomatik olarak komisyon hesaplar

### Senaryo 3: Arama Yapma
1. Çalışan dashboard'da "Ara" butonuna tıklar
2. Telefon numarasını girer
3. Müşteri adını girer (opsiyonel)
4. "Ara" butonuna tıklar
5. Sistem aramayı başlatır
6. Arama kaydı otomatik olarak kaydedilir

---

## 🔐 Güvenlik Önlemleri

### Veri Güvenliği
- **Row Level Security**: Her şirket sadece kendi verilerine erişebilir
- **Password Hashing**: Bcrypt ile güvenli şifre saklama
- **API Key Encryption**: Hassas bilgiler güvenli şekilde saklanır
- **CORS Protection**: Edge Functions ile API güvenliği

### Erişim Kontrolü
- **Authentication**: Supabase Auth + Custom Auth
- **Authorization**: Role-based access control
- **Session Management**: Güvenli session yönetimi
- **Protected Routes**: Yetkisiz erişim engelleme

---

## 📱 Platform Desteği

### Web Uygulaması
- **Tarayıcı Desteği**: Chrome, Firefox, Safari, Edge (son sürümler)
- **Responsive**: Mobil, tablet, desktop
- **PWA Ready**: Progressive Web App desteği (gelecekte)

### Mobil Uygulama
- **Durum**: Planlama aşamasında
- **Framework**: React Native + Expo (önerilen)
- **Platform**: iOS ve Android

---

## 🚀 Deployment

### Production Environment
- **Frontend**: Vite build ile static files
- **Backend**: Supabase (managed PostgreSQL + Auth + Storage)
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **CDN**: Supabase Storage CDN

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PUBLIC_URL=https://your-domain.com
```

---

## 📈 İş Değeri

### Şirketlere Sağladığı Faydalar
- **Merkezi Yönetim**: Tüm pazarlama süreçleri tek platformda
- **Verimlilik**: Manuel işlemlerin azaltılması
- **Takip**: Detaylı raporlama ve analitik
- **Müşteri İlişkileri**: CRM ile müşteri takibi
- **Performans**: Çalışan performansının ölçülmesi
- **Maliyet**: IP telefon entegrasyonu ile iletişim maliyetlerinin azaltılması

### Çalışanlara Sağladığı Faydalar
- **Kolaylık**: Tek platformda tüm işlemler
- **Mobil Erişim**: Web tabanlı, her yerden erişilebilir
- **Takip**: Kendi performansını görüntüleme
- **İletişim**: Web tabanlı arama yapma

---

## 🎓 Teknik Yetenekler

### Kullanılan Teknolojiler
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Telephony**: SIP.js, WebRTC
- **Build Tools**: Vite, TypeScript Compiler
- **Version Control**: Git

### Best Practices
- **TypeScript**: Tip güvenliği
- **Component-based Architecture**: Yeniden kullanılabilir bileşenler
- **Service Layer**: API çağrılarının merkezi yönetimi
- **Error Handling**: Kapsamlı hata yönetimi
- **Code Organization**: Modüler yapı

---

## 📝 Sonuç

**QR Card**, pazarlama personellerinin tüm iş süreçlerini tek bir platformda toplayan, modern, güvenli ve ölçeklenebilir bir SaaS uygulamasıdır. Sistem, dijital kartvizit yönetiminden başlayarak, CRM, randevu takibi, görev yönetimi, performans hedefleri, finansal işlemler, müşteri iletişimi, komisyon takibi ve IP telefon entegrasyonuna kadar geniş bir yelpazede hizmet sunmaktadır.

### Proje Durumu
- ✅ **Temel Modüller**: Tamamlandı
- 🚧 **IP Telefon Entegrasyonu**: Geliştirme aşamasında (API endpoint formatı belirlenmesi gerekiyor)
- 📋 **Mobil Uygulama**: Planlama aşamasında

### Gelecek Planlar
- Sanal Santral API entegrasyonunun tamamlanması
- WebRTC ses iletişiminin implementasyonu
- Mobil uygulama geliştirilmesi
- Gelişmiş raporlama ve analitik özellikleri

---

**Geliştirici**: Gözcu Yazılım  
**Versiyon**: 1.0.0  
**Tarih**: Ocak 2026


