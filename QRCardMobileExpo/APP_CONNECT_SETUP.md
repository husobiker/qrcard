# App Store Connect ve Google Play Console Kurulum Rehberi

Bu proje EAS (Expo Application Services) kullanarak App Store Connect ve Google Play Console'a yüklenebilir.

## 1. EAS CLI Kurulumu (Zaten Kurulu ✅)

EAS CLI zaten kurulu. Güncellemek için:
```bash
npm install -g eas-cli
```

## 2. EAS Hesabına Giriş

```bash
cd QRCardMobileExpo
eas login
```

## 3. Projeyi EAS'a Bağlama

```bash
eas build:configure
```

Bu komut `eas.json` dosyasını oluşturur (zaten oluşturuldu).

## 4. iOS Build ve App Store Connect

### 4.1. Apple Developer Hesabı Gereksinimleri

- Apple Developer Program üyeliği ($99/yıl)
- App Store Connect'te uygulama oluşturulmuş olmalı
- Bundle ID: `com.qrcard.mobile`

### 4.2. Credentials Yapılandırması

```bash
eas credentials
```

Bu komut:
- Apple Developer sertifikalarını yönetir
- Provisioning profile'ları oluşturur
- App Store Connect API key'lerini yapılandırır

### 4.3. Production Build

```bash
eas build --platform ios --profile production
```

### 4.4. App Store Connect'e Submit

```bash
eas submit --platform ios
```

**Not:** `eas.json` dosyasındaki submit yapılandırmasını güncellemeniz gerekecek:
- `appleId`: Apple ID email'iniz
- `ascAppId`: App Store Connect'teki uygulama ID'niz
- `appleTeamId`: Apple Developer Team ID'niz

## 5. Android Build ve Google Play Console

### 5.1. Google Play Console Gereksinimleri

- Google Play Developer hesabı ($25 tek seferlik)
- Google Play Console'da uygulama oluşturulmuş olmalı
- Package name: `com.qrcard.mobile`

### 5.2. Service Account Key Oluşturma

1. Google Cloud Console'a gidin
2. Service Account oluşturun
3. JSON key dosyasını indirin
4. `eas.json` dosyasındaki `serviceAccountKeyPath` yolunu güncelleyin

### 5.3. Production Build

```bash
eas build --platform android --profile production
```

### 5.4. Google Play Console'a Submit

```bash
eas submit --platform android
```

## 6. Build Profilleri

`eas.json` dosyasında 3 profil var:

- **development**: Development client için (simulator/emulator)
- **preview**: Internal testing için (APK/IPA)
- **production**: App Store/Play Store için (AAB/IPA)

## 7. Hızlı Başlangıç

### İlk Build (Preview - Test için):

```bash
# iOS
eas build --platform ios --profile preview

# Android
eas build --platform android --profile preview
```

### Production Build:

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

## 8. Önemli Notlar

1. **Bundle ID / Package Name**: `com.qrcard.mobile` olarak ayarlı
2. **Version**: `1.0.0` (app.json'da)
3. **Build Number**: iOS için `1`, Android için `1` (versionCode)
4. **App Name**: "Crew" (app.json'da)

## 9. İlk Kez Build Alırken

1. `eas build:configure` çalıştırın (zaten yapıldı)
2. `eas credentials` ile credentials'ları yapılandırın
3. İlk build'i `preview` profili ile alın
4. Test edin
5. `production` profili ile production build alın
6. `eas submit` ile store'a yükleyin

## 10. Sorun Giderme

### Credentials Sorunları:
```bash
eas credentials
```

### Build Logları:
```bash
eas build:list
eas build:view [BUILD_ID]
```

### Daha Fazla Bilgi:
- [EAS Build Dokümantasyonu](https://docs.expo.dev/build/introduction/)
- [EAS Submit Dokümantasyonu](https://docs.expo.dev/submit/introduction/)
