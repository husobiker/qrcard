# ESP32 Araç Takip Sistemi - Kurulum Kılavuzu

## 📋 Genel Bakış

Bu sistem, ESP32 ve GPS modülü kullanarak araçların gerçek zamanlı konum takibini yapmanızı sağlar. Konum verileri Supabase veritabanına kaydedilir ve web arayüzünden görüntülenir.

## 🔧 Gereksinimler

### Donanım

**WiFi Versiyonu (Test/Şehir İçi):**

- ESP32 Development Board (ESP32-WROOM-32 veya benzeri)
- NEO-6M veya NEO-8M GPS Modülü
- Jumper kablolar
- USB kablosu (ESP32 programlama için)
- Güç kaynağı (5V, 2A önerilir - araçta kullanım için)

**GSM/4G Versiyonu (Önerilen - Araçta Kullanım):**

- ESP32 Development Board
- NEO-6M veya NEO-8M GPS Modülü
- SIM800L (2G) veya SIM7600 (4G) GSM Modülü
- SIM Kart (Data paketi olan)
- GSM Anteni
- Jumper kablolar
- Güç kaynağı (5V, 2A - GSM modülü için ekstra güç gerekebilir)

**📦 Detaylı malzeme listesi için:** `VEHICLE_TRACKING_MATERIALS.md` dosyasına bakın

### Yazılım

- Arduino IDE (1.8.19 veya üzeri)
- ESP32 Board Support Package
- Gerekli kütüphaneler (aşağıda listelenmiştir)

## 📦 Kütüphane Kurulumu

Arduino IDE'de aşağıdaki kütüphaneleri yükleyin:

1. **TinyGPS++** (by Mikal Hart)

   - Tools → Manage Libraries → "TinyGPS++" ara
   - Kurulum yapın

2. **ArduinoJson** (by Benoit Blanchon)
   - Tools → Manage Libraries → "ArduinoJson" ara
   - Versiyon 6.x veya üzeri kurun

## 🔌 Bağlantılar

### ESP32 - GPS Modülü Bağlantıları

| GPS Modülü | ESP32        |
| ---------- | ------------ |
| VCC        | 3.3V         |
| GND        | GND          |
| TX         | GPIO 17 (RX) |
| RX         | GPIO 16 (TX) |

**Not:** GPS modülünün RX pinine bağlantı yapmanıza gerek yok, sadece TX yeterlidir.

## ⚙️ Kod Yapılandırması

`esp32_vehicle_tracker.ino` dosyasını açın ve aşağıdaki ayarları yapın:

### 1. WiFi Ayarları

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Supabase Ayarları

```cpp
const char* supabaseUrl = "https://your-project.supabase.co";
const char* supabaseKey = "your-anon-key-here";
```

**Önemli:** Supabase URL ve API Key'i projenizin ayarlarından alın:

- Supabase Dashboard → Settings → API
- Project URL ve `anon` public key'i kopyalayın

### 3. Cihaz ID Ayarları

```cpp
const char* DEVICE_ID = "ESP32-001"; // Her cihaz için benzersiz olmalı
const char* DEVICE_NAME = "Araç 1";
```

**Önemli:** Her ESP32 cihazı için farklı bir `DEVICE_ID` kullanın (örn: ESP32-001, ESP32-002, vb.)

### 4. Güncelleme Aralığı

```cpp
const unsigned long UPDATE_INTERVAL = 30000; // 30 saniye (milisaniye cinsinden)
```

## 🗄️ Veritabanı Kurulumu

