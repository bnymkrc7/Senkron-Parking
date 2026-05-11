// Ortak Oturum (Auth) Yönetimi
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');
    const userAuthArea = document.getElementById('userAuthArea');

    if (currentUser && userAuthArea) {
        const reservationsLink = window.location.pathname.includes('/pages/') ? 'rezervasyonlarim.html' : 'pages/rezervasyonlarim.html';
        
        userAuthArea.innerHTML = `
            <div class="d-flex align-items-center bg-primary-subtle px-3 py-2 rounded-pill shadow-sm">
                <i class="fa-solid fa-circle-user text-primary me-2 fs-5"></i>
                <span class="fw-bold text-primary">Hoş geldin, ${currentUser}!</span>
                <a href="${reservationsLink}" class="btn btn-sm btn-primary ms-3 rounded-pill px-3 shadow-sm">
                    <i class="fa-solid fa-list-check me-1"></i> Rezervasyonlarım
                </a>
                <button class="btn btn-sm btn-link text-danger ms-2 text-decoration-none" onclick="logout()" title="Çıkış Yap">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
    }
});

window.logout = function () {
    localStorage.removeItem('user_name');
    localStorage.removeItem('username');
    
    // Eğer index sayfasında değilse index'e yönlendir, index'te ise sayfayı yenile
    if (window.location.pathname.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        window.location.reload();
    }
};
