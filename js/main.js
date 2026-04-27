// Senkron Akıllı Otopark Sistemi
// Frontend Etkileşimleri

document.addEventListener("DOMContentLoaded", function() {
    
    // Bootstrap Tooltip'lerini (İpuçlarını) Başlatma
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Navbar Scroll Efekti
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            navbar.style.paddingTop = '10px';
            navbar.style.paddingBottom = '10px';
        } else {
            navbar.style.boxShadow = 'none';
            navbar.style.paddingTop = '15px';
            navbar.style.paddingBottom = '15px';
        }
    });

    // Boş park yerlerine tıklama simülasyonu
    const emptySpots = document.querySelectorAll('.parking-spot.empty');
    emptySpots.forEach(spot => {
        spot.addEventListener('click', function() {
            // Sadece görsel bir geri bildirim
            const spotName = this.childNodes[0].textContent.trim();
            alert(`Harika! ${spotName} numaralı alanı rezerve etmek üzere sayfaya yönlendiriliyorsunuz...`);
        });
    });

});
