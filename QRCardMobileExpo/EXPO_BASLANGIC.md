# Expo ile Mobil Uygulama - Hızlı Başlangıç

## ✅ Expo'ya Geçiş Tamamlandı!

Expo kullanmanın avantajları:
- ✅ Pod install sorunları yok
- ✅ Expo Go ile anında test
- ✅ Daha kolay kurulum
- ✅ Over-the-air updates
- ✅ EAS Build ile production build

## 🚀 Hemen Çalıştırın

### 1. Expo Go Uygulamasını İndirin

**iOS:**
- App Store'dan "Expo Go" uygulamasını indirin

**Android:**
- Google Play'den "Expo Go" uygulamasını indirin

### 2. Uygulamayı Başlatın

```bash
cd QRCardMobileExpo
npm start
```

VEYA:

```bash
cd QRCardMobileExpo
npx expo start
```

### 3. QR Kodu Tarayın

1. Terminal'de QR kod görünecek
2. **iOS:** Camera uygulamasıyla QR kodu tarayın → Expo Go açılır
3. **Android:** Expo Go uygulamasıyla QR kodu tarayın

VEYA Simulator'de:

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

## 📱 Expo Go ile Test

1. **Expo Go** uygulamasını açın
2. Terminal'deki QR kodu tarayın
3. Uygulama otomatik yüklenecek ve çalışacak!

## 🔧 Geliştirme

### Metro Bundler

Expo otomatik olarak Metro bundler'ı başlatır. Kod değişiklikleriniz anında yansır (Hot Reload).

### Native Modüller

Eğer native modül eklemeniz gerekirse:

```bash
npx expo install <package-name>
```

### Production Build

```bash
# EAS Build ile
npx eas build --platform ios
npx eas build --platform android
```

## 📝 Notlar

- Expo Go ile test ederken bazı native modüller çalışmayabilir
- Production build için EAS Build kullanın
- `app.json` dosyasında Supabase bilgileri var

## 🎯 Sonraki Adımlar

1. `npm start` ile uygulamayı başlatın
2. Expo Go ile QR kodu tarayın
3. Uygulama çalışacak!


