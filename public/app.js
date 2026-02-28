/* ─────────────────────────────────────────────────────────────────────────
   Appointment Dashboard — app.js
   Stack: Vanilla JS + Supabase JS CDN + REST API (Express backend)
   ───────────────────────────────────────────────────────────────────────── */

// ── CONFIG ────────────────────────────────────────────────────────────────────
const API_BASE = window.location.origin + '/api';
const SUPABASE_URL = 'https://wlzchjkxtnyyrqdurtkn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XjkUlPhXdsBc3_U2AyX9hQ_JXSl8cr1';

// ── STATE ─────────────────────────────────────────────────────────────────────
const state = {
    tenantSlug: null,
    tenantId: null,
    tenant: null,
    services: [],
    staff: [],
    activeTab: 'today',
    activeModal: null,
};

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const loginScreen = $('login-screen');
const app = $('app');
const slugInput = $('tenant-slug-input');
const passwordInput = $('admin-password-input');
const loginBtn = $('login-btn');
const loginError = $('login-error');
const logoutBtn = $('logout-btn');
const tenantBadge = $('tenant-name-badge');
const pageTitle = $('page-title');
const datetimeDisp = $('current-datetime');
const connStatus = $('connection-status');
const todayLabel = $('today-date-label');
const modal = $('detail-modal');
const modalBackdrop = $('modal-backdrop');
const modalTitle = $('modal-title');
const modalBody = $('modal-body');
const modalClose = $('modal-close-btn');
const modalConfirm = $('modal-confirm-btn');
const modalCancel = $('modal-cancel-btn');
const modalWA = $('modal-whatsapp-btn');

