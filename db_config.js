const sqlite3 = require('sqlite3').verbose();

// database.db adında bir dosya oluşturur ve ona bağlanır
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Veritabanı bağlanırken hata oluştu:", err.message);
    } else {
        console.log("SQLite veritabanına başarıyla bağlanıldı.");
    }
});

db.serialize(() => {
    // 1. Kullanıcılar Tablosu (Kayıt ve Giriş API'si için)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        plate_number TEXT
    )`, (err) => {
        if (!err) {
            db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, (err) => {
                // Ignore error if column already exists
            });
        }
    });

    // Araçlar Tablosu (Çoklu araç yönetimi için)
    db.run(`CREATE TABLE IF NOT EXISTS user_vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        brand_model TEXT
    )`);

    // 2. Otopark Alanları Tablosu
    db.run(`CREATE TABLE IF NOT EXISTS parking_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'empty'
    )`);
    
    // 3. Rezervasyonlar Tablosu
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        slot_number TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 4. Abonelikler Tablosu
    db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        tc_no TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        brand_model TEXT NOT NULL,
        parking_location TEXT NOT NULL,
        subscription_type TEXT NOT NULL,
        status TEXT DEFAULT 'beklemede',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 5. Öneri ve Şikayet Tablosu
    db.run(`CREATE TABLE IF NOT EXISTS feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed verileri ekleme (Zemin ve 1. Kat)
    db.get("SELECT COUNT(*) AS count FROM parking_slots", (err, row) => {
        if (!err && row.count === 0) {
            const stmt = db.prepare("INSERT INTO parking_slots (slot_number, status) VALUES (?, ?)");
            
            // Zemin Kat
            for(let i=1; i<=16; i++) {
                let spot = `Z-${i.toString().padStart(2, '0')}`;
                stmt.run(spot, 'empty');
            }
            // 1. Kat
            for(let i=1; i<=16; i++) {
                let spot = `1K-${i.toString().padStart(2, '0')}`;
                stmt.run(spot, 'empty');
            }
            stmt.finalize();
            console.log("Başlangıç otopark alanları (Zemin ve 1. Kat) veritabanına eklendi.");
        }
    });

    console.log("Tablolar kontrol edildi/oluşturuldu.");
});

module.exports = db;