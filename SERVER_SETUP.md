# Sunucu Kurulum Rehberi

## Hızlı Kurulum (Önerilen)

```bash
# 1. Proje dizinine gidin
cd /var/www/qrcard

# 2. Projeyi klonlayın (ilk kurulumda)
git clone https://github.com/your-username/gozcuqr.git .
# veya mevcut projeyi güncelleyin
git pull origin main

# 3. Deploy script'ini çalıştırılabilir yapın
chmod +x deploy.sh

# 4. Deploy script'ini çalıştırın
./deploy.sh
```

Script size rehberlik edecek ve gerekli adımları otomatik olarak yapacaktır.

## Manuel Kurulum

### Adım 1: Environment Variables Oluştur

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

### Adım 2: PM2 Config Dosyasını Güncelle

```bash
nano ecosystem.config.cjs
```

`cwd` değerini güncelleyin:

```javascript
cwd: '/var/www/qrcard',
```

### Adım 3: Dependencies Yükle

```bash
npm install
```

### Adım 4: Build Oluştur

```bash
npm run build
```

Bu komut `dist/` klasörü oluşturacak.

### Adım 5: Logs Klasörü Oluştur

```bash
mkdir -p logs
```

### Adım 6: PM2 ile Başlat

```bash
pm2 start ecosystem.config.cjs
```

### Adım 7: PM2 Durumunu Kontrol Et

```bash
pm2 status
pm2 logs qrcard-web
```

### Adım 8: PM2'yi Sistem Başlangıcında Otomatik Başlat

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

### Otomatik (Önerilen)

```bash
cd /var/www/qrcard
git pull origin main
./deploy.sh
```

### Manuel

```bash
cd /var/www/qrcard
git pull origin main
npm install
npm run build
pm2 restart qrcard-web
```
