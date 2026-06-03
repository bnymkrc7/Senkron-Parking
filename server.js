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
            user: { id: user.id, username: user.username, email: user.email, plate: user.plate_number }
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
// --- ŞİFREMİ UNUTTUM API (Giriş Yapmamış Kullanıcılar İçin) ---
app.post('/api/user/forgot-password', async (req, res) => {
    const { email, plate_number, newPassword } = req.body;

    if (!email || !plate_number || !newPassword) {
        return res.status(400).json({ error: "E-posta, plaka ve yeni şifre gereklidir." });
    }

    // Şifre güvenliği kontrolü
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: "Şifreniz en az 8 karakter, 1 büyük harf ve 1 rakam içermelidir." });
    }

    // Kullanıcıyı e-posta ve plaka eşleşmesiyle doğrula (Güvenlik adımı)
    const checkQuery = `SELECT id FROM users WHERE email = ? AND plate_number = ?`;
    
    db.get(checkQuery, [email, plate_number], async (err, user) => {
        if (err) return res.status(500).json({ error: "Sunucu hatası." });
        if (!user) return res.status(404).json({ error: "Girilen e-posta ile plaka eşleşmedi veya sistemde bulunamadı." });

        try {
            // Eşleşme başarılıysa yeni şifreyi hashle ve kaydet
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
            
            db.run(updateQuery, [hashedPassword, user.id], function(err) {
                if (err) return res.status(500).json({ error: "Şifre güncellenirken bir hata oluştu." });
                res.status(200).json({ message: "Şifreniz başarıyla sıfırlandı! Artık yeni şifrenizle giriş yapabilirsiniz." });
            });
        } catch (error) {
            res.status(500).json({ error: "Şifre işlenirken hata oluştu." });
        }
    });
});
// --- ŞİFRE GÜNCELLEME ---
app.put('/api/user/update-password', async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).json({ error: "Kullanıcı ID ve yeni şifre gerekli." });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: "Şifreniz en az 8 karakter, 1 büyük harf ve 1 rakam içermelidir." });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = `UPDATE users SET password = ? WHERE id = ?`;
        
        db.run(query, [hashedPassword, userId], function(err) {
            if (err) return res.status(500).json({ error: "Şifre güncellenirken bir hata oluştu." });
            res.status(200).json({ message: "Şifre başarıyla güncellendi!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// --- KULLANICI PROFİLİ VE ARAÇ YÖNETİMİ ---

// Kullanıcı Profilini ve Araçlarını Getir
app.get('/api/user/:username/profile', (req, res) => {
    const { username } = req.params;
    const query = `SELECT id, username, email, phone, plate_number FROM users WHERE username = ?`;

    db.get(query, [username], (err, user) => {
        if (err) return res.status(500).json({ error: "Sunucu hatası." });
        if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const vehiclesQuery = `SELECT * FROM user_vehicles WHERE username = ?`;
        db.all(vehiclesQuery, [username], (err, vehicles) => {
            if (err) return res.status(500).json({ error: "Araçlar alınamadı." });
            res.status(200).json({ user, vehicles });
        });
    });
});

// Telefon Numarası Güncelle
app.patch('/api/user/phone', (req, res) => {
    const { userId, phone } = req.body;
    if (!userId) return res.status(400).json({ error: "Kullanıcı ID gerekli." });

    const query = `UPDATE users SET phone = ? WHERE id = ?`;
    db.run(query, [phone, userId], function(err) {
        if (err) return res.status(500).json({ error: "Telefon güncellenirken hata oluştu." });
        res.status(200).json({ message: "Telefon numarası güncellendi!" });
    });
});

// Yeni Araç Ekle
app.post('/api/user/vehicle', (req, res) => {
    const { username, plate_number, brand_model } = req.body;
    if (!username || !plate_number) return res.status(400).json({ error: "Kullanıcı adı ve plaka gerekli." });

    const query = `INSERT INTO user_vehicles (username, plate_number, brand_model) VALUES (?, ?, ?)`;
    db.run(query, [username, plate_number, brand_model], function(err) {
        if (err) return res.status(500).json({ error: "Araç eklenirken hata oluştu." });
        res.status(201).json({ message: "Araç başarıyla eklendi!", vehicleId: this.lastID });
    });
});

// Araç Güncelle
app.put('/api/user/vehicle/:id', (req, res) => {
    const { plate_number, brand_model } = req.body;
    const { id } = req.params;
    if (!plate_number) return res.status(400).json({ error: "Plaka numarası gerekli." });

    const query = `UPDATE user_vehicles SET plate_number = ?, brand_model = ? WHERE id = ?`;
    db.run(query, [plate_number, brand_model, id], function(err) {
        if (err) return res.status(500).json({ error: "Araç güncellenirken hata oluştu." });
        res.status(200).json({ message: "Araç başarıyla güncellendi!" });
    });
});

// Araç Sil
app.delete('/api/user/vehicle/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM user_vehicles WHERE id = ?`;
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: "Araç silinirken hata oluştu." });
        res.status(200).json({ message: "Araç başarıyla silindi." });
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

// --- ARAÇ GİRİŞ API (Plaka Okuma ile Otomatik) ---
app.post('/api/vehicle/enter', (req, res) => {
    const { plate_number } = req.body;

    if (!plate_number) {
        return res.status(400).json({ error: "Plaka numarası gerekli." });
    }

    // Rezervasyonlar tablosunda bu plakaya ait aktif bir kayıt var mı kontrol et
    const findQuery = `SELECT r.id, r.slot_number FROM reservations r JOIN parking_slots p ON r.slot_number = p.slot_number WHERE r.plate_number = ? AND p.status = 'reserved'`;

    db.get(findQuery, [plate_number], (err, row) => {
        if (err) return res.status(500).json({ error: "Sunucu hatası." });
        if (!row) return res.status(404).json({ error: "Bu plakaya ait aktif bir rezervasyon bulunamadı." });

        // Alanın durumunu 'occupied' (dolu / kırmızı) yap
        db.run(`UPDATE parking_slots SET status = 'occupied' WHERE slot_number = ?`, [row.slot_number], function(err) {
            if (err) return res.status(500).json({ error: "Park alanı durumu güncellenemedi." });

            console.log(`[ARAÇ GİRİŞ] Plaka: ${plate_number}, Slot: ${row.slot_number} → occupied`);
            res.status(200).json({
                message: `${plate_number} plakalı araç ${row.slot_number} alanına giriş yaptı.`,
                slot_number: row.slot_number
            });
        });
    });
});

// --- ARAÇ ÇIKIŞ API (Plaka Okuma ile Otomatik) ---
app.post('/api/vehicle/exit', (req, res) => {
    const { plate_number } = req.body;
    const hourlyRate = 30;

    if (!plate_number) {
        return res.status(400).json({ error: "Plaka numarası gerekli." });
    }

    // Rezervasyonlar tablosunda bu plakaya ait kaydı bul
    const findQuery = `SELECT r.id, r.slot_number, r.created_at FROM reservations r JOIN parking_slots p ON r.slot_number = p.slot_number WHERE r.plate_number = ? AND p.status = 'occupied'`;

    db.get(findQuery, [plate_number], (err, row) => {
        if (err) return res.status(500).json({ error: "Sunucu hatası." });
        if (!row) return res.status(404).json({ error: "Bu plakaya ait park halinde bir araç bulunamadı." });

        // Geçen süreyi hesapla (saat cinsinden, minimum 1 saat)
        const entryTime = new Date(row.created_at);
        const now = new Date();
        const diffMs = now - entryTime;
        const hoursParked = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
        const totalFee = hoursParked * hourlyRate;

        // 1. Alanı 'empty' (boş / yeşil) yap
        db.run(`UPDATE parking_slots SET status = 'empty' WHERE slot_number = ?`, [row.slot_number], function(err) {
            if (err) return res.status(500).json({ error: "Park alanı durumu güncellenemedi." });

            // 2. Rezervasyon kaydını sil
            db.run(`DELETE FROM reservations WHERE id = ?`, [row.id], function(err) {
                console.log(`[ARAÇ ÇIKIŞ] Plaka: ${plate_number}, Slot: ${row.slot_number} → empty (${hoursParked} saat, ${totalFee} TL)`);
                res.status(200).json({
                    message: `${plate_number} plakalı araç ${row.slot_number} alanından çıkış yaptı.`,
                    slot_number: row.slot_number,
                    hours: hoursParked,
                    fee: totalFee
                });
            });
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

// --- ADMIN GİRİŞ API ---
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    // Sabit admin kimlik bilgileri
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'Senkron2026';

    if (!username || !password) {
        return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli." });
    }

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.status(200).json({ message: "Admin girişi başarılı!", admin: { username: ADMIN_USER } });
    } else {
        res.status(401).json({ error: "Geçersiz admin bilgileri." });
    }
});

// --- ADMIN: TÜM REZERVASYONLARI LİSTELE ---
app.get('/api/admin/reservations', (req, res) => {
    const query = `SELECT r.*, p.status as slot_status FROM reservations r LEFT JOIN parking_slots p ON r.slot_number = p.slot_number ORDER BY r.created_at DESC`;
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Rezervasyonlar alınamadı." });
        res.status(200).json(rows);
    });
});

// --- ADMIN: TÜM KULLANICILARI LİSTELE ---
app.get('/api/admin/users', (req, res) => {
    const query = `SELECT id, username, email, plate_number FROM users ORDER BY id DESC`;
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Kullanıcılar alınamadı." });
        res.status(200).json(rows);
    });
});

// --- ADMIN: KULLANICIYI VE TÜM VERİLERİNİ SİL ---
app.delete('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT username, email FROM users WHERE id = ?`, [id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const { username, email } = user;

        db.all(`SELECT slot_number FROM reservations WHERE username = ?`, [username], (err, rows) => {
            if (!err && rows && rows.length > 0) {
                rows.forEach(row => {
                    db.run(`UPDATE parking_slots SET status = 'empty' WHERE slot_number = ?`, [row.slot_number]);
                });
            }

            db.serialize(() => {
                db.run(`DELETE FROM reservations WHERE username = ?`, [username]);
                db.run(`DELETE FROM user_vehicles WHERE username = ?`, [username]);
                db.run(`DELETE FROM subscriptions WHERE username = ?`, [username]);
                db.run(`DELETE FROM feedbacks WHERE email = ?`, [email]);
                
                db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
                    if (err) return res.status(500).json({ error: "Kullanıcı silinemedi." });
                    res.status(200).json({ message: "Kullanıcı ve ilişkili tüm verileri başarıyla silindi." });
                });
            });
        });
    });
});

