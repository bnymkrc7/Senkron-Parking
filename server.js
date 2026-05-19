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
        if (err) return res.status(500).json({ error: "Sunucu hatası." });
        if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Hatalı şifre!" });

        res.status(200).json({
            message: "Giriş başarılı!",
            user: { id: user.id, username: user.username, plate: user.plate_number }
        });
    });
});

// --- PARK YERLERİNİ LİSTELE ---
app.get('/api/parking-slots', (req, res) => {
    const query = `SELECT * FROM parking_slots`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Veriler alınamadı." });
        res.status(200).json(rows);
    });
});

// --- PARK YERİ DURUMU GÜNCELLE (Manuel) ---
app.patch('/api/parking-slots/:id', (req, res) => {
    const { is_occupied } = req.body; 
    const { id } = req.params;

    const newStatus = is_occupied == 1 ? 'occupied' : 'empty';
    const query = `UPDATE parking_slots SET status = ? WHERE id = ?`;
    
    db.run(query, [newStatus, id], function(err) {
        if (err) return res.status(500).json({ error: "Güncelleme başarısız." });
        res.status(200).json({ message: "Park yeri durumu güncellendi!" });
    });
});

// --- GÖREV 10: PLAKA VE KULLANICI EŞLEŞTİRMESİ ---
app.patch('/api/user/update-plate', (req, res) => {
    const { userId, newPlate } = req.body;

    if (!userId || !newPlate) {
        return res.status(400).json({ error: "Kullanıcı ID ve yeni plaka gerekli." });
    }

    const query = `UPDATE users SET plate_number = ? WHERE id = ?`;
    db.run(query, [newPlate, userId], function(err) {
        if (err) return res.status(500).json({ error: "Plaka güncellenirken bir hata oluştu." });
        res.status(200).json({ message: "Plaka başarıyla güncellendi!" });
    });
});

// --- REZERVASYON İŞLEMLERİ ---

// 1. Kullanıcının rezervasyonlarını getir
app.get('/api/reservations/:username', (req, res) => {
    const { username } = req.params;
    const query = `SELECT * FROM reservations WHERE username = ? ORDER BY created_at DESC`;
    
    db.all(query, [username], (err, rows) => {
        if (err) return res.status(500).json({ error: "Rezervasyonlar alınamadı." });
        res.status(200).json(rows);
    });
});

// 2. Yeni rezervasyon oluştur
app.post('/api/reservations', (req, res) => {
    const { username, slot_number, plate_number, arrival_time } = req.body;

    if (!username || !slot_number || !plate_number || !arrival_time) {
        return res.status(400).json({ error: "Eksik bilgi." });
    }

    const insertQuery = `INSERT INTO reservations (username, slot_number, plate_number, arrival_time) VALUES (?, ?, ?, ?)`;
    const updateSlotQuery = `UPDATE parking_slots SET status = 'reserved' WHERE slot_number = ? AND status = 'empty'`;

    db.run(updateSlotQuery, [slot_number], function(err) {
        if (err) return res.status(500).json({ error: "Otopark durumu güncellenemedi." });
        if (this.changes === 0) return res.status(400).json({ error: "Bu yer zaten dolu veya rezerve." });

        db.run(insertQuery, [username, slot_number, plate_number, arrival_time], function(err) {
            if (err) return res.status(500).json({ error: "Rezervasyon kaydedilemedi." });
            res.status(201).json({ message: "Rezervasyon başarıyla tamamlandı!" });
        });
    });
});

// 3. Rezervasyon iptal et
app.delete('/api/reservations/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT slot_number FROM reservations WHERE id = ?`, [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Rezervasyon bulunamadı." });
        const slot_number = row.slot_number;

        db.run(`DELETE FROM reservations WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: "Rezervasyon silinemedi." });

            db.run(`UPDATE parking_slots SET status = 'empty' WHERE slot_number = ?`, [slot_number], function(err) {
                res.status(200).json({ message: "Rezervasyon başarıyla iptal edildi." });
            });
        });
    });
});

// --- SPRINT 4: ÜCRET HESAPLAMA VE ARAÇ ÇIKIŞ API (Senkronize Edildi) ---
app.post('/api/reserve/exit', (req, res) => {
    const { slot_number } = req.body; // Ekibin yeni yapısına göre slot_number (Örn: 'Z-03') alıyoruz
    const hourlyRate = 30; 

    if (!slot_number) {
        return res.status(400).json({ error: "Slot numarası gerekli." });
    }

    const hoursParked = 2; 
    const totalFee = hoursParked * hourlyRate;

    // Durumu ekibin yapısına uygun olarak 'empty' yapıyoruz
    const query = `UPDATE parking_slots SET status = 'empty' WHERE slot_number = ?`;

    db.run(query, [slot_number], function(err) {
        if (err) return res.status(500).json({ error: "Çıkış işlemi başarısız." });
        res.status(200).json({ 
            message: "Araç çıkışı yapıldı.",
            hours: hoursParked,
            fee: totalFee 
        });
    });
});

// --- SPRINT 4: ADMIN DOLULUK RAPORU API (Senkronize Edildi) ---
app.get('/api/admin/dashboard', (req, res) => {
    // Sorgu, yeni şemadaki 'status' alanına göre dinamik sayım yapacak şekilde güncellendi
    const query = `
        SELECT 
            COUNT(*) as total_slots,
            SUM(CASE WHEN status != 'empty' THEN 1 ELSE 0 END) as occupied_slots,
            SUM(CASE WHEN status = 'empty' THEN 1 ELSE 0 END) as empty_slots
        FROM parking_slots
    `;

    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: "Rapor verileri alınamadı." });
        res.status(200).json(row);
    });
});

// --- SPRINT 4: ADMIN PARK YERİ YÖNETİM API (Senkronize Edildi) ---
app.put('/api/admin/manage-slot', (req, res) => {
    const { slot_number, status } = req.body; // status: 'empty', 'occupied', 'reserved' gelecek

    if (!slot_number || !status) {
        return res.status(400).json({ error: "Eksik parametre." });
    }

    const query = `UPDATE parking_slots SET status = ? WHERE slot_number = ?`;

    db.run(query, [status, slot_number], function(err) {
        if (err) return res.status(500).json({ error: "Yönetim işlemi başarısız." });
        res.status(200).json({ message: `Slot ${slot_number} durumu '${status}' olarak güncellendi.` });
    });
});

// --- SUNUCU BAŞLATMA ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});