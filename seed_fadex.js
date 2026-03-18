+require('dotenv').config();
const supabase = require('./lib/supabase');
const bcrypt = require('bcryptjs');

async function run() {
    const slug = 'fadexlab';
    const password = 'Fadex!2026$Lab';
    const hashedPassword = await bcrypt.hash(password, 10);
    const recoveryPin = 'FADEXLAB';

    console.log('Fadexlab tenant oluşturuluyor...');

    let { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .insert([{
            name: 'Fadexlab',
            slug: slug,
            phone: '+90 552 618 23 04',
            email: 'info@fadexlab.com',
            address: 'İstanbul',
            whatsapp_number: '+905526182304',
            password: hashedPassword,
            recovery_pin: recoveryPin,
        }])
        .select()
        .single();

    if (tErr) {
        if (tErr.code === '23505') {
            console.log('Bu işletme slugı zaten var, şifre ve bilgileri güncelliyorum...');
            const { data: ext, error: upErr } = await supabase.from('tenants').update({
                name: 'Fadexlab',
                password: hashedPassword,
                phone: '+90 552 618 23 04',
                whatsapp_number: '+905526182304'
            }).eq('slug', slug).select().single();
            if (upErr) throw upErr;
            tenant = ext;

            console.log('Var olan servisler siliniyor ve yeniden yükleniyor...');
            await supabase.from('services').delete().eq('tenant_id', tenant.id);
        } else {
            console.error('Tenant oluşturma hatası:', tErr);
            process.exit(1);
        }
    }

    console.log('İşletme Oluşturuldu/Güncellendi ID:', tenant.id);

    const servicesList = [
        { name: 'Saç', price: 500 },
        { name: 'Sakal', price: 300 },
        { name: 'Sac-sakal', price: 650 },
        { name: 'Boya', price: 500 },
        { name: 'Kaş', price: 150 },
        { name: 'Maske', price: 200 },
        { name: 'Keratin', price: 1500 },
        { name: 'Perma', price: 1700 },
        { name: 'Renklendirme', price: 1200 },
        { name: 'Ciltbakimi', price: 500 }
    ];

    const sData = servicesList.map(s => ({
        tenant_id: tenant.id,
        name: s.name,
        price: s.price,
        duration_minutes: 30
    }));

    const { error: sErr } = await supabase.from('services').insert(sData);
    if (sErr) {
        console.error('Servis hatası:', sErr);
        process.exit(1);
    }

    console.log('Başarıyla ' + servicesList.length + ' adet servis eklendi!');
    process.exit(0);
}

run().catch(console.error);
