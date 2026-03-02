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
    appointments: [], // Tüm randevular burada tutulacak
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
    const el = $('clock');
    if (el) el.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// ── SESSION HELPER ───────────────────────────────────────────────────────────
async function handleResponse(res, skipReload = false) {
    if (res.status === 401 && !skipReload) {
        sessionStorage.removeItem('randevu_tenant');
        location.reload(); // Giriş ekranına döner
        throw new Error('Oturum süresi dolmuş.');
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'İşlem başarısız.');
    return json;
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
function toggleTheme() {
    const isLight = document.documentElement.classList.contains('theme-light');
    const next = isLight ? 'dark' : 'light';
    localStorage.setItem('randevu-theme', next);
    applyTheme(next);
}

// The delegated event listener handles the clicks.
function applyTheme(theme) {
    const icon = document.getElementById('theme-icon');
    const mobileIcon = document.getElementById('mobile-theme-icon');
    const label = document.getElementById('theme-label');
    const loginBtn = document.getElementById('login-theme-btn');
    if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
        if (icon) icon.textContent = '☀️';
        if (mobileIcon) mobileIcon.textContent = '☀️';
        if (label) label.textContent = 'Açık';
        if (loginBtn) loginBtn.textContent = '☀️';
        if (document.getElementById('fp-dark-theme')) {
            document.getElementById('fp-dark-theme').disabled = true;
        }
    } else {
        document.documentElement.classList.remove('theme-light');
        if (icon) icon.textContent = '🌙';
        if (mobileIcon) mobileIcon.textContent = '🌙';
        if (label) label.textContent = 'Koyu';
        if (loginBtn) loginBtn.textContent = '🌙';
        if (document.getElementById('fp-dark-theme')) {
            document.getElementById('fp-dark-theme').disabled = false;
        }
    }
}

// Load saved theme immediately on page load
applyTheme(localStorage.getItem('randevu-theme') || 'dark');

// Delegated click handler for the theme button (works before & after login)
document.addEventListener('click', (e) => {
    if (e.target.closest('#theme-toggle-btn') || e.target.closest('#mobile-theme-toggle')) {
        toggleTheme();
    }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
loginBtn.addEventListener('click', doLogin);
slugInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { passwordInput ? passwordInput.focus() : doLogin(); } });
if (passwordInput) passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

