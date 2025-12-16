# 🚀 Hızlı Deployment Rehberi

Sunucuyu sıfırdan kurmak için bu adımları takip edin.

## ⚡ Hızlı Başlangıç

### 1. Sunucuya Bağlanın

```bash
ssh user@178.157.15.26
```

### 2. Proje Dizinine Gidin

```bash
cd /var/www/qrcard
# veya projenizin bulunduğu dizin
```

### 3. Projeyi Klonlayın (İlk Kurulum)

```bash
git clone https://github.com/your-username/gozcuqr.git .
```

### 4. Environment Variables Ayarlayın

```bash
# .env dosyası oluşturun
cp .env.production .env

# Düzenleyin
nano .env
```

**ÖNEMLİ:** `.env` dosyasında şu değerleri doldurun:

- `VITE_SUPABASE_URL` - Supabase proje URL'iniz
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key'iniz

### 5. PM2 Config'i Güncelleyin

```bash
nano ecosystem.config.cjs
```

`cwd` değerini proje dizininize göre güncelleyin:

```javascript
cwd: '/var/www/qrcard',  // Buraya projenizin tam yolunu yazın
```

### 6. Deploy Script'ini Çalıştırın

```bash
chmod +x deploy.sh
./deploy.sh
```

Script otomatik olarak:

- ✅ Kontrolleri yapar
- ✅ Dependencies yükler
- ✅ Build oluşturur
- ✅ PM2 ile başlatır

### 7. PM2'yi Sistem Başlangıcında Aktifleştirin

```bash
pm2 startup
# Çıkan komutu çalıştırın (sudo ile)
pm2 save
```

## ✅ Kontrol

```bash
# PM2 durumunu kontrol edin
pm2 status

# Logları görüntüleyin
pm2 logs qrcard-web

# Tarayıcıda test edin
# https://qrcard.gozcu.tech
```

## 🔄 Güncelleme

Yeni bir güncelleme geldiğinde:

```bash
cd /var/www/qrcard
git pull origin main
./deploy.sh
```

## 🆘 Sorun Giderme

### Port 3040 kullanımda

```bash
lsof -i :3040
kill -9 <PID>
```

### PM2 yeniden başlat

```bash
pm2 restart qrcard-web
```

### Logları kontrol et

```bash
pm2 logs qrcard-web --lines 100
```

### Build hatası

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 Notlar

- Supabase bilgilerinizi Supabase Dashboard > Settings > API'den alabilirsiniz
- `.env` dosyası asla Git'e commit edilmemelidir
- Production build'de `VITE_PUBLIC_URL` kullanılır
- QR kodlar otomatik olarak `qrcard.gozcu.tech` domain'ini kullanır