// ── HELPERS ───────────────────────────────────────────────────────────────────
const localDateStr = (date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const today = () => localDateStr();
const isPast = (d, t) => new Date(`${d}T${t.slice(0, 5)}:00`) < new Date();
const pad = (n) => String(n).padStart(2, '0');
const formatDate = (d) => { const [y, m, day] = d.split('-'); return `${day}.${m}.${y}`; };
function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function updateClock() {
    const n = new Date();
    datetimeDisp.textContent = `${pad(n.getDate())}.${pad(n.getMonth() + 1)}.${n.getFullYear()}  ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
}

// ── NOTIFICATION SOUND ────────────────────────────────────────────────────────
// Global AudioContext — tarayıcı politikası gereği ilk kullanıcı etkileşiminde
// unlock ediyoruz, aksi hâlde ses çalınmaz.
let _audioCtx = null;

function _unlockAudio() {
    if (_audioCtx) return;
    try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Suspended durumda olabilir — resume et
        if (_audioCtx.state === 'suspended') _audioCtx.resume();
    } catch (_) { }
}

// İlk tıklama / tuş basışında AudioContext oluştur
document.addEventListener('click', _unlockAudio, { once: false });
document.addEventListener('keydown', _unlockAudio, { once: false });

function playNotificationSound() {
    try {
        // Context yoksa oluştur; suspended'sa resume et
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (_audioCtx.state === 'suspended') _audioCtx.resume();

        const ctx = _audioCtx;
        const notes = [523.25, 659.25, 783.99]; // C5-E5-G5 major triad
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.13);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.13 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.55);
            osc.start(ctx.currentTime + i * 0.13);
            osc.stop(ctx.currentTime + i * 0.13 + 0.6);
        });
    } catch (e) { console.warn('[Sound] Çalınamadı:', e.message); }
}

// ── THEME ─────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    const loginBtn = document.getElementById('login-theme-btn');
    if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
        if (icon) icon.textContent = '☀️';
        if (label) label.textContent = 'Açık';
        if (loginBtn) loginBtn.textContent = '☀️';
        if (document.getElementById('fp-dark-theme')) {
            document.getElementById('fp-dark-theme').disabled = true;
        }
    } else {
        document.documentElement.classList.remove('theme-light');
        if (icon) icon.textContent = '🌙';
        if (label) label.textContent = 'Koyu';
        if (loginBtn) loginBtn.textContent = '🌙';
        if (document.getElementById('fp-dark-theme')) {
            document.getElementById('fp-dark-theme').disabled = false;
        }
    }
}

function toggleTheme() {
    const isLight = document.documentElement.classList.contains('theme-light');
    const next = isLight ? 'dark' : 'light';
    localStorage.setItem('randevu-theme', next);
    applyTheme(next);
}

// Load saved theme immediately on page load
applyTheme(localStorage.getItem('randevu-theme') || 'dark');

// Delegated click handler for the theme button (works before & after login)
document.addEventListener('click', (e) => {
    if (e.target.closest('#theme-toggle-btn')) toggleTheme();
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
loginBtn.addEventListener('click', doLogin);
slugInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { passwordInput ? passwordInput.focus() : doLogin(); } });
if (passwordInput) passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });


async function doLogin() {
    const slug = slugInput.value.trim().toLowerCase();
    const password = passwordInput ? passwordInput.value : '';
    if (!slug) return showLoginError('İşletme kodu boş olamaz.');
    if (!password) return showLoginError('Şifre boş olamaz.');
    loginBtn.disabled = true; loginBtn.textContent = 'Kontrol ediliyor...';
    clearLoginError();
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, password }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error || 'Giriş başarısız.');
        }
        const { tenant } = await res.json();
        state.tenant = tenant;
        state.tenantId = tenant.id;
        state.tenantSlug = tenant.slug;
        state.services = tenant.services || [];
        await fetchStaff();
        tenantBadge.textContent = tenant.name;
        loginScreen.classList.add('hidden');
        const loginBg = document.getElementById('login-bg');
        if (loginBg) loginBg.style.display = 'none';
        app.classList.remove('hidden');
        initDashboard();
    } catch (err) {
        showLoginError(err.message);
    } finally {
        loginBtn.disabled = false; loginBtn.textContent = 'Giriş Yap';
    }
}
function showLoginError(msg) { loginError.textContent = msg; loginError.classList.remove('hidden'); }
function clearLoginError() { loginError.classList.add('hidden'); }

// ── ŞİFRE SIFIRLAMA MODAL ────────────────────────────────────────────────────
const resetOverlay = $('reset-overlay');
const resetCloseBtn = $('reset-close-btn');
const resetSubmitBtn = $('reset-submit-btn');
const resetMsg = $('reset-msg');
const forgotPwBtn = $('forgot-pw-btn');

if (forgotPwBtn) forgotPwBtn.addEventListener('click', () => {
    // Slug'ı login'den kopyala
    const slug = slugInput ? slugInput.value.trim() : '';
    if (slug && $('reset-slug')) $('reset-slug').value = slug;
    resetOverlay.classList.remove('hidden');
    const firstInput = $('reset-slug');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
});

if (resetCloseBtn) resetCloseBtn.addEventListener('click', closeResetModal);
if (resetOverlay) resetOverlay.addEventListener('click', (e) => { if (e.target === resetOverlay) closeResetModal(); });

function closeResetModal() {
    resetOverlay.classList.add('hidden');
    // Alanları temizle
    ['reset-slug', 'reset-new-pw', 'reset-confirm-pw'].forEach(id => {
        const el = $(id); if (el) el.value = '';
    });
    setResetMsg('', null);
}

function setResetMsg(msg, isErr) {
    if (!resetMsg) return;
    resetMsg.textContent = msg;
    if (!msg) { resetMsg.classList.add('hidden'); return; }
    resetMsg.classList.remove('hidden');
    resetMsg.style.color = isErr ? 'var(--red)' : 'var(--green)';
    resetMsg.style.background = isErr ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)';
}

if (resetSubmitBtn) resetSubmitBtn.addEventListener('click', doResetPassword);

// Enter tuşu ile gönder
['reset-slug', 'reset-new-pw', 'reset-confirm-pw'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') doResetPassword(); });
});

async function doResetPassword() {
    const slug = ($('reset-slug')?.value || '').trim().toLowerCase();
    const newPassword = $('reset-new-pw')?.value || '';
    const confirmPassword = $('reset-confirm-pw')?.value || '';

    if (!slug) return setResetMsg('İşletme kodu boş olamaz.', true);
    if (!newPassword || newPassword.length < 4) return setResetMsg('Yeni şifre en az 4 karakter olmalıdır.', true);
    if (newPassword !== confirmPassword) return setResetMsg('Yeni şifreler eşleşmiyor.', true);

    resetSubmitBtn.disabled = true;
    resetSubmitBtn.textContent = 'Güncelleniyor...';
    setResetMsg('', null);

    try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, newPassword }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Şifre güncellenemedi.');
        setResetMsg('✅ Şifre başarıyla güncellendi! Şimdi giriş yapabilirsiniz.', false);
        setTimeout(() => {
            closeResetModal();
            if (slugInput) slugInput.value = slug;
            if (passwordInput) { passwordInput.value = ''; passwordInput.focus(); }
        }, 2500);
    } catch (err) {
        setResetMsg(err.message, true);
    } finally {
        resetSubmitBtn.disabled = false;
        resetSubmitBtn.textContent = 'Şifreyi Güncelle';
    }
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', () => location.reload());

// ── DASHBOARD INIT ────────────────────────────────────────────────────────────
function initDashboard() {
    updateClock();
    setInterval(updateClock, 1000);
    const d = new Date();
    todayLabel.textContent = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    populateTimeSlots();
    populateServiceDropdown();
    populateSettings();
    setMinDate();
    loadToday();
    // 10 saniyede bir otomatik yenile
    setInterval(() => {
        if (state.activeTab === 'today') loadToday();
    }, 10000);
    initTabs();
    initFilters();
    initNewAppointmentForm();
    initModal();
    initRealtime();
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const tabMap = {
    today: { nav: 'nav-today', section: 'tab-today', title: 'Bugünün Randevuları' },
    all: { nav: 'nav-all', section: 'tab-all', title: 'Tüm Randevular' },
    new: { nav: 'nav-new', section: 'tab-new', title: 'Yeni Randevu' },
    settings: { nav: 'nav-settings', section: 'tab-settings', title: 'Ayarlar' },
};

function initTabs() {
    Object.keys(tabMap).forEach(k => $(tabMap[k].nav).addEventListener('click', () => switchTab(k)));
}

function switchTab(key) {
    Object.keys(tabMap).forEach(k => {
        $(tabMap[k].nav).classList.remove('active');
        $(tabMap[k].section).classList.add('hidden');
    });
    $(tabMap[key].nav).classList.add('active');
    $(tabMap[key].section).classList.remove('hidden');
    pageTitle.textContent = tabMap[key].title;
    state.activeTab = key;
    if (key === 'all') loadAll();
}

// ── LOAD TODAY ────────────────────────────────────────────────────────────────
$('refresh-today-btn').addEventListener('click', loadToday);
let _todayAllAppts = [];
let _activeStatFilter = null;

async function loadToday() {
    const data = await fetchAppointments({ date: today() });
    _todayAllAppts = data;
    applyStatFilter(_activeStatFilter);
    updateStats(data);
}

function applyStatFilter(status) {
    _activeStatFilter = status;
    const filtered = status ? _todayAllAppts.filter(a => a.status === status) : _todayAllAppts;
    renderAppointments('today-appointments', filtered);
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('stat-active'));
    const map = { null: 'stat-total', confirmed: 'stat-confirmed', pending: 'stat-pending', cancelled: 'stat-cancelled' };
    const targetId = map[status] || 'stat-total';
    const el = document.getElementById(targetId);
    if (el) el.closest('.stat-card')?.classList.add('stat-active');
}

// ── LOAD ALL ──────────────────────────────────────────────────────────────────
let filterDatePicker = null;

async function loadAll() {
    $('all-appointments').innerHTML = '<div class="loading-state">Yükleniyor...</div>';
    const dateVal = $('filter-date').value || null;
    const data = await fetchAppointments({
        date: dateVal,
        status: $('filter-status').value || null,
        staff: $('filter-staff') ? $('filter-staff').value : null,
    });
    renderAppointments('all-appointments', data);

    // filterDatePicker init
    const el = $('filter-date');
    if (el && !filterDatePicker) {
        filterDatePicker = flatpickr(el, { locale: 'tr', dateFormat: 'Y-m-d', disableMobile: true });
    }
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
function initFilters() {
    $('apply-filter-btn').addEventListener('click', loadAll);
    $('clear-filter-btn').addEventListener('click', () => {
        $('filter-date').value = ''; $('filter-status').value = '';
        if ($('filter-staff')) $('filter-staff').value = '';
        loadAll();
    });

    // Stat card filters for today
    const map = {
        'stat-total': null,
        'stat-confirmed': 'confirmed',
        'stat-pending': 'pending',
        'stat-cancelled': 'cancelled'
    };
    for (const [id, status] of Object.entries(map)) {
        const el = $(id);
        if (el && el.closest('.stat-card')) {
            el.closest('.stat-card').style.cursor = 'pointer';
            el.closest('.stat-card').addEventListener('click', () => {
                if (state.activeTab === 'today') applyStatFilter(status);
            });
        }
    }
}

// ── FETCH ─────────────────────────────────────────────────────────────────────
async function fetchAppointments({ date, status, staff } = {}) {
    let url = `${API_BASE}/appointments/${state.tenantId}`;
    const p = new URLSearchParams();
    if (date) p.set('date', date);
    if (status) p.set('status', status);
    if (staff) p.set('staff_id', staff);
    if ([...p].length) url += '?' + p.toString();
    try {
        const r = await fetch(url);
        return (await r.json()).appointments || [];
    } catch { return []; }
}

// ── RENDER APPOINTMENTS ───────────────────────────────────────────────────────
function renderAppointments(containerId, list) {
    const el = $(containerId);
    if (!list.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">&#9633;</div><p>Randevu bulunamadı.</p></div>`;
        return;
    }
    el.innerHTML = list.map(buildCard).join('');
    el.querySelectorAll('.appointment-card').forEach(card => {
        card.addEventListener('click', () => openModal(JSON.parse(card.dataset.appointment)));
    });
}