// Auto-login from sessionStorage
const savedTenant = sessionStorage.getItem('randevu_tenant');
if (savedTenant) {
    try {
        const tenant = JSON.parse(savedTenant);
        state.tenant = tenant;
        state.tenantId = tenant.id;
        state.tenantSlug = tenant.slug;
        state.services = tenant.services || [];
        const loader = initShaderLoader();
        fetchStaff().then(() => {
            tenantBadge.textContent = tenant.name;
            loginScreen.classList.add('hidden');
            const loginBg = document.getElementById('login-bg');
            if (loginBg) loginBg.style.display = 'none';

            setTimeout(() => {
                if (loader) loader.stop();
                app.classList.remove('hidden');
                initDashboard();
            }, 2000);
        });
    } catch (e) {
        sessionStorage.removeItem('randevu_tenant');
    }
}


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
        const { tenant } = await handleResponse(res, true);
        state.tenant = tenant;
        state.tenantId = tenant.id;
        state.tenantSlug = tenant.slug;
        state.services = tenant.services || [];
        sessionStorage.setItem('randevu_tenant', JSON.stringify(tenant));
        await fetchStaff();
        tenantBadge.textContent = tenant.name;

        // Shader Loading Screen Başlat
        const loader = initShaderLoader();

        loginScreen.classList.add('hidden');
        const loginBg = document.getElementById('login-bg');
        if (loginBg) loginBg.style.display = 'none';

        // 2.5 saniye sonra dashboard'a geç
        setTimeout(() => {
            if (loader) loader.stop();
            app.classList.remove('hidden');
            initDashboard();
        }, 2500);
    } catch (err) {
        showLoginError(err.message);
    } finally {
        loginBtn.disabled = false; loginBtn.textContent = 'Giriş Yap';
    }
}
let _loginErrorTimer = null;
function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
    clearTimeout(_loginErrorTimer);
    _loginErrorTimer = setTimeout(() => loginError.classList.add('hidden'), 3000);
}
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
    ['reset-slug', 'reset-current-pw', 'reset-new-pw', 'reset-confirm-pw'].forEach(id => {
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
['reset-slug', 'reset-current-pw', 'reset-new-pw', 'reset-confirm-pw'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') doResetPassword(); });
});

async function doResetPassword() {
    const slug = ($('reset-slug')?.value || '').trim().toLowerCase();
    const currentPassword = $('reset-current-pw')?.value || '';
    const newPassword = $('reset-new-pw')?.value || '';
    const confirmPassword = $('reset-confirm-pw')?.value || '';

    if (!slug) return setResetMsg('İşletme kodu boş olamaz.', true);
    if (!currentPassword) return setResetMsg('Mevcut şifre boş olamaz.', true);
    if (newPassword.length < 4) return setResetMsg('Yeni şifre en az 4 karakter olmalıdır.', true);
    if (newPassword !== confirmPassword) return setResetMsg('Yeni şifreler eşleşmiyor.', true);

    resetSubmitBtn.disabled = true;
    resetSubmitBtn.textContent = 'Güncelleniyor...';
    setResetMsg('', null);

    try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, currentPassword, newPassword }),
        });
        await handleResponse(res, true);
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
window.logout = async function () {
    try {
        const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
        await handleResponse(res);
    } catch (e) {
        console.error('Logout error:', e);
    } finally {
        sessionStorage.removeItem('randevu_tenant');
        location.reload();
    }
};

if (logoutBtn) logoutBtn.addEventListener('click', window.logout);

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
    settings: { nav: 'nav-settings', section: 'tab-settings', title: 'Denetim' },
};

