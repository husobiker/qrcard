# ESP32 Araç Takip - GSM/4G Versiyonu Kurulum Kılavuzu

## 📋 Genel Bakış

Bu kılavuz, SIM kartlı (GSM/4G) ESP32 araç takip cihazının kurulumunu açıklar. Bu versiyon WiFi'ye ihtiyaç duymaz ve her yerde çalışır.

## 🔧 Gereksinimler

### Donanım
- ESP32 Development Board
- NEO-6M veya NEO-8M GPS Modülü
- **SIM800L (2G)** veya **SIM7600 (4G)** GSM Modülü
- **SIM Kart** (Data paketi aktif olan)
- GSM Anteni
- Jumper kablolar
- Güç kaynağı (5V, 2A - GSM modülü için yeterli güç)

### SIM Kart Gereksinimleri
- Aktif data paketi olan SIM kart
- PIN kodu kapalı olmalı (veya kod bilinmeli)
- Türkiye'de: Turkcell, Vodafone veya Türk Telekom

## 🔌 Bağlantılar

### ESP32 - GPS Modülü Bağlantıları
| GPS Modülü | ESP32        |
| ---------- | ------------ |
| VCC        | 3.3V         |
| GND        | GND          |
| TX         | GPIO 17 (RX) |
| RX         | GPIO 16 (TX) |

### ESP32 - SIM800L (2G) Bağlantıları
| SIM800L | ESP32        | Açıklama                    |
| ------- | ------------ | --------------------------- |
| VCC     | 5V (veya 4V) | Güç (modüle göre değişir)   |
| GND     | GND          | Toprak                      |
| TX      | GPIO 4 (RX)  | SIM800L'dan ESP32'ye veri   |
| RX      | GPIO 2 (TX)  | ESP32'den SIM800L'a veri    |
| RST     | GPIO 5       | Reset pini (opsiyonel)      |

**Önemli:** SIM800L bazı modellerde 4V gerektirir, bazıları 5V kabul eder. Modülünüzün datasheet'ine bakın.

### ESP32 - SIM7600 (4G) Bağlantıları
| SIM7600 | ESP32         | Açıklama                    |
| ------- | ------------- | --------------------------- |
| VCC     | 5V            | Güç                         |
| GND     | GND           | Toprak                      |
| TX      | GPIO 18 (RX)  | SIM7600'dan ESP32'ye veri   |
| RX      | GPIO 19 (TX)  | ESP32'den SIM7600'a veri    |
| PWR     | GPIO 23       | Power control (opsiyonel)   |

## ⚙️ Kod Yapılandırması

`esp32_vehicle_tracker_gsm.ino` dosyasını açın ve aşağıdaki ayarları yapın:

### 1. GSM Modülü Seçimi
```cpp
#define USE_SIM800L true  // true = SIM800L (2G), false = SIM7600 (4G)
```

### 2. Supabase Ayarları
```cpp
const char* supabaseUrl = "https://your-project.supabase.co";
const char* supabaseKey = "your-anon-key-here";
```

### 3. APN Ayarları (SIM Kart Operatörüne Göre)
```cpp
const char* APN = "internet"; // Türkiye'de genelde "internet"
```

**Türkiye APN Listesi:**
- **Turkcell:** `internet`
- **Vodafone:** `internet`
- **Türk Telekom:** `internet`

Eğer "internet" çalışmazsa:
- Turkcell: `internet.turkcell` veya `internet`
- Vodafone: `internet.vodafone` veya `internet`
- Türk Telekom: `internet.tt` veya `internet`

### 4. Cihaz ID Ayarları
```cpp
const char* DEVICE_ID = "ESP32-GSM-001"; // Her cihaz için benzersiz
```

### 5. Güncelleme Aralığı
```cpp
const unsigned long UPDATE_INTERVAL = 60000; // 60 saniye (GSM daha fazla güç tüketir)
```

**Not:** GSM modülü WiFi'den daha fazla güç tüketir, bu yüzden güncelleme aralığını 60 saniye veya daha uzun yapmanız önerilir.

## 📱 SIM Kart Hazırlığı

1. **SIM Kart Seçimi:**
   - Data paketi olan bir SIM kart alın
   - PIN kodu kapalı olmalı (veya PIN kodunu bilmelisiniz)
   - Türkiye'de: Turkcell, Vodafone veya Türk Telekom

2. **SIM Kartı Modüle Takma:**
   - SIM kartı modüle doğru şekilde takın (altın kontaklar aşağı bakmalı)
   - SIM kart tutucunun kilitlendiğinden emin olun

3. **Test:**
   - Modülü açtığınızda SIM kart tanınmalı
   - Serial Monitor'de "SIM card OK" mesajını görmelisiniz

## 🔋 Güç Gereksinimleri

GSM modülü özellikle veri gönderirken yüksek akım çeker:

- **SIM800L:** 
  - Beklemede: ~20-50mA
  - Veri gönderirken: ~200-400mA (peak)
  - Minimum: 5V, 500mA güç kaynağı

