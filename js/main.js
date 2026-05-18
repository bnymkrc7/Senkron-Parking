document.addEventListener('DOMContentLoaded', () => {
    // Tooltip ayarları
    function initTooltips() {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
    initTooltips();

    let parkingSlots = [];

    const gridContainer = document.querySelector('.parking-grid .row.g-3');
    const countDisplay = document.querySelector('.parking-grid .row.text-center .col-6.text-end');

    // Veritabanından otopark durumlarını çek
    async function fetchParkingSlots() {
        try {
            const response = await fetch('http://localhost:3000/api/parking-slots');
            if (!response.ok) throw new Error('API Hatası');
            const data = await response.json();
            
            // Sadece Zemin Kat (Z-) verilerini al
            parkingSlots = data.filter(slot => slot.slot_number.startsWith('Z-'));
            renderSlots();
        } catch (error) {
            console.error('Veri çekilemedi:', error);
        }
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
                tooltipText = `${slot.slot_number}: Dolu`;
            } else if (slot.status === 'reserved') {
                iconHtml = '<i class="fa-regular fa-clock text-dark mt-1"></i>';
                tooltipText = `${slot.slot_number}: Rezerve`;
            } else {
                emptyCount++;
                tooltipText = `${slot.slot_number}: Boş. Rezervasyon için tıkla.`;
            }

            const col = document.createElement('div');
            col.className = 'col-3 col-md-2';

            col.innerHTML = `
                <div class="parking-spot ${slot.status}" style="cursor:pointer;" data-bs-toggle="tooltip" title="${tooltipText}" onclick="handleSlotClick('${slot.slot_number}')">
                    ${slot.slot_number} ${iconHtml}
                </div>
            `;
            gridContainer.appendChild(col);
        });

        if (countDisplay) {
            countDisplay.textContent = `${emptyCount} / ${parkingSlots.length} Boş`;
        }

        initTooltips();
    }

    // Tıklama Olayı: Doğrudan Park Yerleri sayfasına yönlendir
    window.handleSlotClick = function (id) {
        const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');
        if (!currentUser) {
            alert("Rezervasyon yapmak için önce giriş yapmalısınız!");
            window.location.href = "pages/login.html";
            return;
        }
        window.location.href = `pages/park-yerleri.html?spot=${id}`;
    };

    // İlk yüklemede verileri çek
    fetchParkingSlots();
    
    // Her 5 saniyede bir durumu güncelle (Gerçek zamanlı görünmesi için)
    setInterval(fetchParkingSlots, 5000);
});