// --- OTOMATİK REZERVASYON İPTALİ  ---
setInterval(() => {

    const query = `
        SELECT r.id, r.slot_number 
        FROM reservations r 
        JOIN parking_slots p ON r.slot_number = p.slot_number 
        WHERE p.status = 'reserved' 
        AND datetime(r.created_at, '+' || r.arrival_time || ' minutes', '+60 minutes') < datetime('now')
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Otomatik iptal kontrolünde hata oluştu:", err.message);
            return;
        }

        if (rows && rows.length > 0) {
            rows.forEach(row => {
                
                db.run(`DELETE FROM reservations WHERE id = ?`, [row.id], function(err) {
                    if (err) {
                        console.error(`Rezervasyon ${row.id} silinirken hata:`, err.message);
                        return;
                    }

                    db.run(`UPDATE parking_slots SET status = 'empty' WHERE slot_number = ?`, [row.slot_number], function(err) {
                        if (err) {
                            console.error(`Slot ${row.slot_number} güncellenirken hata:`, err.message);
                        } else {
                            console.log(`[OTOMATİK İPTAL] Rezervasyon ID: ${row.id}, Slot: ${row.slot_number} (Giriş yapılmadığı için iptal edildi)`);
                        }
                    });
                });
            });
        }
    });
}, 60000); // 60000 ms = 1 dakika

// --- ABONELİK İŞLEMLERİ ---

// 1. Yeni Abonelik Başvurusu
app.post('/api/subscription/apply', (req, res) => {
    const { username, first_name, last_name, tc_no, phone, email, plate_number, brand_model, parking_location, subscription_type } = req.body;

    if (!username || !first_name || !last_name || !tc_no || !phone || !email || !plate_number || !brand_model || !parking_location || !subscription_type) {
        return res.status(400).json({ error: "Lütfen tüm alanları doldurun." });
    }

    const query = `INSERT INTO subscriptions (username, first_name, last_name, tc_no, phone, email, plate_number, brand_model, parking_location, subscription_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [username, first_name, last_name, tc_no, phone, email, plate_number, brand_model, parking_location, subscription_type], function(err) {
        if (err) return res.status(500).json({ error: "Başvuru kaydedilirken bir hata oluştu." });
        res.status(201).json({ message: "Başvurunuz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz." });
    });
});

