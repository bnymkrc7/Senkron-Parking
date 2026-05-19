// Ortak Oturum (Auth) Yönetimi
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('username') || localStorage.getItem('user_name');
    const userAuthArea = document.getElementById('userAuthArea');

    if (currentUser) {
        const mustChangePassword = localStorage.getItem('mustChangePassword');
        const isUpdatePage = window.location.pathname.includes('sifre-guncelle.html');
        
        if (mustChangePassword === 'true' && !isUpdatePage) {
            const redirectPath = window.location.pathname.includes('/pages/') ? 'sifre-guncelle.html' : 'pages/sifre-guncelle.html';
            window.location.href = redirectPath;
            return;
        }
    }

    if (currentUser && userAuthArea) {
        const reservationsLink = window.location.pathname.includes('/pages/') ? 'rezervasyonlarim.html' : 'pages/rezervasyonlarim.html';
        const profileLink = window.location.pathname.includes('/pages/') ? 'profil.html' : 'pages/profil.html';
        
        userAuthArea.innerHTML = `
            <div class="d-flex align-items-center bg-primary-subtle px-3 py-2 rounded-pill shadow-sm">
                <a href="${profileLink}" class="text-primary text-decoration-none d-flex align-items-center" title="Profilim">
                    <i class="fa-solid fa-circle-user me-2 fs-5"></i>
                    <span class="fw-bold">${currentUser}</span>
                </a>
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
