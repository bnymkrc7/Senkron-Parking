// Senkron - Canlı Otopark Haritası ve Rezervasyon JS
document.addEventListener("DOMContentLoaded", function() {
    
    const emptySpots = document.querySelectorAll('.parking-spot.empty');
    const selectedSpotInput = document.getElementById('selectedSpot');
    const reservationForm = document.getElementById('reservationForm');
    let reservationModal;

    // Initialize Modal
    if (document.getElementById('reservationModal')) {
        reservationModal = new bootstrap.Modal(document.getElementById('reservationModal'));
    }

    // Handle Spot Click
    emptySpots.forEach(spot => {
        spot.addEventListener('click', function() {
            const spotName = this.getAttribute('data-spot');
            if (spotName && reservationModal) {
                selectedSpotInput.value = spotName;
                reservationModal.show();
            }
        });
    });

    // Handle Reservation Form Submission
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const plate = document.getElementById('plateNumber').value;
            const time = document.getElementById('arrivalTime').value;
            const spot = selectedSpotInput.value;

            // In a real application, here we would send data to the backend via fetch
            
            // Close modal
            reservationModal.hide();

            // Simulate Success Alert
            alert(`Başarılı! ${spot} numaralı alan ${plate} plakalı aracınız için rezerve edildi.\n\nLütfen en geç ${time} dakika içerisinde giriş yapınız. Aksi takdirde 1 saat sonra rezervasyonunuz otomatik iptal edilecektir.`);
            
            // Mark spot as reserved (Visual change)
            const spotElement = document.querySelector(`.parking-spot[data-spot="${spot}"]`);
            if (spotElement) {
                spotElement.classList.remove('empty');
                spotElement.classList.add('reserved');
                spotElement.innerHTML = `${spot} <i class="fa-regular fa-clock mt-2 text-dark"></i>`;
                
                // Remove click event by cloning and replacing
                const newSpot = spotElement.cloneNode(true);
                spotElement.parentNode.replaceChild(newSpot, spotElement);
            }

            // Reset form
            reservationForm.reset();
        });
    }

});
