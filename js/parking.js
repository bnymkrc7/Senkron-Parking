// Senkron - Canlı Otopark Haritası ve Rezervasyon JS
document.addEventListener("DOMContentLoaded", function() {
    
    const selectedSpotInput = document.getElementById('selectedSpot');
    const reservationForm = document.getElementById('reservationForm');
    let reservationModal;

    // Initialize Modal
    if (document.getElementById('reservationModal')) {
        reservationModal = new bootstrap.Modal(document.getElementById('reservationModal'));
    }

    // Otopark Durumunu API'den Çek ve Güncelle
    async function fetchAndUpdateSpots() {
        try {
            const response = await fetch('http://localhost:3000/api/parking-slots');
            if (!response.ok) throw new Error('API Hatası');
            const data = await response.json();
            
            data.forEach(slot => {
                let spotElement = document.querySelector(`.parking-spot[data-spot="${slot.slot_number}"]`);
                if (spotElement) {
                    // Klonlayarak eski olay dinleyicilerini (click vb.) temizle
                    const newSpot = spotElement.cloneNode(true);
                    spotElement.parentNode.replaceChild(newSpot, spotElement);
                    spotElement = newSpot;

                    // Eski sınıfları temizle
                    spotElement.classList.remove('empty', 'occupied', 'reserved');
                    // Yeni sınıfı ekle
                    spotElement.classList.add(slot.status);
                    
                    // İkona karar ver ve tıklanabilirlik durumunu ayarla
                    let iconHtml = '';
                    if (slot.status === 'occupied') {
                        iconHtml = '<i class="fa-solid fa-car mt-2 text-white-50"></i>';
                    } else if (slot.status === 'reserved') {
                        iconHtml = '<i class="fa-regular fa-clock mt-2 text-dark"></i>';
                    } else {
                        // Boş ise tıklanabilir yap
                        spotElement.style.cursor = 'pointer';
                        spotElement.addEventListener('click', function() {
                            const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');
                            if (!currentUser) {
                                alert("Rezervasyon yapmak için önce giriş yapmalısınız!");
                                window.location.href = "login.html";
                                return;
                            }
                            if (reservationModal) {
                                selectedSpotInput.value = slot.slot_number;
                                reservationModal.show();
                            }
                        });
                    }
                    
                    // İçeriği güncelle (slot numarası + ikon)
                    spotElement.innerHTML = `${slot.slot_number} ${iconHtml}`;
                }
            });
            
            // Eğer URL'de yönlendirme varsa (örneğin: ?spot=Z-01)
            const urlParams = new URLSearchParams(window.location.search);
            const spotParam = urlParams.get('spot');
            
            if (spotParam && reservationModal) {
                // Sadece alan boş ise modalı aç
                const paramSpotData = data.find(s => s.slot_number === spotParam);
                if (paramSpotData && paramSpotData.status === 'empty') {
                    const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');
                    if (!currentUser) {
                        alert("Rezervasyon yapmak için önce giriş yapmalısınız!");
                        window.location.href = "login.html";
                        return;
                    }
                    selectedSpotInput.value = spotParam;
                    reservationModal.show();
                } else if (paramSpotData) {
                    alert('Seçtiğiniz alan şu an müsait değil.');
                }
                
                // Modal açıldıktan sonra URL'i temizleyebiliriz ki yenilemede tekrar açılmasın
                window.history.replaceState({}, document.title, window.location.pathname);
            }

        } catch (error) {
            console.error('Otopark verileri güncellenemedi:', error);
        }
    }

    // Handle Reservation Form Submission
    if (reservationForm) {
        reservationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const plate = document.getElementById('plateNumber').value;
            const time = document.getElementById('arrivalTime').value;
            const spot = selectedSpotInput.value;

            try {
                const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');
                
                // Backend'e POST isteği atarak rezervasyonu kaydet ve durumu güncelle
                const response = await fetch(`http://localhost:3000/api/reservations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: currentUser,
                        slot_number: spot,
                        plate_number: plate,
                        arrival_time: time
                    })
                });

                if (!response.ok) throw new Error('Rezervasyon kaydedilemedi.');

                // Başarılı olursa formu sıfırla, modalı kapat ve yerel UI'ı güncelle
                reservationForm.reset();
                reservationModal.hide();

                alert(`Başarılı! ${spot} numaralı alan ${plate} plakalı aracınız için rezerve edildi.\n\nLütfen en geç ${time} dakika içerisinde giriş yapınız. Aksi takdirde 1 saat sonra rezervasyonunuz otomatik iptal edilecektir.`);
                
                // Durumları tekrar çekip güncel hali yansıt
                fetchAndUpdateSpots();

            } catch (error) {
                alert('Hata: ' + error.message);
            }
        });
    }

    // İlk yüklemede verileri çek
    fetchAndUpdateSpots();
    
    // Periyodik olarak verileri yenile
    setInterval(fetchAndUpdateSpots, 5000);

});
