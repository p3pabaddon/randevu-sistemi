require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const appointmentsRouter = require('./routes/appointments');
const tenantsRouter = require('./routes/tenants');
const servicesRouter = require('./routes/services');
const blockedSlotsRouter = require('./routes/blockedSlots');
const staffRouter = require('./routes/staff');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/appointments', appointmentsRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/blocked-slots', blockedSlotsRouter);
app.use('/api/staff', staffRouter);

// SPA fallback — her tenant slug'ı için aynı index.html döner
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n  Appointment Booking Server\n  → http://localhost:${PORT}\n`);
});
