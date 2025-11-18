# Employee Authentication Debug Guide

## Sorun: "Geçersiz kullanıcı adı veya şifre" hatası

### Adım 1: Migration'ları Çalıştırın

Supabase Dashboard → SQL Editor'de şu migration'ları sırayla çalıştırın:

1. `007_add_employee_password.sql`
2. `008_add_employee_username.sql`
3. `009_fix_authenticate_employee.sql` (EN ÖNEMLİSİ!)

### Adım 2: Mevcut Çalışanı Kontrol Edin

SQL Editor'de şu sorguyu çalıştırın (username'i değiştirin):

```sql
SELECT 
  id,
  first_name,
  last_name,
  username,
  CASE 
    WHEN password_hash IS NULL THEN 'NO PASSWORD HASH'
    WHEN password_hash = '' THEN 'EMPTY PASSWORD HASH'
    ELSE 'HAS PASSWORD HASH'
  END as password_status,
  LENGTH(password_hash) as hash_length
FROM employees
WHERE username = 'hetinkoz';  -- Buraya gerçek username'i yazın
```

### Adım 3: Şifre Hash'ini Kontrol Edin

Eğer `password_hash` NULL veya boşsa, çalışan için yeni bir şifre belirleyin:

```sql
-- Önce şifreyi hash'leyin
SELECT hash_password('yeni_sifre_buraya') as hashed_password;

-- Sonra çalışanı güncelleyin (hash'lenmiş değeri kullanın)
UPDATE employees 
SET password_hash = 'hash_edilmiş_değer_buraya'
WHERE username = 'hetinkoz';
```

### Adım 4: Manuel Test

SQL Editor'de şifre doğrulamasını test edin:

```sql
-- Çalışanı bulun
SELECT username, password_hash FROM employees WHERE username = 'hetinkoz';

-- Şifreyi test edin (plain_password yerine gerçek şifreyi yazın)
SELECT verify_password('plain_password', (SELECT password_hash FROM employees WHERE username = 'hetinkoz'));
```

### Adım 5: Yeni Çalışan Oluşturun

Eğer mevcut çalışan sorunluysa:
1. Dashboard'dan yeni bir çalışan oluşturun
2. Şifre alanını doldurun
3. QR kod modalında kullanıcı adı ve şifreyi not edin
4. Bu bilgilerle giriş yapmayı deneyin

### Console Log'ları

Tarayıcı console'unu açın (F12) ve şu bilgileri kontrol edin:
- "Attempting to authenticate employee:" - Username doğru mu?
- "Error authenticating employee:" - Hata detayları
- "Authentication response:" - Response var mı?

### Olası Sorunlar ve Çözümler

1. **Migration çalıştırılmamış**: `009_fix_authenticate_employee.sql` mutlaka çalıştırılmalı
2. **Şifre hash'lenmemiş**: Çalışan oluşturulurken şifre girilmemiş veya hash'leme başarısız olmuş
3. **Username yanlış**: QR kod modalındaki username'i kontrol edin
4. **Şifre yanlış**: QR kod modalındaki şifreyi kontrol edin