function buildCard(a) {
    const past = isPast(a.appointment_date, a.appointment_time);
    const expired = past && a.status !== 'cancelled';
    const svcName = a.services?.name || '–';
    const staffName = a.staff?.name || 'Farketmez';
    const price = a.services?.price != null ? `${Number(a.services.price).toLocaleString('tr-TR')} ₺` : '';
    const duration = a.services?.duration_minutes ? `${a.services.duration_minutes} dk` : '';
    const expiredBadge = expired ? `<span class="status-badge expired">Süresi Doldu</span>` : `<span class="status-badge ${a.status}">${statusLabel(a.status)}</span>`;
    return `
  <div class="appointment-card status-${a.status} ${expired ? 'expired' : ''}"
       data-id="${a.id}"
       data-appointment='${JSON.stringify(a).replace(/'/g, "&#39;")}'>
    <div class="card-time">
      <span class="card-time-main">${a.appointment_time?.slice(0, 5)}</span>
      <span class="card-time-date">${formatDate(a.appointment_date)}</span>
    </div>
    <div class="card-info">
      <div class="card-name">${esc(a.customer_name)}</div>
      <div class="card-meta">
        <span>${esc(a.customer_phone)}</span>
        ${svcName !== '–' ? `<span class="card-service-tag">${esc(svcName)}</span>` : ''}
        <span class="card-service-tag" style="background:#526488;color:#fff">${esc(staffName)}</span>
        ${duration ? `<span>${duration}</span>` : ''}
        ${price ? `<span>${price}</span>` : ''}
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-ghost btn-sm whatsapp-quick-btn"
              onclick="event.stopPropagation(); quickWhatsApp('${esc(a.customer_phone)}','${esc(a.customer_name)}','${formatDate(a.appointment_date)}','${a.appointment_time?.slice(0, 5)}','${esc(svcName)}','${a.status}',${expired})"
              title="WhatsApp Gönder">WA</button>
      <button class="btn btn-danger btn-sm delete-appt-btn"
              onclick="event.stopPropagation(); deleteAppointmentCard('${a.id}', this)"
              title="Randevuyu Sil">🗑</button>
    </div>
    ${expiredBadge}
  </div>`;
}

