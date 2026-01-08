# ESP32 Araç Takip Cihazı - Malzeme Listesi

## 📦 Temel Malzeme Listesi (Minimum Gereksinimler)

### Zorunlu Bileşenler

| # | Malzeme | Miktar | Açıklama | Tahmini Fiyat (₺) |
|---|---------|--------|----------|-------------------|
| 1 | **ESP32 Development Board** | 1 adet | ESP32-WROOM-32 veya ESP32-DevKitC | 80-150₺ |
| 2 | **NEO-6M GPS Modülü** | 1 adet | U-blox NEO-6M GPS Receiver (anten dahil) | 50-100₺ |
| 3 | **Jumper Kablolar** | 10 adet | Dupont kablolar (erkek-erkek) | 10-20₺ |
| 4 | **USB Kablosu** | 1 adet | Micro USB veya USB-C (ESP32 programlama için) | 15-30₺ |
| 5 | **Breadboard (Opsiyonel)** | 1 adet | Prototip için 400 delikli breadboard | 20-40₺ |

**Toplam Temel Maliyet: ~175-340₺**

---

## 🔋 Güç Kaynağı Seçenekleri

### Seçenek 1: USB Güç (Test/Prototip İçin)
| # | Malzeme | Miktar | Açıklama | Tahmini Fiyat (₺) |
|---|---------|--------|----------|-------------------|
| 1 | **USB Car Charger** | 1 adet | 12V-5V dönüştürücü, 2A çıkış | 30-60₺ |
| 2 | **USB Kablosu (Uzun)** | 1 adet | 1-2 metre Micro USB kablo | 20-40₺ |

**Toplam: ~50-100₺**

### Seçenek 2: Doğrudan 12V Bağlantı (Profesyonel)
| # | Malzeme | Miktar | Açıklama | Tahmini Fiyat (₺) |
|---|---------|--------|----------|-------------------|
| 1 | **DC-DC Step Down Converter** | 1 adet | 12V-5V, 3A (LM2596 veya benzeri) | 15-30₺ |
| 2 | **Fuse Holder + Fuse** | 1 adet | 5A sigorta ve tutucu | 10-20₺ |
| 3 | **DC Jack (Opsiyonel)** | 1 adet | 12V güç girişi için | 5-15₺ |

**Toplam: ~30-65₺**

---

## 📡 Gelişmiş Özellikler (Opsiyonel)