1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ü açın
3. `supabase/migrations/033_add_vehicle_tracking.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın ve çalıştırın

Bu migration şunları oluşturur:

- `vehicles` tablosu (araç bilgileri)
- `vehicle_locations` tablosu (konum kayıtları)
- Gerekli RLS (Row Level Security) politikaları
- Yardımcı fonksiyonlar

## 🚗 Web Arayüzünden Araç Ekleme

1. Web uygulamasına giriş yapın
2. "Araç Takip" menüsüne gidin
3. "Yeni Araç Ekle" butonuna tıklayın
4. Formu doldurun:

   - **Araç Adı:** Örn: "Araç 1", "Kamyon-01"
   - **Plaka:** Araç plakası (opsiyonel)
   - **Cihaz ID:** ESP32 kodundaki `DEVICE_ID` ile **TAM OLARAK AYNI** olmalı
   - **Cihaz Adı:** ESP32 cihazının adı (opsiyonel)
   - **Araç Tipi:** Otomobil, Kamyon, vb.
   - **Sürücü:** Çalışan seçimi (opsiyonel)
   - **Durum:** Aktif

5. "Ekle" butonuna tıklayın

**Kritik:** Web arayüzündeki "Cihaz ID" ile ESP32 kodundaki `DEVICE_ID` **TAM OLARAK AYNI** olmalıdır!

## 📤 ESP32'yi Yükleme

1. Arduino IDE'yi açın
2. `esp32_vehicle_tracker.ino` dosyasını açın
3. Board seçin: Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
4. Port seçin: Tools → Port → (ESP32'nizin bağlı olduğu port)
5. Upload butonuna tıklayın (veya Ctrl+U)

## 🔍 Test ve Doğrulama

### Serial Monitor Kontrolü

1. Tools → Serial Monitor'ü açın
2. Baud rate: 115200
3. ESP32'yi resetleyin
4. Şu mesajları görmelisiniz:
   - "ESP32 Vehicle Tracker Starting..."
   - "GPS Module Initialized"
   - "WiFi Connected!"
   - "Location sent successfully!"

### Web Arayüzü Kontrolü

1. "Araç Takip" sayfasına gidin
2. Eklediğiniz aracı listede görmelisiniz
3. Haritada araç konumunu görmelisiniz
4. Konum güncellemeleri her 30 saniyede bir (veya ayarladığınız aralıkta) otomatik olarak güncellenir

## 🐛 Sorun Giderme

### GPS Sinyali Almıyor

- GPS modülünü açık havaya çıkarın (bina içinde çalışmaz)
- İlk GPS fix'i 1-2 dakika sürebilir
- Serial Monitor'de "Satellites: X" değerini kontrol edin (en az 4 uydu gerekli)

### WiFi Bağlanamıyor

- WiFi SSID ve şifresini kontrol edin
- ESP32'nin WiFi sinyal menzilinde olduğundan emin olun
- Serial Monitor'de "WiFi Connection Failed!" hatası görüyorsanız, bağlantı ayarlarını kontrol edin

### Supabase'e Veri Gönderilemiyor

- Supabase URL ve API Key'i kontrol edin
- "Vehicle ID not found" hatası alıyorsanız:
  - Web arayüzünden aracı eklediğinizden emin olun
  - ESP32 kodundaki `DEVICE_ID` ile web'deki "Cihaz ID"nin aynı olduğundan emin olun
- Serial Monitor'de HTTP hata kodlarını kontrol edin

### Haritada Araç Görünmüyor

- Web arayüzünden aracın eklendiğini kontrol edin
- Araç durumunun "Aktif" olduğundan emin olun
- ESP32'nin son 5 dakika içinde veri gönderdiğini kontrol edin
- Browser console'da hata olup olmadığını kontrol edin

## 🔋 Güç Yönetimi

Araçta kullanım için:

- ESP32'yi 5V, 2A güç kaynağına bağlayın
- GPS modülü ESP32'den güç alabilir (3.3V)
- Uzun süreli kullanım için harici güç kaynağı önerilir

## 📊 Veri Kullanımı

- Her konum güncellemesi yaklaşık 500-1000 byte veri gönderir
- 30 saniyede bir güncelleme = saatte ~120 KB
- Günlük kullanım: ~2.8 MB
- Aylık kullanım: ~85 MB

## 🔐 Güvenlik Notları

- Supabase `anon` key kullanılıyor - bu key sadece okuma ve belirli insert işlemleri için yetkilidir
- RLS (Row Level Security) politikaları sayesinde şirketler sadece kendi araçlarını görebilir
- Production ortamında ESP32'ler için özel bir API key kullanmayı düşünün

## 📝 Notlar

- GPS modülü ilk açılışta "soğuk başlangıç" yapabilir - bu durumda ilk fix 1-2 dakika sürebilir
- WiFi bağlantısı kesilirse, ESP32 otomatik olarak yeniden bağlanmaya çalışır
- Konum verileri Supabase'de saklanır ve geçmiş konumları görüntüleyebilirsiniz

## 🆘 Destek

Sorun yaşarsanız:

1. Serial Monitor çıktısını kontrol edin
2. Browser console'da hataları kontrol edin
3. Supabase Dashboard → Logs bölümünden API isteklerini kontrol edin