- **SIM7600:**
  - Beklemede: ~50-100mA
  - Veri gönderirken: ~300-600mA (peak)
  - Minimum: 5V, 1A güç kaynağı

**Önerilen Güç Kaynağı:**
- Araçta kullanım için: 12V-5V dönüştürücü, en az 2A çıkış
- Batarya ile: 2000mAh+ Li-Po batarya + şarj modülü

## 📤 ESP32'yi Yükleme

1. Arduino IDE'yi açın
2. `esp32_vehicle_tracker_gsm.ino` dosyasını açın
3. Ayarları yapın (yukarıdaki bölüme bakın)
4. Board seçin: Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
5. Port seçin
6. Upload butonuna tıklayın

## 🔍 Test ve Doğrulama

### Serial Monitor Kontrolü

1. Tools → Serial Monitor'ü açın (115200 baud)
2. ESP32'yi resetleyin
3. Şu mesajları görmelisiniz:
   ```
   ESP32 Vehicle Tracker with GSM Starting...
   GPS Module Initialized
   GSM Module Initialized
   Initializing GSM module...
   SIM card OK
   GSM Network: Connected
   GPRS Connected! IP: xxx.xxx.xxx.xxx
   Location sent successfully!
   ```

### Sorun Giderme

#### SIM Kart Tanınmıyor
- SIM kartın doğru takıldığından emin olun
- PIN kodunun kapalı olduğunu kontrol edin
- Farklı bir SIM kart deneyin
- Serial Monitor'de "ERROR: SIM card not ready!" hatası görüyorsanız, SIM kartı çıkarıp tekrar takın

#### GSM Ağına Bağlanamıyor
- SIM kartın aktif olduğundan emin olun
- Sinyal gücünü kontrol edin: `AT+CSQ` komutu
- Açık havada test edin (bina içinde sinyal zayıf olabilir)
- Operatörün 2G/4G ağının aktif olduğundan emin olun

#### GPRS Bağlantısı Kurulamıyor
- APN ayarlarını kontrol edin
- Data paketinin aktif olduğundan emin olun
- SIM kartın data için yetkilendirildiğinden emin olun
- `AT+CGDCONT?` komutu ile APN ayarlarını kontrol edin

#### Veri Gönderilemiyor
- GPRS bağlantısının kurulduğundan emin olun (`AT+CIFSR` ile IP alınmalı)
- Supabase URL ve API key'i kontrol edin
- HTTP isteklerinin başarılı olduğunu Serial Monitor'de kontrol edin

## 💡 WiFi vs GSM Karşılaştırması

| Özellik | WiFi Versiyonu | GSM Versiyonu |
|---------|----------------|---------------|
| **Bağlantı** | WiFi gerektirir | Her yerde çalışır |
| **Güç Tüketimi** | Düşük (~100mA) | Yüksek (~200-400mA) |
| **Maliyet** | Düşük | SIM kart + data paketi |
| **Hız** | Yüksek | Orta (2G) / Yüksek (4G) |
| **Kullanım** | Şehir içi, WiFi olan yerler | Her yerde, özellikle uzak bölgeler |
| **Güncelleme Hızı** | 30 saniye | 60 saniye (güç tasarrufu) |

## 🎯 Hangi Versiyonu Seçmeliyim?

**WiFi Versiyonu Seçin Eğer:**
- Şehir içi kullanım
- WiFi erişimi olan bölgeler
- Düşük güç tüketimi istiyorsanız
- Maliyeti düşük tutmak istiyorsanız

**GSM Versiyonu Seçin Eğer:**
- Her yerde çalışması gerekiyorsa
- WiFi erişimi olmayan bölgeler
- Uzun mesafe takip
- Profesyonel kullanım

## 📊 Veri Kullanımı ve Maliyet

- Her konum güncellemesi: ~1-2 KB
- 60 saniyede bir güncelleme = saatte ~120 KB
- Günlük kullanım: ~2.8 MB
- Aylık kullanım: ~85 MB

**Türkiye'de Data Paketi Önerileri:**
- **Turkcell:** 1 GB paket (~50-100₺/ay)
- **Vodafone:** 1 GB paket (~50-100₺/ay)
- **Türk Telekom:** 1 GB paket (~50-100₺/ay)

1 GB paket aylık kullanım için yeterlidir (yaklaşık 10 araç için).

## 🔐 Güvenlik Notları

- Supabase `anon` key kullanılıyor - RLS politikaları sayesinde güvenli
- SIM kart PIN kodunu kapatın (cihaz açılışında sorun çıkmasın)
- Production ortamında ESP32'ler için özel API key kullanmayı düşünün

## 🆘 Destek

Sorun yaşarsanız:
1. Serial Monitor çıktısını kontrol edin
2. GSM modülü AT komutlarını manuel test edin
3. SIM kart ve data paketini kontrol edin
4. Supabase Dashboard → Logs bölümünden API isteklerini kontrol edin