function initTabs() {
    Object.keys(tabMap).forEach(k => $(tabMap[k].nav).addEventListener('click', () => switchTab(k)));

    // ── AnimeNavBar (Mobil) ──────────────────────────────────────────────
    const animeNavbar = document.getElementById('anime-navbar');
    if (animeNavbar) {
        animeNavbar.classList.remove('hidden');
        animeNavbar.querySelectorAll('.anime-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                if (tab) switchTab(tab);
            });
        });
    }

    // Mobilde "Canlı" badge sol alta inject et
    if (!document.getElementById('realtime-badge-mobile') && window.innerWidth <= 768) {
        const badge = document.createElement('div');
        badge.id = 'realtime-badge-mobile';
        badge.innerHTML = '<span class="pulse-dot"></span><span>Canlı</span>';
        document.body.appendChild(badge);
    }
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

    // AnimeNavBar aktif senkronizasyonu
    const animeNavbar = document.getElementById('anime-navbar');
    if (animeNavbar) {
        animeNavbar.querySelectorAll('.anime-nav-item').forEach(btn => {
            if (btn.getAttribute('data-tab') === key) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    if (key === 'all') loadAll();
    if (key === 'settings') loadToday();
}

// ── LOAD TODAY ────────────────────────────────────────────────────────────────
$('refresh-today-btn').addEventListener('click', loadToday);
let _todayAllAppts = [];
let _activeStatFilter = null;

async function loadToday() {
    const data = await fetchAppointments({ date: today() });
    _todayAllAppts = data;
    state.appointments = data; // State senkronizasyonu
    applyStatFilter(_activeStatFilter);
    updateStats(data);
    updateBentoStats(); // İstatistikleri yenile
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
    state.appointments = data; // State senkronizasyonu
    renderAppointments('all-appointments', data);
    updateBentoStats(); // İstatistikleri yenile

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
        const res = await fetch(url);
        const data = await handleResponse(res);
        return data.appointments || [];
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
    const originalPrice = a.services?.price;
    const discountedPrice = a.services?.discounted_price;

    let priceHtml = '';
    if (originalPrice != null || discountedPrice != null) {
        priceHtml += `<span style="font-size:1.1rem;display:inline-flex;align-items:center;white-space:nowrap;gap:0.4rem;">`;
        if (originalPrice != null) {
            const hasDiscount = discountedPrice != null;
            priceHtml += `<span style="${hasDiscount ? 'text-decoration:line-through;opacity:0.5;' : ''}">${Number(originalPrice).toLocaleString('tr-TR')} ₺</span>`;
        }
        if (discountedPrice != null) {
            priceHtml += `<span class="apt-price-discounted" style="font-weight:800;">${Number(discountedPrice).toLocaleString('tr-TR')} ₺</span>`;
        }
        priceHtml += `</span>`;
    }

    const durationHtml = a.services?.duration_minutes ? `<span style="font-size:1.0rem;">${a.services.duration_minutes} dk</span>` : '';
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
        ${durationHtml}
        ${priceHtml}
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

    // Fiyatı modal'da da indirimli yapısına uyduralım
    const originalPrice = a.services?.price;
    const discountedPrice = a.services?.discounted_price;
    let modalPriceHtml = '–';

    if (originalPrice != null || discountedPrice != null) {
        modalPriceHtml = `<span style="font-size:1.1rem;display:inline-flex;align-items:center;white-space:nowrap;gap:0.4rem;">`;
        if (originalPrice != null) {
            const hasDiscount = discountedPrice != null;
            modalPriceHtml += `<span style="${hasDiscount ? 'text-decoration:line-through;opacity:0.5;' : ''}">${Number(originalPrice).toLocaleString('tr-TR')} ₺</span>`;
        }
        if (discountedPrice != null) {
            modalPriceHtml += `<span class="apt-price-discounted" style="font-weight:800;">${Number(discountedPrice).toLocaleString('tr-TR')} ₺</span>`;
        }
        modalPriceHtml += `</span>`;
    }

    modalBody.innerHTML = `
    <div class="modal-row"><label>Müşteri</label><span>${esc(a.customer_name)}</span></div>
    <div class="modal-row"><label>Telefon</label><span>${esc(a.customer_phone)}</span></div>
    <div class="modal-row"><label>Hizmet</label><span>${esc(svc)}</span></div>
    <div class="modal-row"><label>Personel</label><span>${esc(staff)}</span></div>
    <div class="modal-row"><label>Tarih</label><span>${formatDate(a.appointment_date)}</span></div>
    <div class="modal-row"><label>Saat</label><span>${a.appointment_time?.slice(0, 5)}</span></div>
    <div class="modal-row" style="align-items:center;"><label>Ücret</label><span>${modalPriceHtml}</span></div>
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
        await handleResponse(res);
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
        await handleResponse(res);
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
    } else {
        // pending or confirmed
        msg = `Merhaba ${name}! 👋\n\n${service} için ${date} ${time} randevunuz ${status === 'confirmed' ? 'onaylanmıştır. ✅' : 'alınmıştır.\nEn kısa sürede size döneceğiz.'}\nBizi tercih ettiğiniz için teşekkürler.`;
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
            await handleResponse(res);
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
    if (!state.tenant) return;
    const t = state.tenant;
    const info = $('settings-info');
    if (info) {
        info.innerHTML = `
      <div class="settings-grid">
        <div class="settings-item"><label>İŞLETME ADI</label><strong>${esc(state.tenant.name)}</strong></div>
        <div class="settings-item"><label>TELEFON</label><strong>${esc(state.tenant.phone || '-')}</strong></div>
        <div class="settings-item"><label>SLUG</label><code>${esc(state.tenant.slug)}</code></div>
        <div class="settings-item"><label>E-POSTA</label><strong>${esc(state.tenant.email || '-')}</strong></div>
        <div class="settings-item full-width"><label>ADRES</label><strong>${esc(state.tenant.address || '-')}</strong></div>
      </div>
      <div class="settings-footer">
          <button id="logout-btn-card" class="btn-logout-mobile" onclick="window.logout()">Hesaptan Çıkış Yap</button>
      </div>
    `;
    }

    // Ayrıca dashboard istatistiklerini güncelle
    updateBentoStats();

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
        const discounted_price = $('svc-discount').value !== '' ? parseFloat($('svc-discount').value) : null;
        if (!name) return showSvcMsg('Hizmet adı boş olamaz.', true);
        $('add-svc-btn').disabled = true;
        try {
            const res = await fetch(`${API_BASE}/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: state.tenantId, name, duration_minutes: duration, price, discounted_price }),
            });
            const json = await handleResponse(res);
            state.services.push(json.service);
            $('svc-name').value = ''; $('svc-duration').value = ''; $('svc-price').value = ''; $('svc-discount').value = '';
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
    el.innerHTML = state.services.map(s => {
        // YENİ: Ekstraları sırala ve HTML'e dök
        const extras = s.service_extras || [];
        let extrasHtml = '';
        if (extras.length > 0) {
            extrasHtml = `<div class="extra-services-container">
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">Ek Hizmetler:</div>
                ${extras.map(ex => `
                    <div class="extra-svc-item" data-id="${ex.id}">
                        <div>
                            <strong>${esc(ex.name)}</strong>
                            ${ex.duration_minutes ? ` <span style="opacity:0.7">(${ex.duration_minutes} dk)</span>` : ''}
                            ${ex.price ? ` <span style="color:var(--accent); font-weight:600; margin-left:0.3rem">+${Number(ex.price).toLocaleString('tr-TR')} ₺</span>` : ''}
                        </div>
                        <button class="svc-del-btn" style="color:var(--red); border-color:var(--red); padding:0.15rem 0.4rem; font-size:0.65rem;" data-action="delete-extra" data-id="${ex.id}">Sil</button>
                    </div>
                `).join('')}
            </div>`;
        }

        return `
    <div class="service-row" data-svc-id="${s.id}" style="display:block; padding-bottom:0.75rem;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
              <strong>${esc(s.name)}</strong>
              <span class="svc-meta" style="display:flex;align-items:center;gap:0.3rem;white-space:nowrap;line-height:1;margin-top:0.2rem;">
                ${s.duration_minutes ? `<span>${s.duration_minutes} dk</span>` : ''}
                <span style="display:inline-flex;align-items:center;white-space:nowrap;">
                  ${s.price != null ? `<span style="${s.discounted_price ? 'text-decoration:line-through;opacity:0.6;margin-right:0.4rem;font-size:0.75rem;' : 'font-size:0.85rem;'}">${Number(s.price).toLocaleString('tr-TR')} ₺</span>` : ''}
                  ${s.discounted_price != null ? `<span style="color:var(--accent2);font-weight:900;font-size:0.95rem;">${Number(s.discounted_price).toLocaleString('tr-TR')} ₺</span>` : ''}
                </span>
              </span>
          </div>
          <div>
              <button class="svc-del-btn" style="color:var(--accent);border-color:var(--accent);margin-right:0.3rem" data-action="edit-svc" data-id="${s.id}">Düzenle</button>
              <button class="svc-del-btn" data-action="delete-svc" data-id="${s.id}">Sil</button>
          </div>
      </div>
      ${extrasHtml}
      <button class="btn-add-extra" data-action="open-extra-modal" data-parent-id="${s.id}">+ Ek Hizmet (Upsell) Ekle</button>
    </div>`
    }).join('');
}

