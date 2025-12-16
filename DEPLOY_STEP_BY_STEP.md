# 🚀 Adım Adım Deployment Rehberi

Bu rehber, sunucuda sıfırdan deployment yapmak için adım adım talimatlar içerir.

## 📋 Ön Bilgiler

- **IP Adresi**: 72.62.44.200
- **Domain**: qrcard.gozcu.tech
- **Port**: 3040 (PM2)
- **Build**: ✅ Tamamlandı (`npm run build` yapıldı)

---

## 🔧 ADIM 1: PM2 (Ecosystem) Kurulumu

### 1.1 Proje Dizinine Gidin

```bash
# Önce projenizin nerede olduğunu bulun
pwd
# Örnek: /var/www/qrcard veya /home/user/gozcuqr

cd /var/www/qrcard  # veya projenizin dizini
```

### 1.2 Ecosystem Config Dosyasını Güncelleyin

```bash
nano ecosystem.config.cjs
```

**ÖNEMLİ:** `cwd` değerini projenizin tam yoluna güncelleyin:

```javascript
module.exports = {
  apps: [
    {
      name: "qrcard-web",
      script: "npm",
      args: "run start",
      cwd: "/var/www/qrcard", // ← BURAYA PROJENİZİN TAM YOLUNU YAZIN
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3040,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
```

**Kaydetmek için:** `Ctrl + X`, sonra `Y`, sonra `Enter`

### 1.3 Logs Klasörü Oluşturun

```bash
mkdir -p logs
```

### 1.4 PM2 ile Uygulamayı Başlatın

```bash
pm2 start ecosystem.config.cjs
```

### 1.5 PM2 Durumunu Kontrol Edin

```bash
pm2 status
```

**Beklenen çıktı:**

```
┌─────┬──────────────┬─────────┬─────────┬──────────┬─────────┐
│ id  │ name         │ mode    │ ↺       │ status   │ cpu     │
├─────┼──────────────┼─────────┼─────────┼──────────┼─────────┤
│ 0   │ qrcard-web   │ fork    │ 0       │ online   │ 0%      │
└─────┴──────────────┴─────────┴─────────┴──────────┴─────────┘
```

### 1.6 Logları Kontrol Edin

```bash
pm2 logs qrcard-web
```

**Kontrol edin:**

- ✅ "Local: http://localhost:3040" mesajını görmelisiniz
- ❌ Hata varsa, hata mesajını not edin

**Loglardan çıkmak için:** `Ctrl + C`

### 1.7 PM2'yi Sistem Başlangıcında Aktifleştirin

```bash
pm2 startup
```

Bu komut size bir komut verecek, örneğin:

```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u youruser --hp /home/youruser
```

**Bu komutu kopyalayıp çalıştırın (sudo ile):**

```bash
# Örnek (sizin için farklı olabilir):
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u youruser --hp /home/youruser
```

Sonra:

```bash
pm2 save
```

### 1.8 Test: Localhost'ta Çalışıyor mu?

```bash
curl http://localhost:3040
```

**Beklenen:** HTML içeriği dönmeli (hata sayfası değil)

---

## 🌐 ADIM 2: Nginx Kurulumu ve Yapılandırması

### 2.1 Nginx Yüklü mü Kontrol Edin

```bash
nginx -v
```

**Eğer yüklü değilse:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

### 2.2 Nginx Config Dosyasını Oluşturun

```bash
sudo nano /etc/nginx/sites-available/qrcard.gozcu.tech
```

**İçeriği yapıştırın:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name qrcard.gozcu.tech 72.62.44.200;

    access_log /var/log/nginx/qrcard-access.log;
    error_log /var/log/nginx/qrcard-error.log;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3040;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3040;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Kaydetmek için:** `Ctrl + X`, sonra `Y`, sonra `Enter`

### 2.3 Symbolic Link Oluşturun

```bash
sudo ln -s /etc/nginx/sites-available/qrcard.gozcu.tech /etc/nginx/sites-enabled/
```

