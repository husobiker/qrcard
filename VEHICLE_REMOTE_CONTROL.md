# Araç Uzaktan Kontrol Sistemi - Teknik Dokümantasyon

## ⚠️ ÖNEMLİ UYARILAR

**Güvenlik ve Yasal Uyarılar:**

1. **Yasal Sorumluluk:** Uzaktan araç durdurma özelliği yasal düzenlemelere tabi olabilir. Kullanmadan önce yasal danışmanlık alın.
2. **Güvenlik Riski:** Yanlış kullanım veya sistem hatası ciddi kazalara yol açabilir.
3. **Sorumluluk:** Bu özellik sadece yetkili kişiler tarafından, acil durumlarda kullanılmalıdır.
4. **Test:** Sistem mutlaka güvenli ortamda test edilmelidir.

---

## 🔧 Uzaktan Durdurma İçin Gerekli Donanım

### Temel Sistem (Mevcut)

- ✅ ESP32 Development Board
- ✅ GPS Modülü (NEO-6M)
- ✅ GSM/4G Modülü (SIM800L/SIM7600)

### Ek Donanım (Uzaktan Kontrol İçin)

| #   | Malzeme                          | Miktar | Fiyat (₺) | Açıklama                             |
| --- | -------------------------------- | ------ | --------- | ------------------------------------ |
| 1   | **Relay Modülü (4 Kanal)**       | 1      | 20-50₺    | Araç kontaklarını kontrol etmek için |
| 2   | **Immobilizer Relay**            | 1      | 30-80₺    | Yakıt pompası veya kontak kesme      |
| 3   | **OBD-II Konnektör (Opsiyonel)** | 1      | 50-150₺   | Modern araçlar için ECU kontrolü     |
| 4   | **Fuse Box Adaptörü**            | 1      | 20-50₺    | Araç sigorta kutusuna entegrasyon    |
| 5   | **Kontak Kesme Switch**          | 1      | 15-40₺    | Manuel override için                 |
| 6   | **Güvenlik Rölesi**              | 1      | 30-60₺    | Çift kontrol için güvenlik rölesi    |
| 7   | **LED Göstergeler**              | 2      | 5-15₺     | Durum göstergesi (kırmızı/yeşil)     |
| 8   | **Buzzer (Opsiyonel)**           | 1      | 5-10₺     | Uyarı sesi                           |

**Toplam Ek Maliyet: ~135-415₺**

---

## 🔌 Bağlantı Şemaları

### Seçenek 1: Yakıt Pompası Kontrolü (Önerilen - Güvenli)

```
ESP32 GPIO → Relay Modülü → Yakıt Pompası Rölesi → Yakıt Pompası
```

**Avantajları:**

- Motor yavaşça durur (güvenli)
- Fren ve direksiyon çalışır
- Acil durumlarda güvenli

**Dezavantajları:**

- Motor birkaç saniye çalışmaya devam eder
- Bazı araçlarda yakıt pompası erişimi zor olabilir

### Seçenek 2: Kontak Kesme (Hızlı - Dikkatli Kullanılmalı)

```
ESP32 GPIO → Relay Modülü → Kontak Rölesi → Kontak
```

**Avantajları:**

- Anında motor durur
- Hızlı müdahale

**Dezavantajları:**

- Fren ve direksiyon gücü kaybolabilir (tehlikeli!)
- Elektrikli sistemler kapanır
- Sadece acil durumlarda kullanılmalı

### Seçenek 3: OBD-II Kontrolü (Modern Araçlar - En Güvenli)

```
ESP32 → OBD-II Konnektör → ECU → Motor Kontrolü
```

**Avantajları:**

- En güvenli yöntem
- ECU seviyesinde kontrol
- Araç güvenlik sistemleri devrede kalır

**Dezavantajları:**

- Sadece modern araçlarda çalışır (2000+)
- Daha pahalı
- Araç markasına göre farklılık gösterir

---

## 💻 Yazılım Gereksinimleri

### 1. Veritabanı Değişiklikleri

**Yeni Tablo: `vehicle_commands`**

```sql
CREATE TABLE vehicle_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  command_type TEXT NOT NULL CHECK (command_type IN ('stop', 'start', 'lock', 'unlock')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'executed', 'failed')),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);
```