// ── SETTINGS: STAFF ──────────────────────────────────────────────────────────
async function fetchStaff() {
    try {
        const res = await fetch(`${API_BASE}/staff/${state.tenantId}`);
        const data = await handleResponse(res);
        state.staff = data.staff || [];
    } catch (e) { state.staff = []; }
}

function renderStaffList() {
    const el = $('staff-list');
    if (!state.staff.length) {
        el.innerHTML = '<p class="form-hint">Henüz personel eklenmemiş.</p>';
    } else {
        el.innerHTML = state.staff.map(s => `
      <div class="staff-row list-row">
        <strong>${esc(s.name)}</strong>
        <button class="btn btn-danger btn-sm staff-del-btn" data-id="${s.id}" data-action="delete-staff">Sil</button>
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

// Edit Service Modal Handlers
$('edit-svc-close-btn').addEventListener('click', () => {
    $('edit-svc-overlay').classList.add('hidden');
});

// YENİ: Ek Hizmet Modal Kapatma
$('add-extra-close-btn').addEventListener('click', () => {
    $('add-extra-svc-overlay').classList.add('hidden');
});

// YENİ: Ek Hizmet Kaydetme (POST)
$('add-extra-submit-btn').addEventListener('click', async () => {
    const parentId = $('add-extra-parent-id').value;
    const name = $('extra-svc-name').value.trim();
    const durationStr = $('extra-svc-duration').value;
    const priceStr = $('extra-svc-price').value;

    if (!name) {
        $('add-extra-msg').textContent = 'Ek hizmet adı boş olamaz.';
        $('add-extra-msg').classList.remove('hidden');
        return;
    }

    const duration = durationStr ? parseInt(durationStr) : 0;
    const price = priceStr !== '' ? parseFloat(priceStr) : 0;

    $('add-extra-submit-btn').disabled = true;
    $('add-extra-msg').classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/service-extras`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenant_id: state.tenantId,
                service_id: parentId,
                name,
                duration_minutes: duration,
                price
            }),
        });
        const json = await handleResponse(res);

        // Local state'i güncelle
        const parentService = state.services.find(s => s.id === parentId);
        if (parentService) {
            if (!parentService.service_extras) parentService.service_extras = [];
            parentService.service_extras.push(json.extra);
        }

        $('add-extra-svc-overlay').classList.add('hidden');
        renderServicesList();
        showSvcMsg(`"${name}" eklendi.`, false);
    } catch (e) {
        $('add-extra-msg').textContent = e.message;
        $('add-extra-msg').classList.remove('hidden');
    } finally {
        $('add-extra-submit-btn').disabled = false;
    }
});

