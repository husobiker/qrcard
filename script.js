// vCard formatında veri oluştur
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
        vcard += `TEL;TYPE=CELL:${data.phone.replace(/\s/g, '')}\n`;
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

// QR kod oluştur
function generateQRCode(vcardData) {
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = ''; // Önceki QR kodunu temizle
    
    QRCode.toCanvas(qrContainer, vcardData, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, function (error) {
        if (error) {
            console.error('QR kod oluşturma hatası:', error);
            alert('QR kod oluşturulurken bir hata oluştu.');
        }
    });
}

// Form submit işlemi
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        title: document.getElementById('title').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        company: document.getElementById('company').value.trim(),
        website: document.getElementById('website').value.trim(),
        address: document.getElementById('address').value.trim()
    };
    
    // Veriyi base64 encode edip URL parametresi olarak kullan
    const encodedData = encodeURIComponent(btoa(JSON.stringify(formData)));
    const shareUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}card.html?data=${encodedData}`;
    
    // QR kodu oluştur (URL formatında - böylece güzel bir sayfa açılır)
    generateQRCode(shareUrl);
    
    // Sonuç bölümünü göster
    document.getElementById('qrResult').classList.remove('hidden');
    
    // Share URL'ini sakla
    document.getElementById('shareBtn').dataset.url = shareUrl;
    
    // Sayfayı yukarı kaydır
    document.getElementById('qrResult').scrollIntoView({ behavior: 'smooth' });
});

// QR kod indirme
document.getElementById('downloadBtn').addEventListener('click', function() {
    const canvas = document.querySelector('#qrcode canvas');
    if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'kartvizit-qr.png';
        link.href = url;
        link.click();
    }
});

// Link paylaşma
document.getElementById('shareBtn').addEventListener('click', function() {
    const url = this.dataset.url;
    if (url) {
        if (navigator.share) {
            navigator.share({
                title: 'Kartvizitim',
                text: 'Kartvizit bilgilerime buradan ulaşabilirsiniz',
                url: url
            }).catch(err => console.log('Paylaşım hatası:', err));
        } else {
            // Fallback: URL'yi kopyala
            navigator.clipboard.writeText(url).then(() => {
                alert('Link panoya kopyalandı!');
            }).catch(() => {
                // Eski tarayıcılar için
                const textarea = document.createElement('textarea');
                textarea.value = url;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Link panoya kopyalandı!');
            });
        }
    }
});

