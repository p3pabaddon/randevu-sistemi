const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');

// GET /api/customers/:tenantId — Müşteri listesi (appointments agregasyonu)
router.get('/:tenantId', authenticateTenant, async (req, res) => {
    try {
        const { tenantId } = req.params;
        if (tenantId !== req.tenantId) return res.status(403).json({ error: 'Erişim reddedildi.' });

        const { search } = req.query;

        // Tüm randevuları müşteri bilgileri ve hizmet fiyatlarıyla çek
        const { data: appts, error } = await supabase
            .from('appointments')
            .select('id, customer_name, customer_phone, appointment_date, appointment_time, status, services(name, price, discounted_price), appointment_extras(price_at_booking)')
            .eq('tenant_id', tenantId)
            .neq('status', 'cancelled');

        if (error) throw error;

        // Müşterileri telefon numarasına göre grupla
        const customerMap = {};
        for (const appt of appts) {
            const phone = appt.customer_phone;
            if (!customerMap[phone]) {
                customerMap[phone] = {
                    customer_name: appt.customer_name,
                    customer_phone: phone,
                    total_appointments: 0,
                    total_spent: 0,
                    last_appointment: null,
                    appointments: []
                };
            }
            const c = customerMap[phone];
            c.total_appointments++;

            // Hizmet fiyatı
            const svc = appt.services || {};
            const basePrice = svc.discounted_price != null ? Number(svc.discounted_price) : Number(svc.price || 0);
            const extrasPrice = (appt.appointment_extras || []).reduce((s, ex) => s + Number(ex.price_at_booking || 0), 0);
            if (appt.status === 'confirmed') {
                c.total_spent += (basePrice + extrasPrice);
            }

            // Son randevu tarihi
            if (!c.last_appointment || appt.appointment_date > c.last_appointment) {
                c.last_appointment = appt.appointment_date;
            }
            c.appointments.push(appt);
        }

        let customers = Object.values(customerMap);

        // Arama filtresi
        if (search) {
            const q = search.toLowerCase();
            customers = customers.filter(c =>
                c.customer_name.toLowerCase().includes(q) ||
                c.customer_phone.includes(q)
            );
        }

        // Harcamaya göre sırala
        customers.sort((a, b) => b.total_spent - a.total_spent);

        return res.json({ customers });
    } catch (err) {
        console.error('[GET /customers]', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
