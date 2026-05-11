const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors'); 
const db = require('./db_config'); 

const app = express();
app.use(cors());
app.use(express.json()); 
app.use(express.static(__dirname)); 

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
app.get('/api/parking-slots', (req, res) => {
    const query = `SELECT * FROM parking_slots`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Veriler alınamadı." });
        }
        res.status(200).json(rows);
    });
});


app.patch('/api/parking-slots/:id', (req, res) => {
    const { is_occupied } = req.body; // 1 (dolu) veya 0 (boş) gelecek
    const { id } = req.params;

    const query = `UPDATE parking_slots SET is_occupied = ? WHERE id = ?`;
    
    db.run(query, [is_occupied, id], function(err) {
        if (err) {
            return res.status(500).json({ error: "Güncelleme başarısız." });
        }
        res.status(200).json({ message: "Park yeri durumu güncellendi!" });
    });
});

// ... Mevcut PATCH /api/parking-slots/:id kodunun altına ekle ...

// --- GÖREV 10: PLAKA VE KULLANICI EŞLEŞTİRMESİ ---
// Kullanıcının profil sayfasından plakasını güncellemesini sağlar
app.patch('/api/user/update-plate', (req, res) => {
    const { userId, newPlate } = req.body;

    if (!userId || !newPlate) {
        return res.status(400).json({ error: "Kullanıcı ID ve yeni plaka gerekli." });
    }

    const query = `UPDATE users SET plate_number = ? WHERE id = ?`;

    db.run(query, [newPlate, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: "Plaka güncellenirken bir hata oluştu." });
        }
        res.status(200).json({ message: "Plaka başarıyla güncellendi!" });
    });
});

// Kullanıcı bir yeri rezerve ettiğinde hem slotu günceller hem de kayıt tutar
app.post('/api/reserve', (req, res) => {
    const { userId, slotId } = req.body;

    if (!userId || !slotId) {
        return res.status(400).json({ error: "Eksik bilgi: Kullanıcı veya Slot ID bulunamadı." });
    }

   
    const updateSlotQuery = `UPDATE parking_slots SET is_occupied = 1 WHERE id = ? AND is_occupied = 0`;

    db.run(updateSlotQuery, [slotId], function(err) {
        if (err) {
            return res.status(500).json({ error: "Rezervasyon işlemi başarısız." });
        }
        if (this.changes === 0) {
            return res.status(400).json({ error: "Bu yer zaten rezerve edilmiş veya bulunamadı." });
        }

        res.status(200).json({ 
            message: "Rezervasyon başarıyla tamamlandı!",
            slotId: slotId 
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});