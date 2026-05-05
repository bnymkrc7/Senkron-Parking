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
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (username, email, password, plate_number) VALUES (?, ?, ?, ?)`;

        db.run(query, [username, email, hashedPassword, plate_number], function (err) {
            if (err) {
                return res.status(400).json({ error: "Bu e-posta zaten kayıtlı veya bir hata oluştu." });
            }
            res.status(201).json({ 
                message: "Kullanıcı başarıyla oluşturuldu!", 
                userId: this.lastID,
                username: username 
            });
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
        if (err) return res.status(500).json({ error: "Sunucu hatası." });
        if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Hatalı şifre!" });

        // Giriş başarılı - Bilgileri gönderiyoruz
        res.status(200).json({
            message: "Giriş başarılı!",
            user: { 
                id: user.id,
                username: user.username, 
                plate: user.plate_number 
            }
        });
    });
});

// --- PARK YERLERİNİ LİSTELEME ---
app.get('/api/parking-slots', (req, res) => {
    const query = `SELECT * FROM parking_slots`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Veriler alınamadı." });
        res.status(200).json(rows);
    });
});

// --- PARK YERİ GÜNCELLEME ---
app.patch('/api/parking-slots/:id', (req, res) => {
    const { is_occupied } = req.body;
    const { id } = req.params;
    const query = `UPDATE parking_slots SET is_occupied = ? WHERE id = ?`;
    
    db.run(query, [is_occupied, id], function(err) {
        if (err) return res.status(500).json({ error: "Güncelleme başarısız." });
        res.status(200).json({ message: "Park yeri durumu güncellendi!" });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});