document.addEventListener('DOMContentLoaded', () => {
    // Tooltip ayarları
    function initTooltips() {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
    initTooltips();

    const isim = localStorage.getItem('user_name'); 
    const authArea = document.getElementById('userAuthArea'); 

    if (isim && authArea) {
        authArea.innerHTML = `
            <div class="d-flex align-items-center bg-primary-subtle px-3 py-2 rounded-pill shadow-sm">
                <i class="fa-solid fa-circle-user text-primary me-2 fs-5"></i>
                <span class="fw-bold text-primary">Hoş geldin, ${isim}!</span>
                <button class="btn btn-sm btn-link text-danger ms-2 text-decoration-none" onclick="logout()">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
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

    // Otopark ızgarasını (Grid) dinamik olarak ekrana çizen fonksiyon
    function renderSlots() {
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        let emptyCount = 0;

        parkingSlots.forEach(slot => {
            let iconHtml = '';
            let tooltipText = '';

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

            const col = document.createElement('div');
            col.className = 'col-3 col-md-2';

            col.innerHTML = `
                <div class="parking-spot ${slot.status}" style="cursor:pointer;" data-bs-toggle="tooltip" title="${tooltipText}" onclick="handleSlotClick('${slot.id}')">
                    ${slot.id} ${iconHtml}
                </div>
            `;
            gridContainer.appendChild(col);
        });

        if (countDisplay) {
            countDisplay.textContent = `${emptyCount} / ${parkingSlots.length} Boş`;
        }

        initTooltips();
    }

    // FRONTEND 2 GÖREVİ: Tıklama ve Rezervasyon İstek Yönetimi
    window.handleSlotClick = async function (id) {
        const slotIndex = parkingSlots.findIndex(s => s.id === id);
        if (slotIndex === -1) return;

        const slot = parkingSlots[slotIndex];
        const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');

        if (slot.status === 'empty') {
            
            if (!currentUser) {
                alert("Rezervasyon yapmak için önce giriş yapmalısınız!");
                window.location.href = "pages/login.html";
                return;
            }

            if (confirm(`${id} numaralı otopark alanını rezerve etmek istiyor musunuz?`)) {
                try {
                    // BACKEND GELİŞTİRİCİSİ İÇİN NOT: 
                    // API rotası hazır olduğunda aşağıdaki fetch bloğunu aktif edip URL'yi güncelleyin.
                    /* 
                    const response = await fetch('http://localhost:3000/api/rezervasyon', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ parkId: id, kullanici: currentUser })
                    });
                    
                    if (!response.ok) throw new Error('Sunucu cevap vermedi');
                    const data = await response.json();
                    */

                    // API'den "başarılı" cevabı geldiğinde arayüz güncellenir:
                    slot.status = 'reserved';
                    renderSlots();
                    alert(`${id} numaralı alan başarıyla rezerve edildi!`);

                } catch (error) {
                    alert('Rezervasyon yapılırken bir hata oluştu: ' + error.message);
                }
            }
        } else if (slot.status === 'reserved') {
            if (confirm(`Rezervasyonunuzu iptal etmek istiyor musunuz?`)) {
                // BACKEND İÇİN: İptal fetch isteği buraya eklenebilir.
                slot.status = 'empty';
                renderSlots();
            }
        } else {
            alert('Bu alan şu anda başka bir araç tarafından kullanılıyor.');
        }
    };

    renderSlots();

    // SİMÜLASYON MOTORU
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * parkingSlots.length);
        const slot = parkingSlots[randomIndex];

        if (slot.status === 'empty') {
            slot.status = 'occupied';
        } else if (slot.status === 'occupied') {
            slot.status = 'empty';
        }

        renderSlots();
    }, 4000);
});

window.logout = function () {
    localStorage.removeItem('user_name');
    localStorage.removeItem('username');
    window.location.reload();
};