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
    )`);

    // 2. Otopark Alanları Tablosu (Simülasyon için)
    db.run(`CREATE TABLE IF NOT EXISTS parking_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_number TEXT NOT NULL,
        is_occupied INTEGER DEFAULT 0
    )`);
    
    console.log("Tablolar başarıyla oluşturuldu.");
});

module.exports = db;