### GSM/4G Modülü (WiFi Olmadan Çalışma) - **ÖNERİLEN**
| # | Malzeme | Miktar | Açıklama | Tahmini Fiyat (₺) |
|---|---------|--------|----------|-------------------|
| 1 | **SIM800L GSM Modülü** | 1 adet | 2G GSM/GPRS modülü (Türkiye'de 2G hala aktif) | 40-80₺ |
| 2 | **SIM Kart** | 1 adet | Data paketi olan SIM kart (Turkcell/Vodafone/TT) | Aylık paket |
| 3 | **GSM Anteni** | 1 adet | GSM modülü için anten (genelde modülle birlikte gelir) | 10-20₺ |
| 4 | **Voltage Regulator** | 1 adet | 5V-4V (GSM modülü için, modülde olabilir) | 5-10₺ |
| 5 | **SIM Kart Tutucu** | 1 adet | SIM kart için tutucu (modülde olabilir) | Dahil |

**Toplam: ~55-110₺**

**Alternatif:** SIM800L yerine daha modern **SIM7600 4G modülü** de kullanılabilir (~200-400₺)
- 4G daha hızlı ve güvenilir
- Daha yüksek veri hızı
- Daha iyi sinyal kalitesi
- Ancak daha pahalı

**Önemli Not:** Türkiye'de 2G ağı hala aktif olduğu için SIM800L yeterlidir ve daha ekonomiktir.

### Batarya Yönetimi (Kesintisiz Çalışma)
| # | Malzeme | Miktar | Açıklama | Tahmini Fiyat (₺) |
|---|---------|--------|----------|-------------------|
| 1 | **Li-Po Batarya** | 1 adet | 3.7V, 2000mAh veya daha büyük | 50-100₺ |
| 2 | **TP4056 Charger Modülü** | 1 adet | Li-Po şarj modülü | 10-20₺ |
| 3 | **Batarya Koruması** | 1 adet | Overcharge/overdischarge koruması | 10-20₺ |

**Toplam: ~70-140₺**

### Ek Sensörler
| # | Malzeme | Miktar | Açıklama | Tahmini Fiyat (₺) |
|---|---------|--------|----------|-------------------|
| 1 | **MPU6050 Gyro/Accelerometer** | 1 adet | Hızlanma, eğim, çarpma algılama | 20-40₺ |
| 2 | **DS18B20 Sıcaklık Sensörü** | 1 adet | Motor sıcaklığı takibi | 10-20₺ |
| 3 | **Hall Effect Sensörü** | 1 adet | Yakıt seviyesi takibi | 15-30₺ |

**Toplam: ~45-90₺**

---

## 🛠️ Kasa ve Montaj Malzemeleri

| # | Malzeme | Miktar | Açıklama | Tahmini Fiyat (₺) |
|---|---------|--------|----------|-------------------|
| 1 | **Elektronik Kutu** | 1 adet | IP65 veya IP67 su geçirmez kutu (100x80x50mm) | 50-150₺ |
| 2 | **GPS Anten Kablosu** | 1 adet | Uzatılmış GPS anten kablosu (1-3 metre) | 30-60₺ |
| 3 | **GPS Anten Montajı** | 1 adet | Araç dışına montaj için tutucu | 20-50₺ |
| 4 | **Kablo Kanalı/Koruyucu** | 2 metre | Güç kablosu için koruyucu | 20-40₺ |
| 5 | **Vida ve Somun Seti** | 1 set | M3 veya M4 vida seti | 10-20₺ |
| 6 | **Çift Taraflı Bant** | 1 adet | 3M VHB veya benzeri | 15-30₺ |

**Toplam: ~145-400₺**

---

## 📊 Fiyatlandırma Özeti

### Paket 1: Temel Paket (Test/Prototip)
- ESP32 + GPS + Kablolar + USB Güç
- **Toplam: ~225-440₺**
- **Kullanım:** Test ve geliştirme için

### Paket 2: Standart Paket (Araçta Kullanım)
- Temel Paket + 12V Güç Dönüştürücü + Kasa + Montaj
- **Toplam: ~400-905₺**
- **Kullanım:** Gerçek araç takibi için

### Paket 3: Profesyonel Paket (GSM + Batarya)
- Standart Paket + GSM Modülü + Batarya Yönetimi
- **Toplam: ~525-1155₺**
- **Kullanım:** WiFi olmadan, kesintisiz takip

### Paket 4: Premium Paket (Tüm Özellikler)
- Profesyonel Paket + Ek Sensörler + Gelişmiş Kasa
- **Toplam: ~670-1645₺**
- **Kullanım:** Tam özellikli, profesyonel takip sistemi

---

## 🛒 Satın Alma Önerileri

### Türkiye'de Satın Alma

1. **Online Mağazalar:**
   - **Robolink Market** (robolinkmarket.com)
   - **Robotistan** (robotistan.com)
   - **N11, GittiGidiyor, Trendyol** (elektronik komponentler)
   - **AliExpress** (uluslararası, daha ucuz ama bekleme süresi var)

2. **Yerel Elektronik Mağazaları:**
   - İstanbul: Kadıköy, Karaköy elektronik çarşıları
   - Ankara: Ulus elektronik çarşıları
   - İzmir: Konak elektronik mağazaları

### Önemli Notlar

- **ESP32:** WROOM-32 modülü önerilir (WiFi + Bluetooth)
- **GPS:** NEO-6M veya NEO-8M (8M daha hızlı fix alır)
- **Kalite:** Çin malı ucuz ürünlerden kaçının, kaliteli markalar tercih edin
- **Garanti:** Mümkünse garantili ürün alın

---

## 🔧 Araç Gereçler (Gerekli)

| # | Araç | Açıklama |
|---|------|----------|
| 1 | **Lehim Makinesi** | 40W veya üzeri (kasa montajı için) |
| 2 | **Lehim Teli** | Kalaylı lehim teli |
| 3 | **Multimetre** | Voltaj ve akım ölçümü için |
| 4 | **Yan Keski** | Kabloları kesmek için |
| 5 | **Pens** | İnce işler için |
| 6 | **İzolasyon Bandı** | Elektriksel izolasyon |
| 7 | **Sıcak Silikon Tabancası** | Kasa içi sabitleme (opsiyonel) |

---

## 📋 Montaj İçin Ek Malzemeler

| # | Malzeme | Miktar | Açıklama |
|---|---------|--------|----------|
| 1 | **Termo Rötre Tüp** | 1 metre | Kabloları korumak için |
| 2 | **Kablo Pabuçları** | 10 adet | Güvenli bağlantı için |
| 3 | **Wago Klemens** | 5 adet | Hızlı bağlantı için (opsiyonel) |
| 4 | **Ferrit Halka** | 2 adet | Elektromanyetik gürültü azaltma |

---

## 💡 Maliyet Optimizasyonu İpuçları

1. **Toplu Alım:** Birden fazla cihaz yapacaksanız, toplu alım yapın (%10-20 indirim)
2. **AliExpress:** Tek tek alım için daha ucuz ama 2-4 hafta bekleme
3. **Yerel Üreticiler:** ESP32 ve GPS modüllerini yerel üreticilerden alabilirsiniz
4. **İkinci El:** Test için ikinci el ESP32 alabilirsiniz (daha ucuz)
5. **Kasa:** Basit plastik kutu kullanarak maliyeti düşürebilirsiniz

---

## ⚠️ Önemli Uyarılar

1. **Güç Kaynağı:** Araçta kullanım için mutlaka sigorta kullanın
2. **Su Geçirmezlik:** Araç dışına monte edilecekse IP65+ kasa kullanın
3. **Sıcaklık:** Araç içi sıcaklık -20°C ile +70°C arasında olabilir, bileşenleri kontrol edin
4. **Titreşim:** Araç titreşimlerine dayanıklı montaj yapın
5. **EMI:** Motor ve diğer elektronik cihazlardan gelen gürültüye karşı koruma yapın

---

## 📞 Teknik Destek ve Kaynaklar

- **ESP32 Dokümantasyonu:** https://docs.espressif.com/
- **TinyGPS++ Kütüphanesi:** https://github.com/mikalhart/TinyGPSPlus
- **Supabase Dokümantasyonu:** https://supabase.com/docs

---

## 🎯 Hızlı Başlangıç Paketi Önerisi

**Minimum Test İçin:**
- ESP32 DevKit (100₺)
- NEO-6M GPS (70₺)
- Jumper kablolar (15₺)
- USB kablosu (20₺)
- USB car charger (40₺)

**Toplam: ~245₺** ile test edebilirsiniz!

Bu paketle breadboard üzerinde prototip yapabilir, kodları test edebilirsiniz. Çalıştığından emin olduktan sonra kasa ve montaj malzemelerini ekleyebilirsiniz.

