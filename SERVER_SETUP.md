# Sunucu Kurulum Rehberi

## Adım 1: Environment Variables Oluştur

```bash
cd /var/www/qrcard
cp .env.production .env
nano .env
```

`.env` dosyasına şunları ekleyin:
```env
VITE_PUBLIC_URL=https://qrcard.gozcu.tech
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Adım 2: PM2 Config Dosyasını Güncelle

```bash
nano ecosystem.config.js
```

`cwd` değerini güncelleyin:
```javascript
cwd: '/var/www/qrcard',
```

## Adım 3: Build Oluştur

```bash
npm run build
```

Bu komut `dist/` klasörü oluşturacak.

## Adım 4: Logs Klasörü Oluştur

```bash
mkdir -p logs
```

## Adım 5: PM2 ile Başlat

```bash
pm2 start ecosystem.config.js
```

## Adım 6: PM2 Durumunu Kontrol Et

```bash
pm2 status
pm2 logs qrcard-web
```

## Adım 7: PM2'yi Sistem Başlangıcında Otomatik Başlat

```bash
pm2 startup
# Çıkan komutu çalıştırın (sudo ile)
pm2 save
```

## Sorun Giderme

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

## Güncelleme İşlemi

Yeni bir güncelleme geldiğinde:

```bash
cd /var/www/qrcard
git pull origin main
npm install
npm run build
pm2 restart qrcard-web
```

