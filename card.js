// URL parametresinden veriyi al
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// İlk harfi al (avatar için)
function getInitial(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
}

// Telefon numarasını temizle (sadece rakamlar ve +)
function cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
}

// vCard oluştur (rehbere kaydetme için)
function generateVCard(data) {
    let vcard = 'BEGIN:VCARD\n';
    vcard += 'VERSION:3.0\n';
    vcard += `FN:${data.name}\n`;
    
    if (data.name) {
        const nameParts = data.name.split(' ');
        vcard += `N:${nameParts[nameParts.length - 1] || ''};${nameParts.slice(0, -1).join(' ') || ''};;;\n`;
    }
    
    if (data.title) {
        vcard += `TITLE:${data.title}\n`;
    }
    
    if (data.phone) {
        vcard += `TEL;TYPE=CELL:${cleanPhone(data.phone)}\n`;
    }
    
    if (data.email) {
        vcard += `EMAIL:${data.email}\n`;
    }
    
    if (data.company) {
        vcard += `ORG:${data.company}\n`;
    }
    
    if (data.website) {
        vcard += `URL:${data.website}\n`;
    }
    
    if (data.address) {
        vcard += `ADR;TYPE=WORK:;;${data.address};;;;\n`;
    }
    
    vcard += 'END:VCARD';
    return vcard;
}

// vCard dosyasını indir
function downloadVCard(vcard, filename) {
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'contact.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Kartvizit bilgilerini yükle ve göster
function loadCardData() {
    const encodedData = getUrlParameter('data');
    
    if (!encodedData) {
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('businessCard').style.display = 'none';
        return;
    }
    
    try {
        const jsonData = JSON.parse(atob(decodeURIComponent(encodedData)));
        
        // İsim
        document.getElementById('cardName').textContent = jsonData.name || 'İsimsiz';
        document.getElementById('avatarInitial').textContent = getInitial(jsonData.name);
        
        // Ünvan
        if (jsonData.title) {
            document.getElementById('cardTitle').textContent = jsonData.title;
            document.getElementById('cardTitle').style.display = 'block';
        } else {
            document.getElementById('cardTitle').style.display = 'none';
        }
        
        // Telefon
        if (jsonData.phone) {
            const cleanPhoneNum = cleanPhone(jsonData.phone);
            const phoneLink = document.getElementById('phoneLink');
            phoneLink.href = `tel:${cleanPhoneNum}`;
            phoneLink.textContent = jsonData.phone;
            document.getElementById('phoneItem').style.display = 'flex';
        }
        
        // E-posta
        if (jsonData.email) {
            const emailLink = document.getElementById('emailLink');
            emailLink.href = `mailto:${jsonData.email}`;
            emailLink.textContent = jsonData.email;
            document.getElementById('emailItem').style.display = 'flex';
        }
        
        // Şirket
        if (jsonData.company) {
            document.getElementById('companyText').textContent = jsonData.company;
            document.getElementById('companyItem').style.display = 'flex';
        }
        
        // Web sitesi
        if (jsonData.website) {
            let websiteUrl = jsonData.website;
            if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
                websiteUrl = 'https://' + websiteUrl;
            }
            const websiteLink = document.getElementById('websiteLink');
            websiteLink.href = websiteUrl;
            websiteLink.textContent = jsonData.website.replace(/^https?:\/\//, '');
            document.getElementById('websiteItem').style.display = 'flex';
        }
        
        // Adres
        if (jsonData.address) {
            document.getElementById('addressText').textContent = jsonData.address;
            document.getElementById('addressItem').style.display = 'flex';
        }
        
        // Rehbere kaydet butonu
        document.getElementById('saveContactBtn').addEventListener('click', function() {
            const vcard = generateVCard(jsonData);
            const filename = `${jsonData.name.replace(/\s+/g, '_')}.vcf`;
            downloadVCard(vcard, filename);
            
            // iOS için özel işlem
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                alert('vCard dosyası indirildi. Dosyaya tıklayarak rehbere ekleyebilirsiniz.');
            } else {
                alert('Rehbere kaydedildi!');
            }
        });
        
        // Veriyi global olarak sakla (rehbere kaydetme için)
        window.cardData = jsonData;
        
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('businessCard').style.display = 'none';
    }
}

// Sayfa yüklendiğinde çalıştır
window.addEventListener('DOMContentLoaded', loadCardData);