// 2. Admin: Tüm Abonelikleri Listele
app.get('/api/admin/subscriptions', (req, res) => {
    const query = `SELECT * FROM subscriptions ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Abonelikler alınamadı." });
        res.status(200).json(rows);
    });
});

// 3. Admin: Abonelik Durumu Güncelle (Onayla / Reddet)
app.patch('/api/admin/subscriptions/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'onaylandı', 'reddedildi'

    if (!status) return res.status(400).json({ error: "Durum bilgisi gerekli." });

    const query = `UPDATE subscriptions SET status = ? WHERE id = ?`;
    db.run(query, [status, id], function(err) {
        if (err) return res.status(500).json({ error: "Durum güncellenemedi." });
        res.status(200).json({ message: `Abonelik durumu '${status}' olarak güncellendi.` });
    });
});

// Admin: Abonelik Başvurusunu Sil
app.delete('/api/admin/subscriptions/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM subscriptions WHERE id = ?`;
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: "Abonelik silinemedi." });
        res.status(200).json({ message: "Abonelik başarıyla silindi." });
    });
});

// 4. Kullanıcı: Kendi Abonelik Durumunu Sorgula
app.get('/api/subscription/:username', (req, res) => {
    const { username } = req.params;
    const query = `SELECT * FROM subscriptions WHERE username = ? ORDER BY created_at DESC`;
    db.all(query, [username], (err, rows) => {
        if (err) return res.status(500).json({ error: "Abonelik bilgisi alınamadı." });
        res.status(200).json(rows);
    });
});

