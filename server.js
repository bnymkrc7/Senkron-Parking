const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db_config'); // Az önce oluşturduğun veritabanı bağlantısı

const app = express();
app.use(express.json()); // Gelen JSON verilerini okuyabilmek için
app.use(express.static(__dirname)); // Sunum için eklendi: HTML, CSS ve JS dosyalarını tarayıcıya yollar

// --- KAYIT OLMA API (Register) ---
app.post('/api/register', async (req, res) => {
    const { username, email, password, plate_number } = req.body;

    try {
        // 1. Şifreyi güvenli hale getir (Hashing)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Kullanıcıyı veritabanına ekle
        const query = `INSERT INTO users (username, email, password, plate_number) VALUES (?, ?, ?, ?)`;

        db.run(query, [username, email, hashedPassword, plate_number], function (err) {
            if (err) {
                return res.status(400).json({ error: "Bu e-posta zaten kayıtlı veya bir hata oluştu." });
            }
            res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu!", userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "Sunucu hatası." });
    }
});
// --- GİRİŞ YAPMA API (Login) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = ?`;

    db.get(query, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Sunucu hatası." });
        }
        if (!user) {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Hatalı şifre!" });
        }

        res.status(200).json({
            message: "Giriş başarılı!",
            user: { id: user.id, username: user.username, plate: user.plate_number }
        });
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});