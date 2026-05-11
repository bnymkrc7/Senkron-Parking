const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors'); 
const db = require('./db_config'); // Az önce oluşturduğun veritabanı bağlantısı

const app = express();
app.use(cors());
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
app.get('/api/parking-slots', (req, res) => {
    const query = `SELECT * FROM parking_slots`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Veriler alınamadı." });
        }
        res.status(200).json(rows);
    });
});


app.patch('/api/parking-slots/:slot_number', (req, res) => {
    const { status } = req.body; // 'empty', 'occupied', 'reserved'
    const { slot_number } = req.params;

    const query = `UPDATE parking_slots SET status = ? WHERE slot_number = ?`;
    
    db.run(query, [status, slot_number], function(err) {
        if (err) {
            return res.status(500).json({ error: "Güncelleme başarısız." });
        }
        res.status(200).json({ message: "Park yeri durumu güncellendi!" });
    });
});
app.post('/api/reservations', (req, res) => {
    const { username, slot_number, plate_number, arrival_time } = req.body;

    if (!username || !slot_number || !plate_number || !arrival_time) {
        return res.status(400).json({ error: "Lütfen tüm alanları doldurun." });
    }

    const insertQuery = `INSERT INTO reservations (username, slot_number, plate_number, arrival_time) VALUES (?, ?, ?, ?)`;
    const updateQuery = `UPDATE parking_slots SET status = 'reserved' WHERE slot_number = ?`;

    db.serialize(() => {
        db.run(insertQuery, [username, slot_number, plate_number, arrival_time], function(err) {
            if (err) {
                return res.status(500).json({ error: "Rezervasyon kaydedilemedi." });
            }
            
            db.run(updateQuery, [slot_number], function(err) {
                if (err) {
                    return res.status(500).json({ error: "Otopark durumu güncellenemedi." });
                }
                res.status(201).json({ message: "Rezervasyon başarıyla oluşturuldu." });
            });
        });
    });
});
app.get('/api/reservations/:username', (req, res) => {
    const { username } = req.params;
    const query = `SELECT * FROM reservations WHERE username = ? ORDER BY created_at DESC`;
    
    db.all(query, [username], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Rezervasyonlar alınamadı." });
        }
        res.status(200).json(rows);
    });
});
app.delete('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`SELECT slot_number FROM reservations WHERE id = ?`, [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Rezervasyon bulunamadı." });
        
        const slot_number = row.slot_number;
        
        db.serialize(() => {
            db.run(`DELETE FROM reservations WHERE id = ?`, [id], function(err) {
                if (err) return res.status(500).json({ error: "İptal başarısız oldu." });
                
                db.run(`UPDATE parking_slots SET status = 'empty' WHERE slot_number = ?`, [slot_number], function(err) {
                    if (err) return res.status(500).json({ error: "Otopark durumu güncellenemedi." });
                    res.status(200).json({ message: "Rezervasyon iptal edildi ve alan boşaltıldı." });
                });
            });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});