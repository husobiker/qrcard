# Deployment Guide - qrcard.gozcu.tech

## Sunucu Bilgileri
- **IP**: 64.226.80.107
- **Domain**: qrcard.gozcu.tech
- **Port**: 3040 (production)

## Sunucuda Kurulum Adımları

### 1. Gerekli Paketleri Yükleyin
```bash
# Node.js ve npm yüklü olmalı (v18+ önerilir)
node --version
npm --version

# PM2 (process manager) yükleyin
npm install -g pm2
```

### 2. Projeyi Clone Edin
```bash
cd /var/www  # veya uygun bir dizin
git clone https://github.com/husobiker/qrcard.git
cd qrcard
```

### 3. Bağımlılıkları Yükleyin
```bash
npm install
```

### 4. Environment Variables
`.env` dosyası oluşturun (varsa `.env.example` dosyasından kopyalayın):
```bash
cp .env.example .env
# .env dosyasını düzenleyin ve Supabase bilgilerini ekleyin
```

### 5. Production Build
```bash
npm run build
```

### 6. PM2 ile Çalıştırın
```bash
# PM2 ile başlat
pm2 start npm --name "qrcard" -- start

# Veya direkt olarak
pm2 start "npm run preview" --name "qrcard"

# PM2 loglarını görüntüle
pm2 logs qrcard

# PM2 durumunu kontrol et
pm2 status

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
pm2 save
```

### 7. Nginx Yapılandırması (Opsiyonel)
Eğer Nginx reverse proxy kullanıyorsanız:

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

### 8. SSL Sertifikası (Let's Encrypt)
```bash
sudo certbot --nginx -d qrcard.gozcu.tech
```

## Güncelleme Adımları

```bash
cd /var/www/qrcard  # veya proje dizininiz
git pull origin main
npm install
npm run build
pm2 restart qrcard
```

## Supabase Migrations

Sunucuda Supabase CLI yüklüyse:
```bash
# Supabase migrations'ları çalıştır
supabase db push
```

Veya Supabase Dashboard üzerinden migration dosyalarını manuel olarak çalıştırabilirsiniz.

## Troubleshooting

### Port Zaten Kullanılıyor
```bash
# Port 3040'ı kullanan process'i bul
lsof -i :3040
# Process'i sonlandır
kill -9 <PID>
```

### PM2 Logları
```bash
pm2 logs qrcard --lines 100
```

### PM2 Yeniden Başlatma
```bash
pm2 restart qrcard
```

### Build Hataları
```bash
# Node modules'ı temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Firewall Ayarları

```bash
# Port 3040'ı aç (eğer firewall aktifse)
sudo ufw allow 3040/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```