$('edit-svc-submit-btn').addEventListener('click', async () => {
    const id = $('edit-svc-id').value;
    const name = $('edit-svc-name').value.trim();
    const duration = parseInt($('edit-svc-duration').value) || 60;
    const price = $('edit-svc-price').value !== '' ? parseFloat($('edit-svc-price').value) : null;
    const discounted_price = $('edit-svc-discount').value !== '' ? parseFloat($('edit-svc-discount').value) : null;

    if (!name) {
        $('edit-svc-msg').textContent = 'Hizmet adı boş olamaz.';
        $('edit-svc-msg').classList.remove('hidden');
        return;
    }

    $('edit-svc-submit-btn').disabled = true;
    $('edit-svc-msg').classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/services/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, duration_minutes: duration, price, discounted_price }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Güncelleme hatası');

        const index = state.services.findIndex(s => s.id === id);
        if (index > -1) state.services[index] = json.service;

        $('edit-svc-overlay').classList.add('hidden');
        renderServicesList();
        populateServiceDropdown();
        showSvcMsg(`"${name}" güncellendi.`, false);
    } catch (e) {
        $('edit-svc-msg').textContent = e.message;
        $('edit-svc-msg').classList.remove('hidden');
    } finally {
        $('edit-svc-submit-btn').disabled = false;
    }
});


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
                await handleResponse(res);
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

    // Servis düzenleme (Modal Açma)
    const btnEditSvc = e.target.closest('[data-action="edit-svc"]');
    if (btnEditSvc) {
        e.preventDefault(); e.stopPropagation();
        const id = btnEditSvc.dataset.id;
        const svc = state.services.find(s => s.id === id);
        if (!svc) return;

        $('edit-svc-id').value = svc.id;
        $('edit-svc-name').value = svc.name || '';
        $('edit-svc-duration').value = svc.duration_minutes || 60;
        $('edit-svc-price').value = svc.price != null ? svc.price : '';
        $('edit-svc-discount').value = svc.discounted_price != null ? svc.discounted_price : '';
        $('edit-svc-msg').classList.add('hidden');

        $('edit-svc-overlay').classList.remove('hidden');
        return;
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
            try {
                const res = await fetch(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
                await handleResponse(res);
                await fetchStaff();
                renderStaffList();
            } catch (err) {
                showStaffMsg(err.message, true);
            } finally {
                if (btnStaff) { btnStaff.disabled = false; btnStaff.textContent = 'Sil'; }
            }
        }
        return;
    }

    // YENİ: Ek Hizmet Ekle Modalını Aç
    const btnOpenExtra = e.target.closest('[data-action="open-extra-modal"]');
    if (btnOpenExtra) {
        e.preventDefault(); e.stopPropagation();
        const parentId = btnOpenExtra.dataset.parentId;
        const parentService = state.services.find(s => s.id === parentId);

        $('add-extra-parent-id').value = parentId;
        $('extra-svc-name').value = '';
        $('extra-svc-duration').value = '';
        $('extra-svc-price').value = '';
        $('add-extra-msg').classList.add('hidden');
        $('add-extra-subtitle').textContent = `"${parentService.name}" hizmetine özel ekstra.`;

        $('add-extra-svc-overlay').classList.remove('hidden');
        return;
    }

    // YENİ: Ek Hizmet Silme
    const btnDelExtra = e.target.closest('[data-action="delete-extra"]');
    if (btnDelExtra) {
        e.preventDefault(); e.stopPropagation();
        const extraId = btnDelExtra.dataset.id;
        if (btnDelExtra.textContent === 'Sil') {
            btnDelExtra.textContent = '?';
            setTimeout(() => { if (btnDelExtra) btnDelExtra.textContent = 'Sil'; }, 2000);
        } else {
            try {
                btnDelExtra.textContent = '...';
                const res = await fetch(`${API_BASE}/service-extras/${extraId}`, { method: 'DELETE' });
                await handleResponse(res);
                // Local state'i güncelle (İlgili servisin altından çıkar)
                state.services.forEach(s => {
                    if (s.service_extras) {
                        s.service_extras = s.service_extras.filter(ex => ex.id !== extraId);
                    }
                });
                renderServicesList();
                showSvcMsg('Ek hizmet silindi.', false);
            } catch (err) {
                showSvcMsg(err.message, true);
            }
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
        const [bData, aData] = await Promise.all([
            fetch(`${API_BASE}/blocked-slots/${state.tenantId}?date=${date}${urlSuffix}`).then(handleResponse),
            fetch(`${API_BASE}/appointments/${state.tenantId}?date=${date}`).then(handleResponse),
        ]);

        // Blocklanmış saatler (seçili personele göre)
        const blockedSet = new Set((bData.slots || bData.blocked || []).map(b => b.blocked_time.slice(0, 5)));

        // Randevular (Eğer personel seçiliyse sadece o personelin randevularını göster)
        const appointmentsList = aData.appointments || [];
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
                const appt = hasAppt ? filteredAppts.find(a => a.appointment_time.slice(0, 5) === t) : null;
                const el = document.createElement('div');
                el.className = `block-slot${blocked ? ' blocked' : ''}${hasAppt ? ' has-appt' : ''}`;
                el.textContent = t;
                el.title = hasAppt ? (appt ? `${appt.customer_name} - ${appt.services?.name || 'Randevu'}` : 'Randevu var!') : blocked ? 'Kapalı — tıkla aç' : 'Açık — tıkla kapat';
                el.onclick = () => toggleSlot(date, t, el, hasAppt, staffId, appt);
                grid.appendChild(el);
            }
        }
    } catch (e) {
        grid.innerHTML = `<div class="loading-state">Hata: ${e.message}</div>`;
    }
}

