/**
 * Super Admin Seed Script
 * İlk admin kullanıcısını oluşturur
 * Kullanım: node scripts/seed-admin.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');

async function seedAdmin() {
    const username = 'admin';
    const password = 'admin123'; // İlk şifre — giriş yaptıktan sonra değiştir!
    const email = 'admin@randevusistemi.com';
    const displayName = 'Platform Admin';

    console.log('\n  Super Admin oluşturuluyor...\n');

    // Zaten var mı kontrol et
    const { data: existing } = await supabase
        .from('super_admins')
        .select('id')
        .eq('username', username)
        .single();

    if (existing) {
        console.log('  ⚠ Admin kullanıcı zaten mevcut. İşlem atlandı.');
        console.log(`  → Kullanıcı adı: ${username}`);
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
        .from('super_admins')
        .insert([{
            username,
            email,
            password: hashedPassword,
            display_name: displayName,
            role: 'admin',
            is_active: true
        }])
        .select()
        .single();

    if (error) {
        console.error('  ✗ Hata:', error.message);
        process.exit(1);
    }

    console.log('  ✓ Super Admin oluşturuldu!');
    console.log(`  → Kullanıcı adı: ${username}`);
    console.log(`  → Şifre: ${password}`);
    console.log(`  → ID: ${data.id}`);
    console.log('\n  ⚠ Giriş yaptıktan sonra şifreyi değiştirmeyi unutma!\n');
    process.exit(0);
}

seedAdmin().catch(err => {
    console.error('Seed hatası:', err);
    process.exit(1);
});
