#!/bin/bash

# Deployment Script for QR Card Application
# Kullanım: ./deploy.sh

set -e  # Hata durumunda dur

echo "🚀 QR Card Deployment Başlatılıyor..."

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kontroller
echo -e "${YELLOW}📋 Ön Kontroller Yapılıyor...${NC}"

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js bulunamadı! Lütfen Node.js 18+ yükleyin.${NC}"
    exit 1
fi

# PM2 kontrolü
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 bulunamadı. Yükleniyor...${NC}"
    npm install -g pm2
fi

# .env dosyası kontrolü
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı. .env.production'dan kopyalanıyor...${NC}"
    if [ -f .env.production ]; then
        cp .env.production .env
        echo -e "${RED}⚠️  LÜTFEN .env DOSYASINI DÜZENLEYİP SUPABASE BİLGİLERİNİ EKLEYİN!${NC}"
        echo -e "${YELLOW}Sonra tekrar ./deploy.sh çalıştırın.${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.production dosyası bulunamadı!${NC}"
        exit 1
    fi
fi

# Environment variables kontrolü
if ! grep -q "VITE_SUPABASE_URL=.*[^=]$" .env || grep -q "VITE_SUPABASE_URL=your_supabase_url_here" .env; then
    echo -e "${RED}❌ .env dosyasında VITE_SUPABASE_URL düzgün ayarlanmamış!${NC}"
    exit 1
fi

if ! grep -q "VITE_SUPABASE_ANON_KEY=.*[^=]$" .env || grep -q "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here" .env; then
    echo -e "${RED}❌ .env dosyasında VITE_SUPABASE_ANON_KEY düzgün ayarlanmamış!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ön kontroller tamamlandı!${NC}"

# Dependencies yükleme
echo -e "${YELLOW}📦 Dependencies yükleniyor...${NC}"
npm install

# Build oluşturma
echo -e "${YELLOW}🔨 Production build oluşturuluyor...${NC}"
npm run build

# Logs klasörü oluşturma
echo -e "${YELLOW}📁 Logs klasörü oluşturuluyor...${NC}"
mkdir -p logs

# PM2 durumunu kontrol et
if pm2 list | grep -q "qrcard-web"; then
    echo -e "${YELLOW}🔄 Mevcut PM2 process yeniden başlatılıyor...${NC}"
    pm2 restart qrcard-web
else
    echo -e "${YELLOW}🚀 PM2 ile uygulama başlatılıyor...${NC}"
    
    # ecosystem.config.cjs dosyasını kontrol et
    if [ ! -f ecosystem.config.cjs ]; then
        echo -e "${RED}❌ ecosystem.config.cjs dosyası bulunamadı!${NC}"
        exit 1
    fi
    
    # cwd path kontrolü
    if grep -q "/path/to/gozcuqr" ecosystem.config.cjs; then
        echo -e "${RED}⚠️  LÜTFEN ecosystem.config.cjs DOSYASINDA cwd PATH'İNİ GÜNCELLEYİN!${NC}"
        echo -e "${YELLOW}Şu anki dizin: $(pwd)${NC}"
        exit 1
    fi
    
    pm2 start ecosystem.config.cjs
fi

# PM2 durumunu göster
echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"
echo -e "${YELLOW}📊 PM2 Durumu:${NC}"
pm2 status

echo -e "${YELLOW}📝 Logları görmek için: pm2 logs qrcard-web${NC}"
echo -e "${GREEN}🎉 Başarılı! Uygulama çalışıyor.${NC}"