async function toggleSlot(date, time, el, hasAppt, staffId, appt) {
    if (hasAppt) {
        if (appt) {
            openModal(appt);
        } else {
            alert('Bu saatte randevu var, detaylara anasayfadan bakabilirsiniz.');
        }
        return;
    }
    const wasBlocked = el.classList.contains('blocked');
    try {
        const res = await fetch(`${API_BASE}/blocked-slots`, {
            method: wasBlocked ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenant_id: state.tenantId, staff_id: staffId || null, blocked_date: date, blocked_time: time }),
        });
        await handleResponse(res);
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

            if (state.activeTab === 'today') loadToday();
            else if (state.activeTab === 'all') loadAll();
            else if (state.activeTab === 'settings') loadToday(); // Stats ve State güncelleme

            // Eğer Saat Yönetimi altındaysa ve aynı gün seçiliyse gridi yenile
            if (state.activeTab === 'settings') {
                const bDateStr = document.getElementById('block-date')?.value;
                if (data.appointment_date === bDateStr) {
                    loadBlockGrid(bDateStr);
                }
            }
        } catch (_) { }
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
        state.appointments = data; // State senkronizasyonu
        if (_prevApptCount !== null && data.length > _prevApptCount) {
            playNotificationSound();
            showToast(`${data.length - _prevApptCount} yeni randevu!`);
        }
        _prevApptCount = data.length;
        if (state.activeTab === 'today') { renderAppointments('today-appointments', data); updateStats(data); }
        updateBentoStats(); // İstatistikleri her zaman yenile
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