// --- ÖNERİ / ŞİKAYET İŞLEMLERİ ---

// 1. Yeni Öneri/Şikayet Gönder
app.post('/api/feedback', (req, res) => {
    const { full_name, email, category, message } = req.body;

    if (!full_name || !email || !category || !message) {
        return res.status(400).json({ error: "Lütfen tüm alanları doldurun." });
    }

    const query = `INSERT INTO feedbacks (full_name, email, category, message) VALUES (?, ?, ?, ?)`;
    db.run(query, [full_name, email, category, message], function(err) {
        if (err) return res.status(500).json({ error: "Mesajınız kaydedilirken bir hata oluştu." });
        res.status(201).json({ message: "Mesajınız başarıyla iletilmiştir. Teşekkür ederiz!" });
    });
});

// 2. Admin: Tüm Öneri/Şikayetleri Listele
app.get('/api/admin/feedbacks', (req, res) => {
    const query = `SELECT * FROM feedbacks ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Geri bildirimler alınamadı." });
        res.status(200).json(rows);
    });
});

// 3. Admin: Öneri/Şikayet Sil
app.delete('/api/admin/feedbacks/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM feedbacks WHERE id = ?`;
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: "Mesaj silinemedi." });
        res.status(200).json({ message: "Mesaj başarıyla silindi." });
    });
});

// 4. Admin: Öneri/Şikayet Okundu İşaretle
app.patch('/api/admin/feedbacks/:id/read', (req, res) => {
    const { id } = req.params;
    const query = `UPDATE feedbacks SET is_read = 1 WHERE id = ?`;
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: "Durum güncellenemedi." });
        res.status(200).json({ message: "Okundu olarak işaretlendi." });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});