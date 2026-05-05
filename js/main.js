document.addEventListener('DOMContentLoaded', () => {
    // Bootstrap Tooltip'lerini başlatma fonksiyonu
    function initTooltips() {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Başlangıç otopark verisi
    const parkingSlots = [
        { id: 'A-01', status: 'empty' },
        { id: 'A-02', status: 'occupied' },
        { id: 'A-03', status: 'empty' },
        { id: 'A-04', status: 'reserved' },
        { id: 'A-05', status: 'empty' },
        { id: 'A-06', status: 'occupied' },
        { id: 'A-07', status: 'empty' },
        { id: 'A-08', status: 'empty' },
        { id: 'A-09', status: 'occupied' },
        { id: 'A-10', status: 'occupied' },
        { id: 'A-11', status: 'empty' },
        { id: 'A-12', status: 'empty' }
    ];

    const gridContainer = document.querySelector('.parking-grid .row.g-3');
    const countDisplay = document.querySelector('.parking-grid .row.text-center .col-6.text-end');

    // KULLANICI GİRİŞ KONTROLÜ 
    const username = localStorage.getItem('username');
    const userAuthArea = document.getElementById('userAuthArea');

    if (username && userAuthArea) {
        userAuthArea.innerHTML = `
            <span class="text-primary fw-bold me-3">
                <i class="fa-solid fa-user me-1"></i> Hoş geldin, ${username}
            </span>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="logout()">Çıkış Yap</button>
        `;
    }

});

//ÇIKIŞ FONKSİYONUNU:
window.logout = function () {
    localStorage.removeItem('username');
    window.location.reload();
};
// Otopark ızgarasını (Grid) dinamik olarak ekrana çizen fonksiyon
function renderSlots() {
    if (!gridContainer) return;

    // Önceki statik HTML içeriğini temizle
    gridContainer.innerHTML = '';
    let emptyCount = 0;

    parkingSlots.forEach(slot => {
        let iconHtml = '';
        let tooltipText = '';

        // Duruma göre ikon ve tooltip metni belirleme
        if (slot.status === 'occupied') {
            iconHtml = '<i class="fa-solid fa-car text-white-50 mt-1"></i>';
            tooltipText = `${slot.id}: Dolu`;
        } else if (slot.status === 'reserved') {
            iconHtml = '<i class="fa-regular fa-clock text-dark mt-1"></i>';
            tooltipText = `${slot.id}: Sizin rezervasyonunuz.`;
        } else {
            emptyCount++;
            tooltipText = `${slot.id}: Boş. Rezervasyon için tıkla.`;
        }

        // Yeni slot elementini oluşturma
        const col = document.createElement('div');
        col.className = 'col-3 col-md-2';

        col.innerHTML = `
                <div class="parking-spot ${slot.status}" style="cursor:pointer;" data-bs-toggle="tooltip" title="${tooltipText}" onclick="handleSlotClick('${slot.id}')">
                    ${slot.id} ${iconHtml}
                </div>
            `;
        gridContainer.appendChild(col);
    });

    // Toplam boş yer sayacını güncelleme
    if (countDisplay) {
        countDisplay.textContent = `${emptyCount} / ${parkingSlots.length} Boş`;
    }

    // DOM'a yeni eklenen elementler için tooltipleri tekrar aktif et
    initTooltips();
}

// Tıklama ve Rezervasyon Yönetimi
window.handleSlotClick = function (id) {
    const slotIndex = parkingSlots.findIndex(s => s.id === id);
    if (slotIndex === -1) return;

    const slot = parkingSlots[slotIndex];

    if (slot.status === 'empty') {
        if (confirm(`${id} numaralı otopark alanını rezerve etmek istiyor musunuz?`)) {
            slot.status = 'reserved';
            renderSlots();
        }
    } else if (slot.status === 'reserved') {
        if (confirm(`Rezervasyonunuzu iptal etmek istiyor musunuz?`)) {
            slot.status = 'empty';
            renderSlots();
        }
    } else {
        // Dolu bir alana tıklandığında uyarı ver
        alert('Bu alan şu anda başka bir araç tarafından kullanılıyor.');
    }
};

// İlk yüklemede haritayı çiz
renderSlots();

// SİMÜLASYON MOTORU: Her 4 saniyede bir rastgele giriş/çıkış efekti
setInterval(() => {
    const randomIndex = Math.floor(Math.random() * parkingSlots.length);
    const slot = parkingSlots[randomIndex];

    // Kullanıcının rezerve ettiği alana dokunmuyoruz
    if (slot.status === 'empty') {
        slot.status = 'occupied';
    } else if (slot.status === 'occupied') {
        slot.status = 'empty';
    }

    // Değişikliği ekrana yansıt
    renderSlots();
}, 4000);
});