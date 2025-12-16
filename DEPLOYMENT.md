# Deployment Guide - QR Card Web Application

## Sunucu Bilgileri

- **Domain**: qrcard.gozcu.tech
- **IP**: 178.157.15.26
- **Port**: 3040
- **PM2**: Process Manager

## Ön Gereksinimler

1. Node.js 18+ yüklü olmalı
2. PM2 global olarak yüklü olmalı: `npm install -g pm2`
3. Git yüklü olmalı
4. Nginx veya benzeri reverse proxy (opsiyonel, domain için)

## Deployment Adımları

### Hızlı Deployment (Önerilen)

Otomatik deployment script'i kullanarak:

```bash
# 1. GitHub'a push edin
git add .
git commit -m "Production ready"
git push origin main

# 2. Sunucuya SSH ile bağlanın
ssh user@178.157.15.26

# 3. Proje dizinine gidin
cd /var/www/qrcard  # veya projenizin bulunduğu dizin

# 4. Güncellemeleri çekin (ilk kurulumda: git clone ...)
git pull origin main

# 5. Deploy script'ini çalıştırılabilir yapın
chmod +x deploy.sh

# 6. Deploy script'ini çalıştırın
./deploy.sh
```

Script otomatik olarak:

- ✅ Ön kontrolleri yapar
- ✅ Dependencies yükler
- ✅ Production build oluşturur
- ✅ PM2 ile uygulamayı başlatır/yeniden başlatır

### Manuel Deployment

Eğer script kullanmak istemiyorsanız:

#### 1. GitHub'a Push

```bash
# Projeyi GitHub'a push edin
git add .
git commit -m "Production ready"
git push origin main
```

#### 2. Sunucuda Projeyi Çekme

```bash
# Sunucuya SSH ile bağlanın
ssh user@178.157.15.26

# Proje dizinine gidin (veya oluşturun)
cd /var/www/qrcard  # veya projenizin bulunduğu dizin
git clone https://github.com/your-username/gozcuqr.git
cd gozcuqr
```

#### 3. Environment Variables Ayarlama

```bash
# .env dosyası oluşturun
cp .env.production .env

# .env dosyasını düzenleyin ve Supabase bilgilerini ekleyin
nano .env
```

`.env` dosyası şu şekilde olmalı:

```env
VITE_PUBLIC_URL=https://qrcard.gozcu.tech
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4. Dependencies Yükleme

```bash
npm install
```

#### 5. Production Build

```bash
npm run build
```

Bu komut `dist/` klasörü oluşturacak.

#### 6. PM2 Configuration

```bash
# ecosystem.config.cjs dosyasını düzenleyin
nano ecosystem.config.cjs
```

`cwd` değerini proje dizininize göre güncelleyin:

```javascript
cwd: '/var/www/qrcard',  // veya projenizin tam yolu
```

#### 7. PM2 ile Başlatma

```bash
# Logs klasörü oluşturun
mkdir -p logs

# PM2 ile uygulamayı başlatın
pm2 start ecosystem.config.cjs

# PM2'yi sistem başlangıcında otomatik başlatmak için
pm2 startup
pm2 save
```

### 8. PM2 Komutları

```bash
# Durumu kontrol et
pm2 status

# Logları görüntüle
pm2 logs qrcard-web

# Yeniden başlat
pm2 restart qrcard-web

# Durdur
pm2 stop qrcard-web

# Sil
pm2 delete qrcard-web
```

### 9. Nginx Configuration (Opsiyonel - Domain için)

Eğer domain kullanacaksanız, Nginx reverse proxy ayarları:

```nginx
server {
    listen 80;
    server_name qrcard.gozcu.tech;

    location / {
        proxy_pass http://localhost:3040;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL için Let's Encrypt:

```bash
sudo certbot --nginx -d qrcard.gozcu.tech
```

## Güncelleme İşlemi

Yeni bir güncelleme geldiğinde:

### Otomatik (Önerilen)

```bash
cd /var/www/qrcard  # veya projenizin dizini
git pull origin main
./deploy.sh
```

### Manuel

```bash
# Proje dizinine gidin
cd /var/www/qrcard  # veya projenizin dizini

# Değişiklikleri çekin
git pull origin main

# Dependencies güncelleyin (gerekirse)
npm install

# Yeni build oluşturun
npm run build

# PM2'yi yeniden başlatın
pm2 restart qrcard-web
```

## Sorun Giderme

### Port 3040 kullanımda

```bash
# Port'u kullanan process'i bulun
lsof -i :3040

# Process'i sonlandırın
kill -9 <PID>
```

### PM2 logları kontrol

```bash
pm2 logs qrcard-web --lines 100
```

### Build hatası

```bash
# Node modules'ü temizleyip yeniden yükleyin
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Notlar

- Production build'de `VITE_PUBLIC_URL` environment variable'ı kullanılır
- Eğer bu değişken set edilmemişse, `window.location.origin` kullanılır
- QR kodlar ve public URL'ler otomatik olarak `qrcard.gozcu.tech` domain'ini kullanır