/**
 * Dashboard (Bento Grid) istatistiklerini hesaplar ve günceller
 */
async function updateBentoStats() {
    if (!state.tenantId) return;

    try {
        // İstatistikler için her zaman tüm randevuları çek (genel toplam ve iptal oranı için)
        const allApps = await fetchAppointments();
        const todayStr = today(); // Helper function already exists or use current date

        // 1. TOPLAM KAZANÇ (Tüm zamanların onaylı randevuları)
        const todayApps = allApps.filter(a => a.appointment_date === todayStr);
        let revenue = 0;
        allApps.forEach(a => {
            if (a.status === 'confirmed') {
                const s = a.services || {};
                revenue += (s.discounted_price != null ? Number(s.discounted_price) : Number(s.price || 0));
            }
        });
        const revEl = document.querySelector('#bento-revenue .bento-value');
        if (revEl) revEl.textContent = `₺${revenue.toLocaleString('tr-TR')}`;

        // 2. BUGÜNÜN YOĞUNLUĞU
        const loadEl = document.querySelector('#bento-load .bento-value');
        if (loadEl) {
            // Ortalama 12 slot üzerinden doluluk oranı
            const activeToday = todayApps.filter(a => a.status !== 'cancelled').length;
            const loadPercent = Math.min(Math.round((activeToday / 12) * 100), 100);
            loadEl.textContent = `%${loadPercent}`;
        }

        // 3. YENİ MÜŞTERİLER
        const newCustEl = document.querySelector('#bento-new-customers .bento-value');
        if (newCustEl) {
            const uniquePhones = new Set(todayApps.map(a => a.customer_phone));
            newCustEl.textContent = uniquePhones.size;
        }

        // 4. İPTAL ORANI
        const cancelEl = document.querySelector('#bento-cancellation .bento-value');
        if (cancelEl && allApps.length > 0) {
            const cancelledCount = allApps.filter(a => a.status === 'cancelled').length;
            const rate = Math.round((cancelledCount / allApps.length) * 100);
            cancelEl.textContent = `%${rate}`;
        }

    } catch (e) {
        console.error('Bento stats update error:', e);
    }
}