### 2.4 Nginx Config'i Test Edin

```bash
sudo nginx -t
```

**Beklenen çıktı:**

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 2.5 Nginx'i Yeniden Başlatın

```bash
sudo systemctl reload nginx
# veya
sudo systemctl restart nginx
```

### 2.6 Nginx Durumunu Kontrol Edin

```bash
sudo systemctl status nginx
```

**Beklenen:** `active (running)`

---

## ✅ ADIM 3: Test ve Doğrulama

### 3.1 IP Adresi ile Test

```bash
curl http://72.62.44.200
```

**Beklenen:** HTML içeriği dönmeli

### 3.2 Domain ile Test (DNS ayarlıysa)

```bash
curl http://qrcard.gozcu.tech
```

**Beklenen:** HTML içeriği dönmeli

### 3.3 Tarayıcıda Test

1. Tarayıcınızda şu adresi açın:

   - `http://72.62.44.200`
   - veya `http://qrcard.gozcu.tech` (DNS ayarlıysa)

2. **Kontrol edin:**
   - ✅ Sayfa yükleniyor mu?
   - ✅ Hata var mı?
   - ✅ Console'da hata var mı? (F12 > Console)

---

## 🔒 ADIM 4: SSL Kurulumu (Opsiyonel - Önerilen)

### 4.1 Certbot Yükleyin

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### 4.2 SSL Sertifikası Alın

```bash
sudo certbot --nginx -d qrcard.gozcu.tech
```

**Sorular:**

- Email adresi girin
- Terms of Service'i kabul edin (A)
- Email paylaşımını seçin (N önerilir)
- Redirect HTTP to HTTPS? (2 - Evet, önerilir)

### 4.3 Otomatik Yenileme Test Edin

```bash
sudo certbot renew --dry-run
```

---

## 🆘 Sorun Giderme

### PM2 Çalışmıyor

```bash
# Logları kontrol edin
pm2 logs qrcard-web --lines 50

# Yeniden başlatın
pm2 restart qrcard-web

# Port kullanımda mı?
lsof -i :3040
```

### Nginx Çalışmıyor

```bash
# Nginx loglarını kontrol edin
sudo tail -f /var/log/nginx/qrcard-error.log

# Nginx durumunu kontrol edin
sudo systemctl status nginx

# Config'i tekrar test edin
sudo nginx -t
```

### Port 3040 Erişilemiyor

```bash
# Firewall kontrolü
sudo ufw status
sudo ufw allow 3040/tcp  # Gerekirse

# PM2 çalışıyor mu?
pm2 status
```

### Domain Çalışmıyor

1. **DNS kayıtlarını kontrol edin:**

   - `qrcard.gozcu.tech` → `72.62.44.200` (A kaydı)
   - DNS yayılması 5-30 dakika sürebilir

2. **DNS kontrolü:**
   ```bash
   nslookup qrcard.gozcu.tech
   # veya
   dig qrcard.gozcu.tech
   ```

---

## 📝 Özet Komutlar

```bash
# PM2
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs qrcard-web
pm2 restart qrcard-web
pm2 save

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx

# Test
curl http://localhost:3040
curl http://72.62.44.200
curl http://qrcard.gozcu.tech
```

---

## ✅ Deployment Checklist

- [ ] Ecosystem config'de `cwd` path'i güncellendi
- [ ] PM2 başlatıldı ve çalışıyor (`pm2 status`)
- [ ] PM2 loglarında hata yok
- [ ] `localhost:3040` çalışıyor
- [ ] Nginx config dosyası oluşturuldu
- [ ] Nginx config test edildi (`nginx -t`)
- [ ] Nginx yeniden başlatıldı
- [ ] IP adresi ile erişim çalışıyor
- [ ] Domain ile erişim çalışıyor (DNS ayarlıysa)
- [ ] PM2 sistem başlangıcında aktif (`pm2 startup` + `pm2 save`)
- [ ] SSL kuruldu (opsiyonel)

---

**🎉 Başarılı deployment!**
