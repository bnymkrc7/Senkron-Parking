document.addEventListener("DOMContentLoaded", function() {
    const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');
    
    // Eğer giriş yapmamışsa doğrudan login sayfasına yönlendir
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const container = document.getElementById('reservationsContainer');
    const spinner = document.getElementById('loadingSpinner');

    async function fetchReservations() {
        try {
            const response = await fetch(`http://localhost:3000/api/reservations/${currentUser}`);
            if (!response.ok) throw new Error('Rezervasyonlar alınamadı.');
            
            const reservations = await response.json();
            
            spinner.style.display = 'none';

            if (reservations.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <div class="alert alert-info d-inline-block px-5 py-4 rounded-4 shadow-sm bg-white border-0 mt-3">
                            <i class="fa-regular fa-folder-open text-primary fs-1 mb-3 d-block"></i>
                            <h4 class="fw-bold mb-2">Henüz rezervasyonunuz yok</h4>
                            <p class="text-muted mb-0">Geçmişte veya şu an aktif olan bir otopark rezervasyonunuz bulunmamaktadır.</p>
                            <a href="park-yerleri.html" class="btn btn-primary mt-4 rounded-pill px-4 shadow-sm">Hemen Rezerve Et</a>
                        </div>
                    </div>
                `;
                return;
            }

            reservations.forEach(res => {
                // SQLite tarihini okunabilir formata çevir
                const dateObj = new Date(res.created_at);
                const dateStr = dateObj.toLocaleDateString('tr-TR') + ' ' + dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                
                const cardHtml = `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden reservation-card transition-all" style="transition: transform 0.3s ease;">
                            <div class="card-header bg-primary text-white py-3 border-0">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0 fw-bold"><i class="fa-solid fa-square-parking me-2"></i>Alan: ${res.slot_number}</h5>
                                    <span class="badge bg-warning text-dark rounded-pill px-3 py-2"><i class="fa-solid fa-check me-1"></i>Onaylandı</span>
                                </div>
                            </div>
                            <div class="card-body p-4 bg-white">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 pt-0 border-light pb-3">
                                        <span class="text-muted"><i class="fa-solid fa-car me-2 text-primary"></i>Plaka:</span>
                                        <span class="fw-bold text-dark fs-5">${res.plate_number}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 border-light py-3">
                                        <span class="text-muted"><i class="fa-solid fa-clock me-2 text-primary"></i>Tahmini Varış:</span>
                                        <span class="fw-bold text-dark">${res.arrival_time} dk içinde</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 border-light pt-3 pb-0">
                                        <span class="text-muted"><i class="fa-solid fa-calendar-days me-2 text-primary"></i>İşlem Tarihi:</span>
                                        <span class="fw-bold text-dark small text-end">${dateStr}</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="card-footer bg-white border-light text-end py-3">
                                <button class="btn btn-sm btn-outline-danger px-3 rounded-pill" onclick="cancelReservation(${res.id})">
                                    <i class="fa-solid fa-trash me-1"></i> İptal Et
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHtml;
            });

            // Kartlara hafif bir hover efekti ekleyelim (CSS'siz JS ile pratik çözüm)
            document.querySelectorAll('.reservation-card').forEach(card => {
                card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-5px)');
                card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
            });

        } catch (error) {
            console.error(error);
            spinner.style.display = 'none';
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center shadow-sm rounded-4 border-0">Rezervasyon verileri yüklenirken bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.</div>
                </div>
            `;
        }
    }

    window.cancelReservation = async function(id) {
        if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz? Otopark alanı başkaları için tekrar boş duruma getirilecektir.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/reservations/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('İptal işlemi başarısız oldu.');

            alert('Rezervasyon başarıyla iptal edildi.');
            
            // Listeyi yenilemek için konteyneri temizle ve tekrar çek
            container.innerHTML = '';
            spinner.style.display = 'inline-block';
            fetchReservations();

        } catch (error) {
            console.error(error);
            alert('İptal işlemi sırasında bir hata oluştu.');
        }
    };

    fetchReservations();
});