// ── WAVY BACKGROUND (LOGIN SCREEN) ────────────────────────────────────────────
function initWavyBackground() {
    const canvas = document.getElementById('wavy-canvas');
    if (!canvas) {
        console.warn("Wavy canvas element not found");
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!window.SimplexNoise) {
        console.warn("SimplexNoise library not loaded!");
        return;
    }
    const noise = new SimplexNoise(); // Assumes simplex-noise CDN is loaded
    let w, h, nt = 0, i, x;
    const blur = 10;
    const speed = 0.002;
    const waveOpacity = 0.5;
    const waveWidth = 50;
    const backgroundFill = "#0a0c14"; // Match --bg-deep exactly
    const waveColors = ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"];

    function resize() {
        w = ctx.canvas.width = window.innerWidth;
        h = ctx.canvas.height = window.innerHeight;
        ctx.filter = `blur(${blur}px)`;
    }

    function drawWave(n) {
        nt += speed;
        for (i = 0; i < n; i++) {
            ctx.beginPath();
            ctx.lineWidth = waveWidth;
            ctx.strokeStyle = waveColors[i % waveColors.length];
            for (x = 0; x < w; x += 5) {
                var y = noise.noise3D(x / 800, 0.3 * i, nt) * 100;
                ctx.lineTo(x, y + h * 0.5); // align to center
            }
            ctx.stroke();
            ctx.closePath();
        }
    }

    let animationId;
    function render() {
        ctx.fillStyle = backgroundFill;
        ctx.globalAlpha = waveOpacity;
        ctx.fillRect(0, 0, w, h);
        drawWave(5);
        animationId = requestAnimationFrame(render);
    }

    window.addEventListener('resize', resize);
    resize();
    render();

    // Store animation ID globally if needed to stop it later
    window.wavyAnimationId = animationId;
}

// Call init on load if not already logged in
function maybeInitWaves() {
    if (!sessionStorage.getItem('randevu_tenant')) {
        initWavyBackground();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeInitWaves);
} else {
    maybeInitWaves();
}
// ── SHADER LOADING SCREEN ───────────────────────────────────────────────────
function initShaderLoader() {
    const container = document.getElementById('shader-container');
    const loader = document.getElementById('shader-loader');
    if (!container || !loader || !window.THREE) return null;

    loader.classList.remove('hidden');

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
        
      float random (in float x) {
          return fract(sin(x)*1e4);
      }
      float random (vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
      }

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        vec2 fMosaicScal = vec2(4.0, 2.0);
        vec2 vScreenSize = vec2(256,256);
        uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
        uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);       
          
        float t = time*0.06+random(uv.x)*0.4;
        float lineWidth = 0.0008;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*1.0 - length(uv));        
          }
        }
        gl_FragColor = vec4(color[2],color[1],color[0],1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2() },
    };
    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const onResize = () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        uniforms.resolution.value.x = renderer.domElement.width;
        uniforms.resolution.value.y = renderer.domElement.height;
    };
    window.addEventListener('resize', onResize);
    onResize();

    let animId;
    const animate = () => {
        animId = requestAnimationFrame(animate);
        uniforms.time.value += 0.05;
        renderer.render(scene, camera);
    };
    animate();

    return {
        stop: () => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.classList.add('hidden');
                loader.classList.remove('fade-out');
                cancelAnimationFrame(animId);
                window.removeEventListener('resize', onResize);
                renderer.dispose();
                geometry.dispose();
                material.dispose();
                if (container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement);
                }
            }, 800);
        }
    };
}