### 2. ESP32 Kod Değişiklikleri

**Eklenmesi Gerekenler:**

- Relay kontrol fonksiyonları
- Komut alma (Supabase'den polling veya WebSocket)
- Güvenlik doğrulama (komut şifreleme)
- Manuel override butonu
- Durum geri bildirimi

### 3. Web Arayüzü Değişiklikleri

**Eklenmesi Gerekenler:**

- "Araç Durdur" butonu (güvenlik onayı ile)
- "Araç Başlat" butonu
- Komut durumu göstergesi
- Yetkilendirme kontrolü (sadece admin)

---

## 🛡️ Güvenlik Önlemleri

### 1. Çoklu Onay Sistemi

- Web arayüzünde 2 aşamalı onay
- SMS doğrulama (opsiyonel)
- Admin onayı zorunlu

### 2. Komut Şifreleme

- Her komut benzersiz token ile
- Zaman damgası kontrolü
- Replay attack koruması

### 3. Manuel Override

- Araç içinde fiziksel buton
- Acil durumlarda manuel kontrol
- Sürücü bilgilendirmesi

### 4. Güvenlik Rölesi

- Çift röle sistemi (fail-safe)
- Bir röle bozulsa diğeri çalışır
- Manuel bypass mekanizması

---

## 📋 Uygulama Adımları

### Adım 1: Donanım Kurulumu

1. Relay modülünü ESP32'ye bağla
2. Yakıt pompası rölesine bağla (veya kontak)
3. Güvenlik rölesini ekle
4. Manuel override butonunu ekle
5. LED göstergelerini bağla

### Adım 2: Yazılım Geliştirme

1. Veritabanı tablosunu oluştur
2. ESP32 kodunu güncelle (relay kontrolü ekle)
3. Web arayüzüne buton ekle
4. Güvenlik kontrollerini ekle
5. Test et (güvenli ortamda!)

### Adım 3: Test ve Doğrulama

1. Statik test (araç çalışmazken)
2. Dinamik test (güvenli alanda, düşük hızda)
3. Güvenlik testleri (hack denemeleri)
4. Yedekleme sistemleri testi

---

## 💰 Maliyet Özeti

### Mevcut Sistem

- GPS Takip: ~340-710₺

### Uzaktan Kontrol Eklentisi

- Ek Donanım: ~135-415₺
- Yazılım Geliştirme: (iş gücü)
- Test ve Sertifikasyon: (iş gücü)

### Toplam

- **Temel Takip:** ~340-710₺
- **Takip + Uzaktan Kontrol:** ~475-1125₺

---

## ⚡ Hızlı Başlangıç (Test İçin)

**Minimum Test Paketi:**

1. ESP32 + GPS + GSM (mevcut)
2. 1 Kanal Relay Modülü (20₺)
3. Test LED'i (5₺)
4. Jumper kablolar (10₺)

**Toplam: ~35₺** ile test edebilirsiniz!

---

## 🎯 Önerilen Yaklaşım

### Aşama 1: Temel Takip (Mevcut)

- ✅ GPS takibi
- ✅ Konum görüntüleme
- ✅ Hız ve rota takibi

### Aşama 2: Uzaktan Kontrol (Eklenebilir)

- 🔄 Yakıt pompası kontrolü (güvenli)
- 🔄 Durum bildirimi
- 🔄 Manuel override

### Aşama 3: Gelişmiş Özellikler

- 🔄 OBD-II entegrasyonu
- 🔄 Çarpma algılama
- 🔄 Acil durum bildirimi
- 🔄 Geofencing (bölge sınırı)

---

## 📞 Teknik Destek

- **ESP32 Relay Kontrol:** https://randomnerdtutorials.com/esp32-relay-module-ac-arduino/
- **OBD-II Protokolü:** https://en.wikipedia.org/wiki/On-board_diagnostics
- **Araç Güvenlik Sistemleri:** Yerel otomotiv uzmanına danışın

---

## ⚠️ Son Uyarı

**Uzaktan araç durdurma ciddi bir güvenlik özelliğidir.**

- Mutlaka profesyonel kurulum yapın
- Yasal düzenlemelere uyun
- Güvenlik testlerini atlamayın
- Kullanıcı eğitimi verin
- Acil durum prosedürleri hazırlayın