function statusLabel(s) {
    return { pending: 'Bekleyen', confirmed: 'Onaylı', cancelled: 'İptal' }[s] || s;
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function updateStats(list) {
    $('stat-total').textContent = list.length;
    $('stat-confirmed').textContent = list.filter(a => a.status === 'confirmed').length;
    $('stat-pending').textContent = list.filter(a => a.status === 'pending').length;
    $('stat-cancelled').textContent = list.filter(a => a.status === 'cancelled').length;
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function initModal() {
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    modalConfirm.addEventListener('click', () => updateStatus('confirmed'));
    modalCancel.addEventListener('click', () => updateStatus('cancelled'));
    modalWA.addEventListener('click', () => {
        if (!state.activeModal) return;
        const a = state.activeModal;
        const past = isPast(a.appointment_date, a.appointment_time);
        const expired = past && a.status !== 'cancelled';
        quickWhatsApp(a.customer_phone, a.customer_name, formatDate(a.appointment_date), a.appointment_time?.slice(0, 5), a.services?.name || '–', a.status, expired);
    });
    $('modal-delete-btn').addEventListener('click', () => {
        if (!state.activeModal) return;
        deleteAppointment(state.activeModal.id, true);
    });
}

function openModal(a) {
    state.activeModal = a;
    modalTitle.textContent = `Randevu — ${a.customer_name}`;
    const svc = a.services?.name || '–';
    const staff = a.staff?.name || 'Farketmez (Herhangi Biri)';
    const price = a.services?.price != null ? `${Number(a.services.price).toLocaleString('tr-TR')} ₺` : '–';
    modalBody.innerHTML = `
    <div class="modal-row"><label>Müşteri</label><span>${esc(a.customer_name)}</span></div>
    <div class="modal-row"><label>Telefon</label><span>${esc(a.customer_phone)}</span></div>
    <div class="modal-row"><label>Hizmet</label><span>${esc(svc)}</span></div>
    <div class="modal-row"><label>Personel</label><span>${esc(staff)}</span></div>
    <div class="modal-row"><label>Tarih</label><span>${formatDate(a.appointment_date)}</span></div>
    <div class="modal-row"><label>Saat</label><span>${a.appointment_time?.slice(0, 5)}</span></div>
    <div class="modal-row"><label>Ücret</label><span>${price}</span></div>
    <div class="modal-row"><label>Durum</label><span class="status-badge ${a.status}">${statusLabel(a.status)}</span></div>
    ${a.notes ? `<div class="modal-row"><label>Not</label><span>${esc(a.notes)}</span></div>` : ''}
  `;
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    state.activeModal = null;
}

async function updateStatus(newStatus) {
    if (!state.activeModal) return;
    const id = state.activeModal.id;
    try {
        const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('Güncellenemedi');
        closeModal();
        if (state.activeTab === 'today') loadToday();
        else loadAll();
    } catch (e) { alert('Hata: ' + e.message); }
}

// ── DELETE APPOINTMENT ────────────────────────────────────────────────────────
async function deleteAppointment(id, fromModal = false) {
    if (!confirm('Bu randevuyu kalıcı olarak silmek istiyor musunuz?')) return;
    try {
        const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Silinemedi');
        if (fromModal) closeModal();
        if (state.activeTab === 'today') loadToday();
        else loadAll();
    } catch (e) { alert('Silme hatası: ' + e.message); }
}
window.deleteAppointment = deleteAppointment;

// Kart üzerindeki silme butonu için (inline onclick'ten çağrılır)
async function deleteAppointmentCard(id, btn) {
    if (btn.dataset.confirm !== 'yes') {
        btn.dataset.confirm = 'yes';
        btn.textContent = '❓';
        btn.title = 'Emin misin? Tekrar tıkla';
        btn.style.background = '#c0392b';
        setTimeout(() => {
            btn.dataset.confirm = '';
            btn.textContent = '🗑';
            btn.title = 'Randevuyu Sil';
            btn.style.background = '';
        }, 2500);
        return;
    }
    await deleteAppointment(id);
}
window.deleteAppointmentCard = deleteAppointmentCard;

// ── WHATSAPP ──────────────────────────────────────────────────────────────────
function quickWhatsApp(phone, name, date, time, service, status = 'confirmed', expired = false) {
    const num = phone.replace(/\D/g, '');
    let msg;
    if (expired) {
        msg = `Merhaba ${name},\n\n${service} için ${date} ${time} randevunuzun süresi dolmuştur.\nYeni bir randevu oluşturmak isterseniz bizimle iletişime geçin.`;
    } else if (status === 'cancelled') {
        msg = `Merhaba ${name},\n\nÜzgünüz, ${service} için ${date} ${time} randevunuz iptal edilmiştir.\nYeni randevu almak için lütfen bizimle iletişime geçin.`;
    } else if (status === 'confirmed') {
        msg = `Merhaba ${name}! 👋\n\n${service} için ${date} ${time} randevunuz onaylanmıştır. ✅\nBizi tercih ettiğiniz için teşekkürler.`;
    } else {
        // pending
        msg = `Merhaba ${name},\n\n${service} için ${date} ${time} randevunuz alınmıştır.\nEn kısa sürede size döneceğiz.`;
    }
    window.open(`https://api.whatsapp.com/send/?phone=${num}&text=${encodeURIComponent(msg)}`, '_blank');
}
window.quickWhatsApp = quickWhatsApp;

// ── NEW APPOINTMENT FORM ──────────────────────────────────────────────────────

let fDatePicker = null;

function setMinDate() {
    const d = $('f-date');
    if (d) {
        d.value = today();
        if (!fDatePicker) {
            fDatePicker = flatpickr(d, {
                locale: 'tr',
                dateFormat: 'Y-m-d',
                minDate: 'today',
                defaultDate: today(),
                disableMobile: true
            });
        } else {
            fDatePicker.setDate(today());
        }
    }
}

function populateTimeSlots() {
    const sel = $('f-time');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seçiniz</option>';
    for (let h = 9; h <= 20; h++) {
        ['00', '30'].forEach(m => {
            const val = `${pad(h)}:${m}`;
            const opt = new Option(val, val);
            sel.appendChild(opt);
        });
    }
}

function populateServiceDropdown() {
    const sel = $('f-service');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seçiniz</option>';
    state.services.forEach(s => {
        const opt = new Option(s.name + (s.price != null ? ` — ${Number(s.price).toLocaleString('tr-TR')} ₺` : ''), s.id);
        sel.appendChild(opt);
    });
}

function initNewAppointmentForm() {
    const form = $('new-appointment-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('f-name').value.trim();
        const phone = $('f-phone').value.trim();
        const date = $('f-date').value;
        const time = $('f-time').value;
        const svcId = $('f-service').value;
        const notes = $('f-notes').value.trim();
        if (!name || !phone || !date || !time) return showFormMsg('Ad, telefon, tarih ve saat zorunludur.', true);
        const btn = $('create-btn');
        btn.disabled = true; btn.textContent = 'Kaydediliyor...';
        try {
            const res = await fetch(`${API_BASE}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: state.tenantId,
                    customer_name: name, customer_phone: phone,
                    appointment_date: date, appointment_time: time,
                    service_id: svcId || null, notes: notes || null,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Hata');
            showFormMsg('Randevu oluşturuldu!', false);
            form.reset(); setMinDate();
            loadToday();
        } catch (e) {
            showFormMsg(e.message, true);
        } finally {
            btn.disabled = false; btn.textContent = 'Randevu Oluştur';
        }
    });
}

function showFormMsg(msg, isErr) {
    const el = $('form-message');
    el.textContent = msg;
    el.className = 'form-message ' + (isErr ? 'error' : 'success');
    setTimeout(() => { el.className = 'form-message hidden'; }, 3500);
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
function populateSettings() {
    const t = state.tenant;
    $('settings-info').innerHTML = `
    <div class="settings-field"><label>İşletme Adı</label><span>${esc(t.name)}</span></div>
    <div class="settings-field"><label>Slug</label><span>${esc(t.slug)}</span></div>
    <div class="settings-field"><label>Telefon</label><span>${esc(t.phone || '–')}</span></div>
    <div class="settings-field"><label>E-posta</label><span>${esc(t.email || '–')}</span></div>
    <div class="settings-field"><label>Adres</label><span>${esc(t.address || '–')}</span></div>
  `;

    // Müşteri form linki
    const bookingUrl = `${window.location.origin}/booking.html?tenant=${t.slug}`;
    $('booking-url').textContent = bookingUrl;
    $('copy-booking-btn').onclick = () => {
        navigator.clipboard.writeText(bookingUrl).then(() => {
            $('copy-booking-btn').textContent = 'Kopyalandı!';
            setTimeout(() => { $('copy-booking-btn').textContent = 'Kopyala'; }, 2000);
        });
    };

    // Hizmet listesi + ekle/sil
    renderServicesList();
    renderStaffList();
    $('add-svc-btn').onclick = async () => {
        const name = $('svc-name').value.trim();
        const duration = parseInt($('svc-duration').value) || 60;
        const price = $('svc-price').value !== '' ? parseFloat($('svc-price').value) : null;
        if (!name) return showSvcMsg('Hizmet adı boş olamaz.', true);
        $('add-svc-btn').disabled = true;
        try {
            const res = await fetch(`${API_BASE}/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: state.tenantId, name, duration_minutes: duration, price }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Hata');
            state.services.push(json.service);
            $('svc-name').value = ''; $('svc-duration').value = ''; $('svc-price').value = '';
            renderServicesList();
            populateServiceDropdown();
            showSvcMsg(`"${name}" eklendi.`, false);
        } catch (e) { showSvcMsg(e.message, true); }
        finally { $('add-svc-btn').disabled = false; }
    };

    // Saat bloke
    const blockDateEl = $('block-date');
    const todayStr = today();
    blockDateEl.min = todayStr;
    blockDateEl.value = todayStr;
    blockDateEl.onchange = () => loadBlockGrid(blockDateEl.value);

    // YENİ: Personel seçimi değişince saat tablosunu güncelle
    const blockStaffEl = $('block-staff');
    if (blockStaffEl) {
        blockStaffEl.onchange = () => loadBlockGrid(blockDateEl.value);
    }

    loadBlockGrid(todayStr);
}

function showSvcMsg(msg, isErr) {
    const el = $('svc-msg');
    el.textContent = msg;
    el.className = 'form-message ' + (isErr ? 'error' : 'success');
    setTimeout(() => { el.className = 'form-message hidden'; el.textContent = ''; }, 3000);
}

function showStaffMsg(msg, isErr) {
    const el = $('staff-msg');
    el.textContent = msg;
    el.className = 'form-message ' + (isErr ? 'error' : 'success');
    setTimeout(() => { el.className = 'form-message hidden'; el.textContent = ''; }, 3000);
}

function renderServicesList() {
    const el = $('services-list');
    if (!state.services.length) {
        el.innerHTML = '<div class="loading-state">Henüz hizmet eklenmemiş.</div>';
        return;
    }
    el.innerHTML = state.services.map(s => `
    <div class="service-row" data-svc-id="${s.id}">
      <span class="svc-name">${esc(s.name)}</span>
      <span class="svc-meta">
        ${s.duration_minutes ? `<span>${s.duration_minutes} dk</span>` : ''}
        ${s.price != null ? `<span>${Number(s.price).toLocaleString('tr-TR')} ₺</span>` : ''}
      </span>
      <button class="svc-del-btn" data-action="delete-svc" data-id="${s.id}">Sil</button>
    </div>`).join('');
}

// ── SETTINGS: STAFF ──────────────────────────────────────────────────────────
async function fetchStaff() {
    try {
        const res = await fetch(`${API_BASE}/staff/${state.tenantId}`);
        const json = await res.json();
        state.staff = json.staff || [];
    } catch (e) { console.error('Staff fetch error:', e); }
}

function renderStaffList() {
    const el = $('staff-list');
    if (!state.staff.length) {
        el.innerHTML = '<p class="form-hint">Henüz personel eklenmemiş.</p>';
    } else {
        el.innerHTML = state.staff.map(s => `
      <div class="service-row">
        <span>${esc(s.name)}</span>
        <button class="btn btn-danger btn-sm svc-del-btn" data-id="${s.id}" data-action="delete-staff">Sil</button>
      </div>`).join('');
    }

    // Populate booking dropdown in "Yeni Randevu" (if element exists)
    const select = $('f-staff');
    if (select) {
        select.innerHTML = '<option value="">Farketmez (Herhangi Biri)</option>' +
            state.staff.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    }

    // Populate block staff dropdown in "Saat Yönetimi" (if element exists)
    const blockSelect = $('block-staff');
    if (blockSelect) {
        blockSelect.innerHTML = '<option value="">Tümü için kapat (Farketmez dahil)</option>' +
            state.staff.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    }

    // Populate filter staff dropdown in "Tüm Randevular"
    const filterSelect = $('filter-staff');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Tüm Personeller</option>' +
            state.staff.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    }
}



// Global Delegation for Deletes (Services & Staff)
document.addEventListener('click', async (e) => {
    // Servis silme
    const btnSvc = e.target.closest('[data-action="delete-svc"]');
    if (btnSvc) {
        e.preventDefault(); e.stopPropagation();
        const id = btnSvc.dataset.id;
        if (btnSvc.textContent === 'Sil') {
            btnSvc.textContent = 'Emin misin?';
            btnSvc.classList.add('confirming');
            setTimeout(() => {
                if (btnSvc) {
                    btnSvc.textContent = 'Sil';
                    btnSvc.classList.remove('confirming');
                }
            }, 2500);
        } else if (btnSvc.textContent === 'Emin misin?') {
            btnSvc.disabled = true; btnSvc.textContent = '...';
            const svc = state.services.find(s => s.id === id); // Find service to show message
            try {
                const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Silinemedi');
                // local update
                state.services = state.services.filter(x => x.id !== id);
                renderServicesList();
                populateServiceDropdown();
                showSvcMsg(`"${svc.name}" silindi.`, false);
            } catch (err) {
                showSvcMsg(err.message, true);
            }
        }
        return; // İşlem yapıldıysa çık
    }

    // Personel silme
    const btnStaff = e.target.closest('[data-action="delete-staff"]');
    if (btnStaff) {
        e.preventDefault(); e.stopPropagation();
        const id = btnStaff.dataset.id;
        if (btnStaff.textContent === 'Sil') {
            btnStaff.textContent = 'Emin misin?';
            btnStaff.classList.add('confirming');
            setTimeout(() => {
                if (btnStaff) {
                    btnStaff.textContent = 'Sil';
                    btnStaff.classList.remove('confirming');
                }
            }, 2500);
        } else if (btnStaff.textContent === 'Emin misin?') {
            btnStaff.disabled = true; btnStaff.textContent = '...';
            await fetch(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
            await fetchStaff();
            renderStaffList();
        }
        return;
    }

    // Personel ekleme
    const btnAddStaff = e.target.closest('#add-staff-btn');
    if (btnAddStaff) {
        e.preventDefault(); e.stopPropagation();
        const nameInput = $('staff-name');
        const name = nameInput.value.trim();
        if (!name) return showStaffMsg('Personel adı boş olamaz.', true);
        btnAddStaff.disabled = true;
        try {
            const res = await fetch(`${API_BASE}/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: state.tenantId, name })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Ekleme başarısız');

            nameInput.value = '';
            await fetchStaff();
            renderStaffList();
            showStaffMsg(`"${name}" eklendi.`, false);
        } catch (err) {
            showStaffMsg(err.message, true);
        } finally {
            btnAddStaff.disabled = false;
        }
    }
});

// ── SLOT BLOCKING ─────────────────────────────────────────────────────────────
let blockDatePicker = null;

async function loadBlockGrid(date) {
    const grid = $('block-grid');
    grid.innerHTML = '<div class="loading-state">Yükleniyor...</div>';

    const blockDateEl = $('block-date');
    if (blockDateEl && !blockDatePicker) {
        blockDatePicker = flatpickr(blockDateEl, { locale: 'tr', dateFormat: 'Y-m-d', disableMobile: true });
    }

    try {
        const staffId = $('block-staff')?.value || '';
        const urlSuffix = staffId ? `&staff_id=${staffId}` : '';
        const [bRes, aRes] = await Promise.all([
            fetch(`${API_BASE}/blocked-slots/${state.tenantId}?date=${date}${urlSuffix}`).then(r => r.json()),
            fetch(`${API_BASE}/appointments/${state.tenantId}?date=${date}`).then(r => r.json()),
        ]);

        // Blocklanmış saatler (seçili personele göre)
        const blockedSet = new Set((bRes.slots || bRes.blocked || []).map(b => b.blocked_time.slice(0, 5)));

        // Randevular (Eğer personel seçiliyse sadece o personelin randevularını göster)
        const appointmentsList = aRes.appointments || [];
        const filteredAppts = staffId
            ? appointmentsList.filter(a => a.staff_id == staffId)
            : appointmentsList;

        const apptSet = new Set(filteredAppts.map(a => a.appointment_time.slice(0, 5)));
        grid.innerHTML = '';
        for (let h = 9; h <= 20; h++) {
            for (const m of ['00', '30']) {
                const t = `${pad(h)}:${m}`;
                const blocked = blockedSet.has(t);
                const hasAppt = apptSet.has(t);
                const el = document.createElement('div');
                el.className = `block-slot${blocked ? ' blocked' : ''}${hasAppt ? ' has-appt' : ''}`;
                el.textContent = t;
                el.title = hasAppt ? 'Randevu var!' : blocked ? 'Kapalı — tıkla aç' : 'Açık — tıkla kapat';
                el.onclick = () => toggleSlot(date, t, el, hasAppt, staffId);
                grid.appendChild(el);
            }
        }
    } catch (e) {
        grid.innerHTML = `<div class="loading-state">Hata: ${e.message}</div>`;
    }
}

async function toggleSlot(date, time, el, hasAppt, staffId) {
    if (hasAppt) { alert('Bu saatte randevu var, önce iptal edin.'); return; }
    const wasBlocked = el.classList.contains('blocked');
    try {
        const res = await fetch(`${API_BASE}/blocked-slots`, {
            method: wasBlocked ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenant_id: state.tenantId, staff_id: staffId || null, blocked_date: date, blocked_time: time }),
        });
        if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
        el.classList.toggle('blocked');
        el.title = wasBlocked ? 'Açık — tıkla kapat' : 'Kapalı — tıkla aç';
    } catch (e) { alert('Hata: ' + e.message); }
}

// ── REALTIME — SSE (Server-Sent Events) ──────────────────────────────────────
// Backend /api/sse/:tenantId endpoint'i yeni randevu geldiğinde event yayar.
// SSE bağlantısı kesilirse otomatik yeniden bağlanır.
let _prevApptCount = null;
let _sseRetryTimer = null;

function initRealtime() {
    _connectSSE();
}

function _connectSSE() {
    if (!state.tenantId) return;
    const es = new EventSource(`${API_BASE}/sse/${state.tenantId}`);

    es.addEventListener('new-appointment', (e) => {
        try {
            const data = JSON.parse(e.data);
            playNotificationSound();
            showToast(`${data.customer_name} — ${data.appointment_time?.slice(0, 5)}`);
        } catch (_) { }
        if (state.activeTab === 'today') loadToday();
        else if (state.activeTab === 'all') loadAll();
    });

    es.onopen = () => {
        connStatus.textContent = 'CANLI';
        connStatus.className = 'connection-status connected';
        clearTimeout(_sseRetryTimer);
        // İlk bağlantıda sayımı başlat (polling fallback için)
        fetchAppointments({ date: today() }).then(d => { _prevApptCount = d.length; });
    };

    es.onerror = () => {
        connStatus.textContent = 'Yeniden Bağlanıyor';
        connStatus.className = 'connection-status disconnected';
        es.close();
        // 5 saniye sonra yeniden bağlan
        _sseRetryTimer = setTimeout(_connectSSE, 5000);
    };

    // Polling fallback: SSE'nin yanı sıra 10s'de bir kontrol et
    // (SSE açıkken de güvence amaçlı çalışır)
    setInterval(async () => {
        const data = await fetchAppointments({ date: today() });
        if (_prevApptCount !== null && data.length > _prevApptCount) {
            playNotificationSound();
            showToast(`${data.length - _prevApptCount} yeni randevu!`);
        }
        _prevApptCount = data.length;
        if (state.activeTab === 'today') { renderAppointments('today-appointments', data); updateStats(data); }
    }, 10_000);
}

// ── TOAST / BİLDİRİM POPUP ───────────────────────────────────────────────────
function showToast(msg, opts = {}) {
    // Mevcut toastı kaldır
    const existing = $('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:.75rem">
        <span style="font-size:1.4rem;line-height:1">🔔</span>
        <div>
          <div style="font-size:.75rem;opacity:.7;margin-bottom:.2rem;text-transform:uppercase;letter-spacing:.05em">Yeni Randevu</div>
          <div style="font-size:.88rem;font-weight:700;line-height:1.4">${msg}</div>
        </div>
        <button onclick="this.closest('#app-toast').remove()" style="margin-left:auto;background:none;border:none;color:inherit;font-size:1rem;cursor:pointer;opacity:.6;padding:0 0 0 .5rem">✕</button>
      </div>
      <div style="margin-top:.6rem;height:3px;border-radius:2px;background:var(--accent,#c9a84c);animation:toast-progress 6s linear forwards"></div>
    `;
    toast.style.cssText = [
        'position:fixed;bottom:2rem;right:2rem',
        'background:linear-gradient(135deg,#1a2640,#0f1520)',
        'border:1px solid var(--accent,#c9a84c)',
        'color:#eef2ff;font-family:Montserrat,sans-serif',
        'padding:.9rem 1.1rem;border-radius:12px',
        'box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 30px rgba(201,168,76,.2)',
        'z-index:9999;transition:opacity .4s,transform .4s',
        'opacity:0;transform:translateY(1rem) scale(.95)',
        'max-width:320px;min-width:240px',
    ].join(';');

    // Progress bar animasyon style
    if (!$('toast-keyframes')) {
        const s = document.createElement('style');
        s.id = 'toast-keyframes';
        s.textContent = `@keyframes toast-progress{from{width:100%}to{width:0}}`;
        document.head.appendChild(s);
    }

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0) scale(1)';
    });
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(1rem) scale(.95)';
        setTimeout(() => toast.remove(), 400);
    }, 6000);
}
