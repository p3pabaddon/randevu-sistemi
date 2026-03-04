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
    notifications: [], // { id, title, message, time, read }
    pagination: {
        todayAppts: { currentPage: 1, itemsPerPage: 10 },
        allAppts: { currentPage: 1, itemsPerPage: 10 },
        crm: { currentPage: 1, itemsPerPage: 10 }
    }
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

// ── PAGINATION HELPER (shadcn ported to Vanilla JS) ──────────────────────────
function renderPagination(totalItems, itemsPerPage, currentPage, targetElementId, onChangeCallbackName) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById(targetElementId);

    if (!container) return;

    // As per user request, only show pagination if there are items
    if (totalItems === 0 || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
    <nav role="navigation" aria-label="pagination" class="pagination">
        <ul class="pagination-content">
            <li>
                <a aria-label="Go to previous page" 
                   class="pagination-link pagination-previous ${currentPage === 1 ? 'disabled' : ''}" 
                   onclick="${currentPage > 1 ? `${onChangeCallbackName}(${currentPage - 1})` : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                    <span class="hidden sm:block">Önceki</span>
                </a>
            </li>`;

    // Calculate window of pages to show
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);

    if (currentPage === 1) {
        endPage = Math.min(totalPages, 3);
    } else if (currentPage === totalPages) {
        startPage = Math.max(1, totalPages - 2);
    }

    if (startPage > 1) {
        html += `
            <li>
                <a class="pagination-link" onclick="${onChangeCallbackName}(1)">1</a>
            </li>`;
        if (startPage > 2) {
            html += `
            <li>
                <span aria-hidden="true" class="pagination-ellipsis">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-horizontal size-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </span>
            </li>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        html += `
            <li>
                <a aria-current="${isActive ? 'page' : 'false'}" 
                   class="pagination-link ${isActive ? 'active' : ''}" 
                   onclick="${!isActive ? `${onChangeCallbackName}(${i})` : ''}">${i}</a>
            </li>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `
            <li>
                <span aria-hidden="true" class="pagination-ellipsis">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-horizontal size-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </span>
            </li>`;
        }
        html += `
            <li>
                <a class="pagination-link" onclick="${onChangeCallbackName}(${totalPages})">${totalPages}</a>
            </li>`;
    }

    html += `
            <li>
                <a aria-label="Go to next page" 
                   class="pagination-link pagination-next ${currentPage === totalPages ? 'disabled' : ''}" 
                   onclick="${currentPage < totalPages ? `${onChangeCallbackName}(${currentPage + 1})` : ''}">
                    <span class="hidden sm:block">Sonraki</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                </a>
            </li>
        </ul>
    </nav>`;

    container.innerHTML = html;
}


// ── BENTO CALENDAR CLASS ──────────────────────────────────────────────────────
class BentoCalendar {
    constructor(containerId, options = {}) {
        this.containerId = containerId; // e.g., 'cal-filter'
        this.options = {
            onSelect: () => { },
            minDate: null,
            defaultDate: new Date(),
            ...options
        };
        this.currentViewDate = new Date(this.options.defaultDate);
        this.selectedDate = this.options.defaultDate ? localDateStr(this.options.defaultDate) : null;

        this.container = $(`${containerId}-container`);
        this.grid = $(`${containerId}-grid`);
        this.label = $(`${containerId}-month-year`);

        this.init();
    }

    init() {
        if (!this.container) return;
        this.container.querySelectorAll('.calendar-nav-btn').forEach(btn => {
            btn.onclick = () => {
                const action = btn.getAttribute('data-action');
                this.changeMonth(action === 'next' ? 1 : -1);
            };
        });
        this.render();
    }

    render() {
        if (!this.grid || !this.label) return;

        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();

        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        this.label.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dayNames = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CTS", "PAZ"];
        const firstDayShifted = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

        let html = dayNames.map(d => `<div class="calendar-day-name">${d}</div>`).join('');

        for (let i = 0; i < firstDayShifted; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);
        const minDateObj = this.options.minDate ? new Date(this.options.minDate) : null;
        if (minDateObj) minDateObj.setHours(0, 0, 0, 0);

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${pad(month + 1)}-${pad(i)}`;
            const loopDate = new Date(year, month, i);
            const isPast = loopDate < (minDateObj || todayObj);
            const isSelected = this.selectedDate === dateStr;

            html += `
                <div class="calendar-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
                     data-date="${dateStr}">
                    ${i}
                </div>`;
        }

        this.grid.innerHTML = html;
        this.grid.querySelectorAll('.calendar-day:not(.disabled):not(.empty)').forEach(day => {
            day.onclick = () => this.selectDate(day.getAttribute('data-date'));
        });
    }

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.render();
        const hiddenInput = this.container ? this.container.querySelector('input[type="hidden"]') : null;
        if (hiddenInput) {
            hiddenInput.value = dateStr;
            hiddenInput.dispatchEvent(new Event('change'));
        }
        this.options.onSelect(dateStr);
    }

    changeMonth(delta) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta);
        this.render();
    }

    setDate(dateStr) {
        this.selectedDate = dateStr;
        this.currentViewDate = new Date(dateStr);
        this.render();
    }
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
['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev => {
    document.addEventListener(ev, _unlockAudio, { once: false });
});

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

        loginScreen.classList.add('hidden');
        const loginBg = document.getElementById('login-bg');
        if (loginBg) loginBg.style.display = 'none';

        // Global Hello Preloader Başlat
        initPreloader(() => {
            app.classList.remove('hidden');
            initDashboard();
        });
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
    initNotifications();
    initVerticalDock();
}

function initVerticalDock() {
    const dock = document.getElementById('main-dock');
    if (!dock) return;

    const items = dock.querySelectorAll('.dock-item');

    // Clicks for tab switching
    items.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const tabMap = {
    today: { nav: 'nav-today', section: 'tab-today', title: 'Bugünün Randevuları' },
    all: { nav: 'nav-all', section: 'tab-all', title: 'Tüm Randevular' },
    new: { nav: 'nav-new', section: 'tab-new', title: 'Yeni Randevu' },
    settings: { nav: 'nav-settings', section: 'tab-settings', title: 'Denetim' },
    crm: { nav: 'nav-crm', section: 'tab-crm', title: 'Müşteri Yönetimi' },
    services: { nav: 'nav-services', section: 'tab-services', title: 'Hizmetler' },
    reports: { nav: 'nav-reports', section: 'tab-reports', title: 'Personel Performansı' },
    campaigns: { nav: 'nav-campaigns', section: 'tab-campaigns', title: 'Silinen Randevular (Son 24 Saat)' },
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

    if (key === 'today') loadToday();
    if (key === 'all') loadAll();
    if (key === 'settings') loadToday();
    if (key === 'crm') loadCRM();
    if (key === 'services') loadServices();
    if (key === 'reports') loadReports('all');
    if (key === 'campaigns') loadDeletedAppointments();
}

// ── LOAD SERVICES ─────────────────────────────────────────────────────────────
async function fetchServices() {
    try {
        const res = await fetch(`${API_BASE}/services/${state.tenantId}`, { credentials: 'include' });
        const json = await handleResponse(res, true);
        state.services = json.services || [];
        populateServiceDropdown();
        renderServicesList();
    } catch (e) {
        console.error('Fetch services error:', e);
    }
}

$('services-refresh-btn').addEventListener('click', fetchServices);
async function loadServices() {
    await fetchServices();

    const btn = $('add-svc-btn');
    if (btn && !btn.dataset.initialized) {
        btn.dataset.initialized = 'true';
        btn.onclick = async () => {
            const name = $('new-svc-name').value.trim();
            const duration = parseInt($('new-svc-dur').value) || 60;
            const price = $('new-svc-price').value !== '' ? parseFloat($('new-svc-price').value) : null;
            const description = $('new-svc-desc').value.trim();
            const body_area = $('new-svc-bodyarea').value.trim();

            if (!name) return showSvcMsg('Hizmet adı boş olamaz.', true);
            $('add-svc-btn').disabled = true;
            try {
                const res = await fetch(`${API_BASE}/services`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenant_id: state.tenantId,
                        name,
                        duration_minutes: duration,
                        price,
                        description,
                        body_area
                    }),
                });
                const json = await handleResponse(res);
                state.services.push(json.service);
                $('new-svc-name').value = ''; $('new-svc-dur').value = ''; $('new-svc-price').value = '';
                $('new-svc-desc').value = ''; $('new-svc-bodyarea').value = '';
                renderServicesList();
                populateServiceDropdown();
                showSvcMsg(`"${name}" eklendi.`, false);
            } catch (e) { showSvcMsg(e.message, true); }
            finally { $('add-svc-btn').disabled = false; }
        };
    }
}

// ── PAGINATION HANDLERS ───────────────────────────────────────────────────────
window.changeTodayPage = (page) => {
    state.pagination.todayAppts.currentPage = page;
    applyStatFilter(_activeStatFilter); // Re-renders current filter with new page
};

window.changeAllApptsPage = (page) => {
    state.pagination.allAppts.currentPage = page;
    renderAppointments('all-appointments', state.appointments, 'allAppts');
};

window.changeCrmPage = (page) => {
    state.pagination.crm.currentPage = page;
    // We need to re-render the crm list from global state or re-fetch.
    // Assuming we have full list in memory, we can slice it in renderCRM.
    // If we only fetched what we needed, we'd need to re-call loadCRM.
    // Wait, loadCRM doesn't store in global state right now.
    // I will handle CRM specifically in `renderCRM`.
    if (window._currentCrmData) {
        renderCRM(window._currentCrmData);
    }
};

// ── LOAD TODAY ────────────────────────────────────────────────────────────────
$('refresh-today-btn').addEventListener('click', () => {
    state.pagination.todayAppts.currentPage = 1; // Reset to page 1 on refresh
    loadToday();
});
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
    renderAppointments('today-appointments', filtered, 'todayAppts');
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('stat-active'));
    const map = { null: 'stat-total', confirmed: 'stat-confirmed', pending: 'stat-pending', cancelled: 'stat-cancelled' };
    const targetId = map[status] || 'stat-total';
    const el = document.getElementById(targetId);
    if (el) el.closest('.stat-card')?.classList.add('stat-active');
}

// ── LOAD ALL ──────────────────────────────────────────────────────────────────
async function loadAll() {
    state.pagination.allAppts.currentPage = 1; // Reset to page 1 on search
    $('all-appointments').innerHTML = '<div class="loading-state">Yükleniyor...</div>';
    const dateVal = $('filter-date').value || null;
    const data = await fetchAppointments({
        date: dateVal,
        status: $('filter-status').value || null,
        staff: $('filter-staff') ? $('filter-staff').value : null,
    });
    state.appointments = data; // State senkronizasyonu
    renderAppointments('all-appointments', data, 'allAppts');
    updateBentoStats(); // İstatistikleri yenile

    // Bento Calendar Initialization
    if (!window.filterCalendar) {
        window.filterCalendar = new BentoCalendar('cal-filter', {
            onSelect: () => loadAll()
        });
    }
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
function initFilters() {
    $('apply-filter-btn').addEventListener('click', loadAll);
    $('clear-filter-btn').addEventListener('click', () => {
        $('filter-date').value = ''; $('filter-status').value = '';
        if ($('filter-staff')) $('filter-staff').value = '';
        if (window.filterCalendar) {
            window.filterCalendar.clearSelection();
        }
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
                if (state.activeTab === 'today') {
                    state.pagination.todayAppts.currentPage = 1; // Reset page when filter changes
                    applyStatFilter(status);
                }
            });
        }
    }
}

// ── RENDER APPOINTMENTS ───────────────────────────────────────────────────────
function renderAppointments(containerId, list, paginationKey = null) {
    const el = $(containerId);

    // As per user requirement, also grab pagination container (sibling or specific ID based on containerId)
    // We will append a pagination container dynamically after the list if needed.
    // Or we will expect a div next to it. Let's create it dynamically inside the parent or inside el.

    // Clear list
    el.innerHTML = '';

    if (!list.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">&#9633;</div><p>Randevu bulunamadı.</p></div>`;
        return;
    }

    // Sıralama Mantığı:
    // 1. Süresi geçenler (past && status !== 'cancelled') en alta.
    // 2. Diğerleri (Gelecek veya bugün henüz geçmemiş olanlar) en üstte ve en yakından uzağa.
    const sortedList = [...list].sort((a, b) => {
        const aIsPast = isPast(a.appointment_date, a.appointment_time) && a.status !== 'cancelled';
        const bIsPast = isPast(b.appointment_date, b.appointment_time) && b.status !== 'cancelled';

        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;

        // Her iki grup için de tarih/saat sırası (En yakın en üstte)
        const aDate = new Date(`${a.appointment_date}T${a.appointment_time?.slice(0, 5) || '00:00'}`);
        const bDate = new Date(`${b.appointment_date}T${b.appointment_time?.slice(0, 5) || '00:00'}`);
        return aDate - bDate;
    });

    // Pagination Logic
    let displayList = sortedList;
    if (paginationKey && state.pagination[paginationKey]) {
        const paginationOpts = state.pagination[paginationKey];
        const { currentPage, itemsPerPage } = paginationOpts;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        displayList = sortedList.slice(startIndex, endIndex);
    }

    el.innerHTML = displayList.map(buildCard).join('');

    el.querySelectorAll('.appointment-card').forEach(card => {
        card.addEventListener('click', () => openModal(JSON.parse(card.dataset.appointment)));
    });

    // Create / Update pagination wrapper right after the container
    if (paginationKey) {
        let paginationContainerId = `pagination-wrapper-${containerId}`;
        let paginationWrapper = document.getElementById(paginationContainerId);

        if (!paginationWrapper) {
            paginationWrapper = document.createElement('div');
            paginationWrapper.id = paginationContainerId;
            el.parentNode.insertBefore(paginationWrapper, el.nextSibling);
        }

        const funcMap = { 'todayAppts': 'changeTodayPage', 'allAppts': 'changeAllApptsPage', 'crm': 'changeCrmPage' };

        renderPagination(
            sortedList.length,
            state.pagination[paginationKey].itemsPerPage,
            state.pagination[paginationKey].currentPage,
            paginationContainerId,
            funcMap[paginationKey]
        );
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

function buildCard(a) {
    const past = isPast(a.appointment_date, a.appointment_time);
    const expired = past && a.status !== 'cancelled';
    const svcName = a.services?.name || '–';
    const staffName = a.staff?.name || 'Farketmez';
    const originalPrice = a.services?.price;
    const discountedPrice = a.services?.discounted_price;

    // Toplam Fiyat Hesaplama (Ana Hizmet + Ekstralar)
    let totalPrice = 0;
    if (discountedPrice != null) totalPrice = Number(discountedPrice);
    else if (originalPrice != null) totalPrice = Number(originalPrice);

    if (a.appointment_extras && a.appointment_extras.length > 0) {
        a.appointment_extras.forEach(ex => {
            totalPrice += Number(ex.price_at_booking || 0);
        });
    }

    // Mirror QR Dinamik İndirim Kontrolü
    let appliedMirrorDiscount = 0;
    if (a.notes && a.notes.includes('[MIRROR-QR-')) {
        const match = a.notes.match(/\[MIRROR-QR-(\d+)\]/);
        if (match) {
            appliedMirrorDiscount = parseInt(match[1], 10) / 100;
            a.notes = a.notes.replace(/\[MIRROR-QR-\d+\]\s*/g, '').trim();
        }
    }

    let priceHtml = '';
    if (originalPrice != null || (a.appointment_extras && a.appointment_extras.length > 0)) {
        priceHtml += `<span style="font-size:1.1rem;display:inline-flex;align-items:center;white-space:nowrap;gap:0.4rem;">`;

        if (appliedMirrorDiscount > 0) {
            const oldTotal = totalPrice;
            totalPrice = oldTotal * (1 - appliedMirrorDiscount);
            priceHtml += `<span style="text-decoration:line-through;opacity:0.5; font-size:0.9rem;">${Number(oldTotal).toLocaleString('tr-TR')} ₺</span>`;
        } else if (discountedPrice != null && originalPrice != null) {
            priceHtml += `<span style="text-decoration:line-through;opacity:0.5; font-size:0.9rem;">${Number(originalPrice).toLocaleString('tr-TR')} ₺</span>`;
        }

        // Toplam Fiyat
        priceHtml += `<span class="apt-price-discounted" style="font-weight:800;">${totalPrice.toLocaleString('tr-TR')} ₺</span>`;
        priceHtml += `</span>`;
    }

    const hasExtras = a.appointment_extras && a.appointment_extras.length > 0;
    const extrasIndicator = hasExtras ? `<span class="tenant-badge" style="font-size:0.65rem; padding: 0.1rem 0.4rem; margin-left:0.4rem; background:rgba(34,197,94,0.1); border-color:var(--green); color:var(--green);">+${a.appointment_extras.length} EK</span>` : '';

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
        ${svcName !== '–' ? `<span class="card-service-tag">${esc(svcName)}${extrasIndicator}</span>` : ''}
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
              title="Randevuyu Kalıcı Sil">🗑</button>
      ${a.status === 'pending' || a.status === 'confirmed' ? `
      <button class="btn btn-outline btn-sm cancel-quick-btn"
              style="color:var(--red); border-color:rgba(239,68,68,0.3); background:transparent;"
              onclick="event.stopPropagation(); quickCancel('${a.id}')"
              title="Randevuyu İptal Et">İPTAL</button>` : ''}
    </div>
    ${expiredBadge}
  </div>`;
}

function statusLabel(s) {
    if (!s) return 'Bekleyen';
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
    // Durum alanını normalize et — SSE'den gelen veride null/undefined olabilir
    if (!a.status) a = { ...a, status: 'pending' };
    modalTitle.textContent = `Randevu — ${a.customer_name}`;
    const svc = a.services?.name || '–';
    const staff = a.staff?.name || 'Farketmez (Herhangi Biri)';

    const originalPrice = a.services?.price;
    const discountedPrice = a.services?.discounted_price;

    // Toplam Fiyat (Modal)
    let totalModalPrice = 0;
    if (discountedPrice != null) totalModalPrice = Number(discountedPrice);
    else if (originalPrice != null) totalModalPrice = Number(originalPrice);

    let extrasListHtml = '';
    if (a.appointment_extras && a.appointment_extras.length > 0) {
        extrasListHtml = `<div style="margin-top:0.6rem; padding-left:0.8rem; border-left:3px solid var(--accent); opacity:0.9; width:100%; display:flex; flex-direction:column; gap:0.4rem;">`;
        a.appointment_extras.forEach(ex => {
            const exPrice = Number(ex.price_at_booking || 0);
            totalModalPrice += exPrice;
            extrasListHtml += `<div style="font-size:0.82rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
                <span>• ${esc(ex.service_extras?.name || 'Bilinmeyen Ek Hizmet')}</span>
                <span style="white-space:nowrap; font-weight:600; color:var(--text-primary);">+${exPrice.toLocaleString('tr-TR')} ₺</span>
            </div>`;
        });
        extrasListHtml += `</div>`;
    }

    // Mirror QR Dinamik İndirim Kontrolü (Modal)
    let appliedMirrorDiscount = 0;
    if (a.notes && a.notes.includes('[MIRROR-QR-')) {
        const match = a.notes.match(/\[MIRROR-QR-(\d+)\]/);
        if (match) {
            appliedMirrorDiscount = parseInt(match[1], 10) / 100;
            a.notes = a.notes.replace(/\[MIRROR-QR-\d+\]\s*/g, '').trim();
        }
    }

    let modalPriceHtml = '';
    if (appliedMirrorDiscount > 0) {
        const oldTotal = totalModalPrice;
        totalModalPrice = oldTotal * (1 - appliedMirrorDiscount);
        modalPriceHtml = `<span style="text-decoration:line-through; opacity:0.5; font-size:0.9rem; margin-right:0.5rem; white-space:nowrap;">${Number(oldTotal).toLocaleString('tr-TR')} ₺</span> <span style="white-space:nowrap;">${totalModalPrice.toLocaleString('tr-TR')} ₺</span>`;
    } else {
        modalPriceHtml = `<span style="white-space:nowrap;">${totalModalPrice.toLocaleString('tr-TR')} ₺</span>`;
        if (discountedPrice != null && originalPrice != null) {
            modalPriceHtml = `<span style="text-decoration:line-through; opacity:0.5; font-size:0.9rem; margin-right:0.5rem; white-space:nowrap;">${Number(originalPrice).toLocaleString('tr-TR')} ₺</span> ` + modalPriceHtml;
        }
    }

    modalBody.innerHTML = `
    <div class="modal-field"><label>Müşteri</label><span>${esc(a.customer_name)}</span></div>
    <div class="modal-field"><label>Telefon</label><span>${esc(a.customer_phone)}</span></div>
    <div class="modal-field" style="grid-column: 1 / -1; display:flex; flex-direction:column; gap:0.2rem; margin-bottom:0.2rem;">
        <label>Hizmet ve Ekstralar</label>
        <div style="width:100%; display:flex; justify-content:space-between; font-weight:700; font-size:1.05rem;">
            <span>${esc(svc)}</span>
        </div>
        ${extrasListHtml}
    </div>
    <div class="modal-field"><label>Personel</label><span>${esc(staff)}</span></div>
    <div class="modal-field"><label>Tarih</label><span>${formatDate(a.appointment_date)}</span></div>
    <div class="modal-field"><label>Saat</label><span>${a.appointment_time?.slice(0, 5)}</span></div>
    <div class="modal-field"><label>Ücret</label><div style="font-weight:800; color:var(--accent); font-size:1.15rem; display:flex; flex-wrap:wrap; align-items:center; gap:0.3rem;">${modalPriceHtml}</div></div>
    <div class="modal-field"><label>Durum</label><div><span class="status-badge ${a.status}">${statusLabel(a.status)}</span></div></div>
    ${a.notes ? `<div class="modal-field" style="grid-column: 1 / -1;"><label>Not</label><span>${esc(a.notes)}</span></div>` : ''}
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
async function deleteAppointment(id, fromModal = false, force = false) {
    if (!force) { showConfirm('Bu randevuyu kalıcı olarak silmek istiyor musunuz?', () => deleteAppointment(id, fromModal, true)); return; }
    try {
        const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
        await handleResponse(res);
        if (fromModal) closeModal();

        // UI listesinden hemen kaldır (Hızlı hissettirmesi için)
        const card = document.querySelector(`.appointment-card[data-id="${id}"]`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => card.remove(), 300);
        }

        if (state.activeTab === 'today') loadToday();
        else loadAll();
    } catch (e) { alert('Silme hatası: ' + e.message); }
}
window.deleteAppointment = deleteAppointment;

// Kart üzerindeki silme butonu için (inline onclick'ten çağrılır)
async function deleteAppointmentCard(id, btn) {
    if (btn.dataset.confirm !== 'yes') {
        btn.dataset.confirm = 'yes';
        btn.textContent = '❗'; // Daha belirgin bir işaret
        btn.title = 'Silmek için tekrar tıkla';
        btn.style.background = '#e74c3c';
        btn.style.borderColor = '#c0392b';
        setTimeout(() => {
            btn.dataset.confirm = '';
            btn.textContent = '🗑';
            btn.title = 'Randevuyu Sil';
            btn.style.background = '';
            btn.style.borderColor = '';
        }, 3000);
        return;
    }
    // İkinci tıklamada direkt sil (Zaten ❗ ile confirm alındı)
    btn.disabled = true;
    btn.textContent = '...';
    await deleteAppointment(id, false, true);
}
window.deleteAppointmentCard = deleteAppointmentCard;

async function quickCancel(id) {
    showConfirm('Bu randevuyu iptal etmek istediğinize emin misiniz?', async () => {
        try {
            const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            });
            await handleResponse(res);
            if (state.activeTab === 'today') loadToday();
            else loadAll();
        } catch (e) { alert('İptal hatası: ' + e.message); }
    });
}
window.quickCancel = quickCancel;

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

function setMinDate() {
    if (!window.newApptCalendar) {
        window.newApptCalendar = new BentoCalendar('cal-new', {
            minDate: today(),
            defaultDate: new Date(),
            onSelect: () => { /* updates hidden f-date automatically */ }
        });
        // Initial value
        $('f-date').value = today();
    } else {
        window.newApptCalendar.setDate(today());
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
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10 || !cleanPhone.startsWith('5')) {
            return showFormMsg('Lütfen geçerli bir telefon numarası giriniz (5xx xxx xxxx).', true);
        }

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

    // Dashboard Yeni Randevu Telefon Formatlayıcı (5xx xxx xxxx)
    const phoneInput = $('f-phone');
    if (phoneInput) {
        phoneInput.setAttribute('maxlength', '15');
        phoneInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 10) val = val.slice(0, 10);

            let formatted = '';
            if (val.length > 0) formatted += val.substring(0, 3);
            if (val.length > 3) formatted += ' ' + val.substring(3, 6);
            if (val.length > 6) formatted += ' ' + val.substring(6, 8);
            if (val.length > 8) formatted += ' ' + val.substring(8, 10);

            e.target.value = formatted;
        });
    }
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
    initMirrorQR();
}

function initMirrorQR() {
    const qrContainer = $('qr-code');
    if (!qrContainer) return;

    const t = state.tenant;
    const bizNameEl = $('qr-biz-name');
    if (bizNameEl) bizNameEl.textContent = t.name;

    const inputs = ['qr-discount-input', 'qr-header-input', 'qr-footer-input'];

    function updateQR() {
        const discount = $('qr-discount-input').value || '10';
        const header = $('qr-header-input').value || 'HIZLI RANDEVU & İNDİRİM';
        const footer = $('qr-footer-input').value || 'Kodu Okut, Sıra Bekleme!';

        // Update Previews
        $('qr-header-preview').textContent = `${header.split('&')[0]} & %${discount} İNDİRİM`;
        $('qr-footer-preview').textContent = footer;

        // Generate URL
        const params = new URLSearchParams({
            tenant: t.slug,
            promo: 'qr',
            d: discount,
            h: header,
            f: footer
        });
        const bookingUrl = `${window.location.origin}/booking.html?${params.toString()}`;

        // Clear and Generate
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: bookingUrl,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    inputs.forEach(id => $(id)?.addEventListener('input', updateQR));
    updateQR(); // Initial render

    // Buttons
    $('print-qr-btn').onclick = () => {
        const printArea = $('qr-printable-area').innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Mirror QR - ${t.name}</title>
                    <style>
                        body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Montserrat', sans-serif; }
                        #printable { width: 100%; max-width: 500px; text-align: center; border: 2px solid #eee; padding: 40px; border-radius: 40px; }
                        img { max-width: 100%; height: auto; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div id="printable">${printArea}</div>
                    <script>
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    };

    $('download-qr-btn').onclick = () => {
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `QR_${t.slug}_Mirror.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };
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
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:0.4rem;">
                  <strong>${esc(s.name)}</strong>
                  ${s.body_area ? `<span style="font-size:0.65rem; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); padding:0.15rem 0.4rem; border-radius:4px; color:var(--text-primary); font-weight:600;">${esc(s.body_area)}</span>` : ''}
                  ${s.discounted_price ? `<span style="font-size:0.65rem; background:var(--accent2); color:white; padding:0.15rem 0.4rem; border-radius:4px; font-weight:800;">%${Math.round((1 - s.discounted_price / s.price) * 100)} İNDİRİM</span>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.25rem;">
                ${s.campaign_label ? `<span style="font-size:0.7rem; color:var(--accent); font-weight:600;">🏷️ ${esc(s.campaign_label)}</span>` : ''}
                ${s.campaign_ends_at ? `<span style="font-size:0.65rem; color:var(--text-muted);">⌛ ${new Date(s.campaign_ends_at).toLocaleDateString('tr-TR')}</span>` : ''}
              </div>
              ${s.description ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem; line-height:1.4; max-width:95%;">${esc(s.description)}</div>` : ''}
              <span class="svc-meta" style="display:flex;align-items:center;gap:0.3rem;white-space:nowrap;line-height:1;margin-top:0.35rem;">
                ${s.duration_minutes ? `<span>${s.duration_minutes} dk</span>` : ''}
                <span style="display:inline-flex;align-items:center;white-space:nowrap;">
                  ${s.price != null ? `<span style="${s.discounted_price ? 'text-decoration:line-through;opacity:0.6;margin-right:0.4rem;font-size:0.75rem;' : 'font-size:0.85rem;'}">${Number(s.price).toLocaleString('tr-TR')} ₺</span>` : ''}
                  ${s.discounted_price != null ? `<span style="color:var(--accent2);font-weight:900;font-size:0.95rem;">${Number(s.discounted_price).toLocaleString('tr-TR')} ₺</span>` : ''}
                </span>
              </span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.3rem;">
              <div style="display:flex; gap:0.3rem;">
                  <button class="svc-del-btn" style="color:var(--accent);border-color:var(--accent);" data-action="edit-svc" data-id="${s.id}">Düzenle</button>
                  <button class="svc-del-btn" style="color:var(--green);border-color:var(--green);" data-action="manage-campaign" data-id="${s.id}">Kampanya</button>
                  <button class="svc-del-btn" data-action="delete-svc" data-id="${s.id}">Sil</button>
              </div>
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
        el.innerHTML = state.staff.map(s => {
            let details = '';
            if (s.phone) details += `<span style="font-size:0.75rem; color:var(--text-muted);"><i data-lucide="phone" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:0.2rem;"></i>${esc(s.phone)}</span>`;
            if (s.address) details += `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;"><i data-lucide="map-pin" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:0.2rem;"></i>${esc(s.address)}</div>`;

            return `
            <div class="staff-row" style="display:flex; align-items:center; justify-content:space-between; padding:1rem; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg-card); gap:1rem; text-align:left; flex-wrap:wrap;">
              <div style="flex:1; min-width:200px; display:flex; flex-direction:column; gap:0.4rem; text-align:left;">
                  <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; text-align:left;">
                      <strong style="font-size:1.05rem; color:var(--text-primary);">${esc(s.name)}${s.surname ? ' ' + esc(s.surname) : ''}</strong>
                      ${s.role ? `<span style="font-size:0.65rem; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); padding:0.15rem 0.4rem; border-radius:4px; color:var(--text-primary); font-weight:600;">${esc(s.role)}</span>` : ''}
                  </div>
                  <div style="display:flex; flex-direction:column; gap:0.2rem; text-align:left;">
                      ${details}
                  </div>
              </div>
              <button class="btn btn-danger btn-sm staff-del-btn" data-id="${s.id}" data-action="delete-staff" style="margin:0; width:auto; padding:0.4rem 1.2rem; flex-shrink:0;">Sil</button>
            </div>`
        }).join('');
        // Lucide ikonlarını yeniden oluştur
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Populate booking dropdown in "Yeni Randevu" (if element exists)
    const select = $('f-staff');
    if (select) {
        select.innerHTML = '<option value="">Farketmez (Herhangi Biri)</option>' +
            state.staff.map(s => `<option value="${s.id}">${esc(s.name)}${s.surname ? ' ' + esc(s.surname) : ''}</option>`).join('');
    }

    // Populate block staff dropdown in "Saat Yönetimi" (if element exists)
    const blockSelect = $('block-staff');
    if (blockSelect) {
        blockSelect.innerHTML = '<option value="">Tümü için kapat (Farketmez dahil)</option>' +
            state.staff.map(s => `<option value="${s.id}">${esc(s.name)}${s.surname ? ' ' + esc(s.surname) : ''}</option>`).join('');
    }

    const filterSelect = $('filter-staff');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Tüm Personeller</option>' +
            state.staff.map(s => `<option value="${s.id}">${esc(s.name)}${s.surname ? ' ' + esc(s.surname) : ''}</option>`).join('');
    }
}

// ── ADD STAFF LOGIC ──────────────────────────────────────────────────────────
$('add-staff-btn').onclick = async () => {
    const name = $('staff-name').value.trim();
    const surname = $('staff-surname').value.trim();
    const phone = $('staff-phone').value.trim();
    const role = $('staff-role').value.trim();
    const address = $('staff-address').value.trim();

    if (!name) return showStaffMsg('Personel adı zorunludur.', true);

    $('add-staff-btn').disabled = true;
    try {
        const res = await fetch(`${API_BASE}/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenant_id: state.tenantId,
                name,
                surname: surname || null,
                phone: phone || null,
                role: role || null,
                address: address || null
            }),
        });
        const json = await handleResponse(res);
        state.staff.push(json.staff);

        $('staff-name').value = '';
        $('staff-surname').value = '';
        $('staff-phone').value = '';
        $('staff-role').value = '';
        $('staff-address').value = '';

        renderStaffList();
        showStaffMsg(`"${name}" eklendi.`, false);
    } catch (e) { showStaffMsg(e.message, true); }
    finally { $('add-staff-btn').disabled = false; }
};

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

    // YENİ: Kampanya yönetimi (Modal Açma)
    const btnManageCampaign = e.target.closest('[data-action="manage-campaign"]');
    if (btnManageCampaign) {
        e.preventDefault(); e.stopPropagation();
        const id = btnManageCampaign.dataset.id;
        const svc = state.services.find(s => s.id === id);
        if (!svc) return;

        openCampaignEdit(svc);
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
});

// ── SLOT BLOCKING ─────────────────────────────────────────────────────────────
let blockDatePicker = null;

async function loadBlockGrid(date) {
    const grid = $('block-grid');
    grid.innerHTML = '<div class="loading-state">Yükleniyor...</div>';

    if (!window.blockCalendar) {
        window.blockCalendar = new BentoCalendar('cal-block', {
            defaultDate: date ? new Date(date) : new Date(),
            onSelect: (d) => loadBlockGrid(d)
        });
        if (!date) date = window.blockCalendar.selectedDate;
    }

    if (!date) return;

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
            addNotification(data); // Ses, Toast ve UI güncellemesi artık bunun içinde

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
        const oldAppointments = state.appointments || [];
        state.appointments = data; // State senkronizasyonu

        if (_prevApptCount !== null) {
            // Sadece gerçekten "yeni" eklenenleri id'sine bakarak bul
            const newAppts = data.filter(a => !oldAppointments.find(oa => oa.id === a.id));
            if (newAppts.length > 0) {
                newAppts.forEach(nA => addNotification(nA));
            }
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

    // Force a reflow so the initial state is applied immediately before transitioning
    void toast.offsetWidth;

    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0) scale(1)';
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
                const basePrice = (s.discounted_price != null ? Number(s.discounted_price) : Number(s.price || 0));

                // Add extras
                const extrasPrice = (a.appointment_extras || []).reduce((sum, ex) => {
                    return sum + Number(ex.price_at_booking || 0);
                }, 0);

                revenue += (basePrice + extrasPrice);
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

// Ensure preloader is hidden initially
const preloaderEl = $('preloader');
if (preloaderEl) preloaderEl.classList.add('hidden');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeInitWaves);
} else {
    maybeInitWaves();
}
// ── SHADER LOADING SCREEN ───────────────────────────────────────────────────
// ── GLOBAL HELLO PRELOADER logic ───────────────────────────────────────────
const words = ["Hello", "Bonjour", "Ciao", "Olà", "やあ", "Hallå", "Guten tag", "Hoş Geldiniz"];

function initPreloader(onComplete) {
    const preloader = $('preloader');
    const wordEl = $('preloader-word');
    const wordContainer = $('preloader-word-container');
    const pathEl = $('preloader-path');

    if (!preloader || !wordEl) return;

    preloader.classList.remove('hidden');
    wordContainer.classList.add('visible');

    let index = 0;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Initial SVG Path
    const initialPath = `M0 0 L${width} 0 L${width} ${height} Q${width / 2} ${height + 300} 0 ${height} L0 0`;
    const targetPath = `M0 0 L${width} 0 L${width} ${height} Q${width / 2} ${height} 0 ${height} L0 0`;

    pathEl.setAttribute('d', initialPath);

    function nextWord() {
        if (index === words.length - 1) {
            setTimeout(() => {
                preloader.classList.add('exit');
                pathEl.setAttribute('d', targetPath);

                setTimeout(() => {
                    preloader.classList.add('hidden');
                    if (onComplete) onComplete();
                }, 1000);
            }, 1000);
            return;
        }

        setTimeout(() => {
            index++;
            wordEl.textContent = words[index];
            nextWord();
        }, index === 0 ? 1000 : 150);
    }

    nextWord();
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
function initNotifications() {
    const sidebarBtn = $('sidebar-noti-btn');
    const topbarBtn = $('topbar-noti-btn');
    const overlay = $('noti-overlay');
    const panel = $('noti-panel');
    const closeBtn = $('noti-close-btn');
    const dialogOverlay = $('noti-dialog-overlay');
    const dialogClose = $('noti-dialog-close');
    const dialogViewAll = $('noti-dialog-view-all');
    const markAllRead = $('noti-mark-all-read');
    const dialogMarkRead = $('noti-dialog-mark-read');

    const togglePanel = (show) => {
        if (show) {
            overlay.classList.add('visible');
            panel.classList.add('visible');
            renderNotifications();
            // Close dialog if open
            dialogOverlay.classList.add('hidden');
        } else {
            overlay.classList.remove('visible');
            panel.classList.remove('visible');
        }
    };

    if (sidebarBtn) sidebarBtn.onclick = () => {
        if (state.notifications.filter(n => !n.read).length > 0) {
            dialogOverlay.classList.remove('hidden');
            renderNotificationDialog();
        } else {
            togglePanel(true);
        }
    };

    const openNotifications = () => {
        if (state.notifications.filter(n => !n.read).length > 0) {
            dialogOverlay.classList.remove('hidden');
            renderNotificationDialog();
        } else {
            togglePanel(true);
        }
    };

    if (sidebarBtn) sidebarBtn.onclick = openNotifications;
    if (topbarBtn) topbarBtn.onclick = openNotifications;

    if (overlay) overlay.onclick = () => togglePanel(false);
    if (closeBtn) closeBtn.onclick = () => togglePanel(false);
    if (dialogClose) dialogClose.onclick = () => dialogOverlay.classList.add('hidden');

    if (dialogViewAll) dialogViewAll.onclick = () => {
        dialogOverlay.classList.add('hidden');
        togglePanel(true);
    };

    if (markAllRead) markAllRead.onclick = () => {
        state.notifications.forEach(n => n.read = true);
        renderNotifications();
        updateNotiBadges();
    };
    if (dialogMarkRead) dialogMarkRead.onclick = () => {
        state.notifications.forEach(n => n.read = true);
        dialogOverlay.classList.add('hidden');
        updateNotiBadges();
    };
}

function addNotification(data) {
    // Aynı id'li bildirim varsa mükerrer eklemeyi önle
    if (data.id && state.notifications.some(n => n.rawData && n.rawData.id === data.id)) return;

    const initials = data.customer_name ? data.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'YR';
    const noti = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        initials: initials,
        customer_name: data.customer_name || 'Yeni Müşteri',
        service_name: data.services?.name || data.service_name || 'Randevu',
        message: `${data.services?.name || 'Randevu'} — ${data.appointment_time?.slice(0, 5)}`,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        rawData: data
    };
    state.notifications.unshift(noti);
    if (state.notifications.length > 50) state.notifications.pop();

    updateNotiBadges();
    renderNotifications(); // Arayüzü anında güncelle

    playNotificationSound(); // Sesi tam bildirim eklendiğinde çal
    showToast(`${noti.customer_name} — ${data.appointment_time?.slice(0, 5)}`);

    if (window.lucide) lucide.createIcons();
}

function updateNotiBadges() {
    const unreadCount = state.notifications.filter(n => !n.read).length;
    ['sidebar-noti-badge', 'topbar-noti-badge'].forEach(id => {
        const el = $(id);
        if (el) {
            el.textContent = unreadCount;
            el.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    });
}

function renderNotifications() {
    const list = $('noti-list');
    if (!list) return;

    if (state.notifications.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted); display:flex; flex-direction:column; align-items:center;">
                <div style="width:56px; height:56px; border-radius:9999px; background:rgba(99,102,241,0.05); display:flex; align-items:center; justify-content:center; margin-bottom:1rem;">
                    <i data-lucide="bell-off" style="width:24px; height:24px; color:#6366f1; opacity:0.5;"></i>
                </div>
                <p style="font-size:0.95rem; font-weight:500; margin-bottom:0.25rem;">Henüz bildirim yok</p>
                <p style="font-size:0.8rem; opacity:0.7;">Yeni randevular burada görünecek.</p>
            </div>`;
    } else {
        list.innerHTML = state.notifications.map(n => `
            <div class="noti-item ${n.read ? '' : 'unread'}" onclick="handleNotiClick('${n.id}')">
                <div class="noti-item-avatar">${n.initials}</div>
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.15rem;">
                        <span style="font-weight:700; font-size:0.88rem; color:var(--text-primary);">${esc(n.customer_name)}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted);">${n.time}</span>
                    </div>
                    <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4;">${esc(n.message)}</div>
                </div>
            </div>
        `).join('');
    }
    if (window.lucide) lucide.createIcons();
}

function renderNotificationDialog() {
    const container = $('noti-dialog-list');
    const badge = $('noti-dialog-count');
    const unread = state.notifications.filter(n => !n.read);

    if (badge) badge.textContent = unread.length;

    if (container) {
        container.innerHTML = unread.slice(0, 3).map(n => `
            <div class="noti-item unread" onclick="handleNotiClick('${n.id}')">
                <div class="noti-item-avatar" style="width:34px; height:34px; font-size:0.75rem;">${n.initials}</div>
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary); margin-bottom:0.1rem;">${esc(n.customer_name)}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary);">${esc(n.message)}</div>
                </div>
            </div>
        `).join('');
    }
}

window.handleNotiClick = (id) => {
    const n = state.notifications.find(x => x.id === id);
    if (n) {
        n.read = true;
        updateNotiBadges();

        // Bu sekme kapansın (User request)
        const overlay = $('noti-overlay');
        const panel = $('noti-panel');
        const dialogOverlay = $('noti-dialog-overlay');

        if (overlay) overlay.classList.remove('visible');
        if (panel) panel.classList.remove('visible');
        if (dialogOverlay) dialogOverlay.classList.add('hidden');

        // Detay kartını aç
        if (n.rawData) {
            openModal(n.rawData);
        }
    }
};

// ── CRM — MÜŞTERİ YÖNETİMİ ──────────────────────────────────────────────────
let _crmSearchTimeout = null;
window._currentCrmData = [];

async function loadCRM(search = '') {
    const el = $('crm-list');
    if (!el) return;
    state.pagination.crm.currentPage = 1; // reset on search/load
    el.innerHTML = '<div class="loading-state">Yükleniyor...</div>';
    try {
        const url = `${API_BASE}/customers/${state.tenantId}${search ? '?search=' + encodeURIComponent(search) : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await handleResponse(res, true);
        window._currentCrmData = json.customers || [];
        renderCRM(window._currentCrmData);
    } catch (e) {
        el.innerHTML = `<div class="loading-state" style="color:var(--red)">Hata: ${e.message}</div>`;
    }
}

function renderCRM(customers) {
    const el = $('crm-list');

    // As per user requirement, clean existing before append
    el.innerHTML = '';

    if (!customers.length) {
        el.innerHTML = '<div class="loading-state">Henüz müşteri verisi yok.</div>';
        const paginationWrapper = document.getElementById('pagination-wrapper-crm-list');
        if (paginationWrapper) paginationWrapper.innerHTML = ''; // Hide pagination if no items
        return;
    }

    const { currentPage, itemsPerPage } = state.pagination.crm;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayList = customers.slice(startIndex, endIndex);

    el.innerHTML = displayList.map(c => {
        const isVIP = c.total_appointments >= 5;
        const initials = c.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        return `
        <div class="appointment-card" style="cursor:pointer;" onclick="openCRMDetail(${JSON.stringify(c).replace(/"/g, '&quot;')})">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                <div style="width:42px; height:42px; border-radius:50%; background:var(--accent-glow); border:2px solid var(--accent); display:flex; align-items:center; justify-content:center; font-weight:800; color:var(--accent); font-size:0.9rem; flex-shrink:0;">${esc(initials)}</div>
                <div>
                    <div style="font-weight:700; font-size:0.95rem;">${esc(c.customer_name)} ${isVIP ? '<span style="background:gold; color:#111; font-size:0.65rem; padding:0.1rem 0.4rem; border-radius:9999px; font-weight:800; margin-left:4px;">⭐ VIP</span>' : ''}</div>
                    <div style="font-size:0.78rem; color:var(--text-muted);">${esc(c.customer_phone)}</div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; font-size:0.8rem;">
                <div style="text-align:center; padding:0.5rem; background:var(--bg-deep); border-radius:var(--radius-sm);">
                    <div style="font-weight:800; color:var(--accent);">${c.total_appointments}</div>
                    <div style="color:var(--text-muted); font-size:0.7rem;">Randevu</div>
                </div>
                <div style="text-align:center; padding:0.5rem; background:var(--bg-deep); border-radius:var(--radius-sm);">
                    <div style="font-weight:800; color:var(--green);">${c.total_spent.toLocaleString('tr-TR')} ₺</div>
                    <div style="color:var(--text-muted); font-size:0.7rem;">Harcama</div>
                </div>
                <div style="text-align:center; padding:0.5rem; background:var(--bg-deep); border-radius:var(--radius-sm);">
                    <div style="font-weight:800; font-size:0.78rem;">${c.last_appointment ? formatDate(c.last_appointment) : '—'}</div>
                    <div style="color:var(--text-muted); font-size:0.7rem;">Son Randevu</div>
                </div>
            </div>
            <div style="margin-top:0.75rem; display:flex; gap:0.5rem;">
                <a href="https://wa.me/${c.customer_phone.replace(/\D/g, '')}" target="_blank"
                   onclick="event.stopPropagation()"
                   style="flex:1; text-align:center; padding:0.4rem; background:#25D366; color:white; border-radius:var(--radius-sm); font-size:0.75rem; font-weight:700; text-decoration:none;">
                   💬 WhatsApp
                </a>
            </div>
        </div>`;
    }).join('');

    // Arama olayı
    const searchInput = $('crm-search');
    if (searchInput && !searchInput._bound) {
        searchInput._bound = true;
        searchInput.addEventListener('input', () => {
            clearTimeout(_crmSearchTimeout);
            _crmSearchTimeout = setTimeout(() => loadCRM(searchInput.value.trim()), 400);
        });
    }
    $('crm-refresh-btn')?.addEventListener('click', () => loadCRM());
}

function openCRMDetail(c) {
    $('crm-detail-name').textContent = c.customer_name + (c.total_appointments >= 5 ? ' ⭐ VIP' : '');
    $('crm-detail-phone').textContent = c.customer_phone;
    $('crm-detail-stats').innerHTML = `
        <div style="padding:0.75rem; background:var(--bg-deep); border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:1.5rem; font-weight:800; color:var(--accent);">${c.total_appointments}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Toplam Randevu</div>
        </div>
        <div style="padding:0.75rem; background:var(--bg-deep); border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:1.5rem; font-weight:800; color:var(--green);">${c.total_spent.toLocaleString('tr-TR')} ₺</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Toplam Harcama</div>
        </div>`;
    const history = c.appointments || [];
    $('crm-detail-history').innerHTML = history.length ? history.map(a => `
        <div style="padding:0.65rem 0.75rem; border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center; font-size:0.82rem;">
            <span>${formatDate(a.appointment_date)} ${a.appointment_time?.slice(0, 5)} — ${esc(a.services?.name || '—')}</span>
            <span class="status-badge ${a.status}">${statusLabel(a.status)}</span>
        </div>`).join('') : '<div class="loading-state">Randevu yok.</div>';
    $('crm-detail-overlay').classList.remove('hidden');
    $('crm-detail-close').onclick = () => $('crm-detail-overlay').classList.add('hidden');
}

// ── BEKLEME LİSTESİ ──────────────────────────────────────────────────────────
async function loadWaitlist() {
    const el = $('waitlist-list');
    if (!el) return;
    el.innerHTML = '<div class="loading-state">Yükleniyor...</div>';
    try {
        const res = await fetch(`${API_BASE}/waitlist/${state.tenantId}`, { credentials: 'include' });
        const json = await handleResponse(res, true);
        renderWaitlist(json.waitlist || []);
        $('waitlist-refresh-btn')?.addEventListener('click', loadWaitlist);
    } catch (e) {
        el.innerHTML = `<div class="loading-state" style="color:var(--red)">Hata: ${e.message}</div>`;
    }
}

const waitlistStatusLabel = { waiting: 'Bekliyor', contacted: 'İletişim Kuruldu', booked: 'Randevulandı', cancelled: 'İptal' };
const waitlistStatusColor = { waiting: 'var(--yellow)', contacted: '#6366f1', booked: 'var(--green)', cancelled: 'var(--red)' };

function renderWaitlist(list) {
    const el = $('waitlist-list');
    if (!list.length) {
        el.innerHTML = '<div class="loading-state">Bekleme listesi boş.</div>';
        return;
    }
    el.innerHTML = list.map(entry => `
        <div class="appointment-card" data-wid="${entry.id}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                <div>
                    <div style="font-weight:700;">${esc(entry.customer_name)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${esc(entry.customer_phone)}</div>
                </div>
                <span style="font-size:0.72rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:9999px; background:${waitlistStatusColor[entry.status]}22; color:${waitlistStatusColor[entry.status]};">${waitlistStatusLabel[entry.status] || entry.status}</span>
            </div>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">
                📅 ${formatDate(entry.requested_date)} • 🕐 ${entry.requested_time?.slice(0, 5)} • 💆 ${esc(entry.services?.name || 'Belirtilmedi')}
            </div>
            ${entry.notes ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem; padding:0.4rem 0.6rem; background:var(--bg-deep); border-radius:var(--radius-sm);">📝 ${esc(entry.notes)}</div>` : ''}
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <a href="https://wa.me/${entry.customer_phone.replace(/\D/g, '')}" target="_blank"
                   style="padding:0.35rem 0.75rem; background:#25D366; color:white; border-radius:var(--radius-sm); font-size:0.75rem; font-weight:700; text-decoration:none;">💬 WhatsApp</a>
                ${entry.status === 'waiting' ? `<button onclick="updateWaitlistStatus('${entry.id}','contacted')" style="padding:0.35rem 0.75rem; background:#6366f1; color:white; border:none; border-radius:var(--radius-sm); font-size:0.75rem; font-weight:700; cursor:pointer;">İletişim Kuruldu</button>` : ''}
                ${entry.status !== 'booked' && entry.status !== 'cancelled' ? `<button onclick="updateWaitlistStatus('${entry.id}','booked')" style="padding:0.35rem 0.75rem; background:var(--green); color:white; border:none; border-radius:var(--radius-sm); font-size:0.75rem; font-weight:700; cursor:pointer;">Randevulandı</button>` : ''}
                <button onclick="deleteWaitlistEntry('${entry.id}')" style="padding:0.35rem 0.75rem; background:transparent; color:var(--red); border:1px solid var(--red); border-radius:var(--radius-sm); font-size:0.75rem; font-weight:700; cursor:pointer;">Sil</button>
            </div>
        </div>`).join('');
}

async function updateWaitlistStatus(id, status) {
    try {
        const res = await fetch(`${API_BASE}/waitlist/${id}/status`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        await handleResponse(res, true);
        loadWaitlist();
    } catch (e) { alert('Hata: ' + e.message); }
}

async function deleteWaitlistEntry(id) {
    showConfirm('Bu bekleme kaydını silmek istediğinizden emin misiniz?', async () => {
        try {
            const res = await fetch(`${API_BASE}/waitlist/${id}`, { method: 'DELETE', credentials: 'include' });
            await handleResponse(res, true);
            loadWaitlist();
        } catch (e) { alert('Hata: ' + e.message); }
    });
}

// ── RAPORLAR — PERSONEL PERFORMANSI ─────────────────────────────────────────
let _reportPeriod = 'all';
async function loadReports(period = 'all') {
    _reportPeriod = period;
    const el = $('reports-list');
    if (!el) return;

    // Buton durumlarını güncelle
    ['all', 'month', 'week'].forEach(p => {
        const btn = $(`report-btn-${p}`);
        if (btn) {
            btn.className = p === period ? 'btn btn-primary' : 'btn btn-secondary';
        }
    });

    el.innerHTML = '<div class="loading-state">Yükleniyor...</div>';
    try {
        const res = await fetch(`${API_BASE}/reports/staff/${state.tenantId}?period=${period}`, { credentials: 'include' });
        const json = await handleResponse(res, true);
        renderReports(json.report || [], json.totalRevenue || 0);
    } catch (e) {
        el.innerHTML = `<div class="loading-state" style="color:var(--red)">Hata: ${e.message}</div>`;
    }
}

function renderReports(report, totalRevenue) {
    const totalEl = $('reports-total-revenue');
    if (totalEl) totalEl.textContent = `₺${totalRevenue.toLocaleString('tr-TR')}`;

    const el = $('reports-list');
    if (!report.length) {
        el.innerHTML = '<div class="loading-state">Bu dönem için veri yok.</div>';
        return;
    }
    el.innerHTML = report.map((s, i) => `
        <div class="appointment-card" style="cursor:pointer; display:block;"
             onclick="openStaffDetail('${s.id}', '${esc(s.name).replace(/'/g, "\\'")}')">

            <!-- Satır 1: isim + gelir -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                <div style="display:flex; align-items:center; gap:0.65rem;">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--accent-glow); border:2px solid var(--accent); display:flex; align-items:center; justify-content:center; font-weight:800; color:var(--accent); font-size:0.8rem; flex-shrink:0;">${i + 1}</div>
                    <div>
                        <div style="font-weight:700; font-size:0.95rem;">${esc(s.name)}</div>
                        <div style="font-size:0.72rem; color:var(--text-muted);">${s.total_appointments} randevu • %${s.cancel_rate} iptal</div>
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0; margin-left:1rem;">
                    <div style="font-size:1.15rem; font-weight:800; color:var(--accent);">${s.total_revenue.toLocaleString('tr-TR')} ₺</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">%${s.revenue_share} pay</div>
                </div>
            </div>

            <!-- Satır 2: progress bar -->
            <div style="height:5px; background:var(--bg-deep); border-radius:9999px; overflow:hidden; margin-bottom:0.75rem;">
                <div style="height:100%; width:${s.revenue_share}%; background:var(--accent); border-radius:9999px; transition:width 0.6s ease;"></div>
            </div>

            <!-- Satır 3: istatistik kartları -->
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; font-size:0.78rem; text-align:center;">
                <div style="padding:0.45rem 0.25rem; background:var(--bg-deep); border-radius:var(--radius-sm);">
                    <div style="font-weight:700; color:var(--green); font-size:0.95rem;">${s.confirmed_appointments}</div>
                    <div style="color:var(--text-muted); font-size:0.7rem; margin-top:2px;">Onaylı</div>
                </div>
                <div style="padding:0.45rem 0.25rem; background:var(--bg-deep); border-radius:var(--radius-sm);">
                    <div style="font-weight:700; color:var(--red); font-size:0.95rem;">${s.cancelled_appointments}</div>
                    <div style="color:var(--text-muted); font-size:0.7rem; margin-top:2px;">İptal</div>
                </div>
                <div style="padding:0.45rem 0.25rem; background:var(--bg-deep); border-radius:var(--radius-sm);">
                    <div style="font-weight:700; font-size:0.85rem;">${Math.round(s.total_revenue / Math.max(s.confirmed_appointments, 1)).toLocaleString('tr-TR')} ₺</div>
                    <div style="color:var(--text-muted); font-size:0.7rem; margin-top:2px;">Ort/Randevu</div>
                </div>
            </div>
        </div>`).join('');

    // Dönem butonları
    ['all', 'month', 'week'].forEach(p => {
        const btn = $(`report-btn-${p}`);
        if (btn && !btn._bound) {
            btn._bound = true;
            btn.addEventListener('click', () => loadReports(p));
        }
    });
}

// ── PERSONEL DETAY PANELİ ────────────────────────────────────────────────────
async function openStaffDetail(staffId, staffName) {
    // Overlay'i hazırla
    let overlay = $('staff-detail-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'staff-detail-overlay';
        overlay.className = 'reset-overlay';
        overlay.style.cssText = 'z-index:10500;';
        overlay.innerHTML = `
            <div class="reset-card" style="max-width:560px; max-height:85vh; overflow-y:auto;">
                <button class="reset-close-btn" id="staff-detail-close">✕</button>
                <h2 id="staff-detail-name" style="margin-bottom:0.25rem;"></h2>
                <div id="staff-detail-body"></div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#staff-detail-close').onclick = () => overlay.classList.add('hidden');
    }
    overlay.classList.remove('hidden');
    $('staff-detail-name').textContent = '👤 ' + staffName;
    $('staff-detail-body').innerHTML = '<div class="loading-state">Yükleniyor...</div>';

    try {
        const res = await fetch(`${API_BASE}/appointments/${state.tenantId}`, { credentials: 'include' });
        const json = await handleResponse(res, true);
        const all = (json.appointments || []).filter(a =>
            staffId === '__others__' ? !a.staff_id : a.staff_id === staffId
        );

        const todayStr = today();
        const past = all.filter(a => a.appointment_date < todayStr).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));
        const upcoming = all.filter(a => a.appointment_date >= todayStr).sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));

        const renderList = (items) => items.length ? items.map(a => `
            <div style="padding:0.65rem 0.75rem; border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center; font-size:0.82rem;">
                <div>
                    <div style="font-weight:600;">${esc(a.customer_name)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${formatDate(a.appointment_date)} ${a.appointment_time?.slice(0, 5)} • ${esc(a.services?.name || '—')}</div>
                </div>
                <span class="status-badge ${a.status}">${statusLabel(a.status)}</span>
            </div>`).join('') : '<div class="loading-state" style="font-size:0.82rem;">Randevu yok.</div>';

        $('staff-detail-body').innerHTML = `
            <div style="margin-bottom:1.25rem;">
                <h4 style="font-size:0.82rem; opacity:0.6; margin-bottom:0.6rem; letter-spacing:.05em;">🔜 GELECEK RANDEVULAR (${upcoming.length})</h4>
                ${renderList(upcoming)}
            </div>
            <div>
                <h4 style="font-size:0.82rem; opacity:0.6; margin-bottom:0.6rem; letter-spacing:.05em;">📋 GEÇMİŞ RANDEVULAR (${past.length})</h4>
                ${renderList(past)}
            </div>`;
    } catch (e) {
        $('staff-detail-body').innerHTML = `<div class="loading-state" style="color:var(--red)">Hata: ${e.message}</div>`;
    }
}

// ── SİLİNEN RANDEVULAR ──────────────────────────────────────────────────────
async function loadDeletedAppointments() {
    const el = $('deleted-appointments-list');
    if (!el) return;
    el.innerHTML = '<div class="loading-state">Yükleniyor...</div>';
    try {
        const res = await fetch(`${API_BASE}/appointments/${state.tenantId}?show_deleted=true`, { credentials: 'include' });
        const json = await handleResponse(res, true);
        renderDeletedAppointments(json.appointments || []);
        $('deleted-refresh-btn')?.addEventListener('click', loadDeletedAppointments);
    } catch (e) {
        el.innerHTML = `<div class="loading-state" style="color:var(--red)">Hata: ${e.message}</div>`;
    }
}

function renderDeletedAppointments(list) {
    const el = $('deleted-appointments-list');
    if (!list.length) {
        el.innerHTML = '<div class="loading-state">Son 24 saat içinde silinmiş randevu bulunmuyor.</div>';
        return;
    }

    el.innerHTML = list.map(a => {
        const deletedAt = new Date(a.deleted_at);
        const now = new Date();
        const diffMs = (24 * 60 * 60 * 1000) - (now - deletedAt);
        const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const minsLeft = Math.max(0, Math.floor((diffMs / (1000 * 60)) % 60));

        return `
        <div class="appointment-card deleted" style="border-left: 4px solid var(--red);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                <div>
                    <div style="font-weight:700;">${esc(a.customer_name)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${esc(a.customer_phone)}</div>
                </div>
                <span style="font-size:0.65rem; background:rgba(239,68,68,0.1); color:var(--red); padding:0.2rem 0.5rem; border-radius:4px; font-weight:700;">SİLİNDİ</span>
            </div>
            <div style="font-size:0.82rem; margin-bottom:0.75rem;">
                📅 ${formatDate(a.appointment_date)} • 🕐 ${a.appointment_time?.slice(0, 5)} • 💇 ${esc(a.services?.name || '—')}
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); display:flex; align-items:center; gap:0.4rem;">
                <i data-lucide="clock" style="width:12px; height:12px;"></i>
                Kalıcı olarak silinmesine <strong>${hoursLeft}s ${minsLeft}dk</strong> kaldı.
            </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

async function loadCampaigns() {
    // This function is now deprecated, but we keep it to avoid breakage if called elsewhere.
    // Campaign logic is merged into services tab.
}

function renderCampaigns(services) {
    const el = $('campaigns-list');
    if (!services.length) {
        el.innerHTML = '<div class="loading-state">Hizmet bulunamadı. Önce Denetim sekmesinden hizmet ekleyin.</div>';
        return;
    }
    const now = new Date();
    el.innerHTML = services.map(svc => {
        const hasDiscount = svc.discounted_price != null;
        const endsAt = svc.campaign_ends_at ? new Date(svc.campaign_ends_at) : null;
        const isExpired = hasDiscount && endsAt && endsAt <= now;
        const isLive = hasDiscount && (!endsAt || endsAt > now);

        let badge = '';
        if (isLive) {
            let diffText = '';
            if (endsAt) {
                const diffMs = endsAt - now;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
                if (diffDays > 0) {
                    diffText = ` — ${diffDays}g ${diffHours}s kaldı`;
                } else if (diffHours > 0) {
                    diffText = ` — ${diffHours}s ${diffMinutes}dk kaldı`;
                } else {
                    diffText = ` — ${diffMinutes}dk kaldı`;
                }
            }
            badge = `<span style="font-size:0.72rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:9999px; background:#10b98122; color:#10b981;">🟢 CANLI${diffText}</span>`;
        } else if (isExpired) {
            badge = `<span style="font-size:0.72rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:9999px; background:#ef444422; color:#ef4444;">🔴 SÜRESİ DOLDU</span>`;
        } else {
            badge = `<span style="font-size:0.72rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:9999px; background:var(--bg-deep); color:var(--text-muted);">Kampanya Yok</span>`;
        }

        return `
        <div class="appointment-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem;">
                <div>
                    <div style="font-weight:700; font-size:0.95rem;">${esc(svc.name)}</div>
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
                        Normal: <strong>${Number(svc.price).toLocaleString('tr-TR')} ₺</strong>
                        ${hasDiscount ? ` → İndirimli: <strong style="color:var(--accent);">${Number(svc.discounted_price).toLocaleString('tr-TR')} ₺</strong>` : ''}
                    </div>
                    ${svc.campaign_label ? `<div style="font-size:0.78rem; color:var(--accent); margin-top:2px;">🏷️ ${esc(svc.campaign_label)}</div>` : ''}
                    ${endsAt ? `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Bitiş: ${endsAt.toLocaleString('tr-TR')}</div>` : ''}
                </div>
                ${badge}
            </div>
            <button onclick="openCampaignEdit(${JSON.stringify(svc).replace(/"/g, '&quot;')})"
                style="width:100%; padding:0.45rem; background:var(--accent-glow); border:1px solid var(--accent); border-radius:var(--radius-sm); color:var(--accent); font-weight:700; font-size:0.8rem; cursor:pointer;">
                ${isLive || isExpired ? '✏️ Kampanyayı Düzenle' : '+ Kampanya Kur'}
            </button>
        </div>`;
    }).join('');
}

function openCampaignEdit(svc) {
    _campaignSvcId = svc.id;
    $('campaign-svc-name').textContent = svc.name + ` (Normal: ${Number(svc.price).toLocaleString('tr-TR')} ₺)`;
    $('campaign-label-input').value = svc.campaign_label || '';
    $('campaign-price-input').value = svc.discounted_price ?? '';

    if (svc.campaign_ends_at) {
        // datetime-local format: YYYY-MM-DDTHH:MM
        const d = new Date(svc.campaign_ends_at);
        const pad = n => String(n).padStart(2, '0');
        $('campaign-ends-input').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else {
        $('campaign-ends-input').value = '';
    }

    $('campaign-msg').classList.add('hidden');
    $('campaign-edit-overlay').classList.remove('hidden');
    $('campaign-edit-close').onclick = () => $('campaign-edit-overlay').classList.add('hidden');
    $('campaign-save-btn').onclick = saveCampaign;
    $('campaign-clear-btn').onclick = clearCampaign;
}

async function saveCampaign() {
    const label = $('campaign-label-input').value.trim();
    const price = $('campaign-price-input').value;
    const endsAt = $('campaign-ends-input').value;
    const msg = $('campaign-msg');

    if (price === '' || isNaN(Number(price))) {
        msg.textContent = '⚠️ İndirimli fiyat giriniz.';
        msg.className = 'form-message error';
        msg.classList.remove('hidden');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/services/${_campaignSvcId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                discounted_price: Number(price),
                campaign_label: label || null,
                campaign_ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'İşlem başarısız');
        }
        const json = await res.json();

        if (json.needs_migration) {
            // Kolonlar eksik — sadece indirim kaydedildi
            msg.textContent = '✅ İndirim kaydedildi! (Etiket & bitiş için SQL kolonlarını ekleyin)';
            msg.className = 'form-message success';
            msg.classList.remove('hidden');
            $('campaigns-sql-warning')?.classList.remove('hidden');
        } else {
            msg.textContent = '✅ Kampanya kaydedildi!';
            msg.className = 'form-message success';
            msg.classList.remove('hidden');
        }
        setTimeout(() => {
            $('campaign-edit-overlay').classList.add('hidden');
            fetchServices();
        }, 1200);
    } catch (e) {
        msg.textContent = '❌ Hata: ' + e.message;
        msg.className = 'form-message error';
        msg.classList.remove('hidden');
    }
}

async function clearCampaign() {
    showConfirm('Kampanyayı kaldırmak istediğinizden emin misiniz?', async () => {
        try {
            const res = await fetch(`${API_BASE}/services/${_campaignSvcId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discounted_price: null, campaign_label: null, campaign_ends_at: null }),
            });
            await handleResponse(res, true);
            $('campaign-edit-overlay').classList.add('hidden');
            fetchServices();
        } catch (e) { alert('Hata: ' + e.message); }
    });
}

// ── UYGULAMA İÇİ CONFIRM DİYALOĞU ───────────────────────────────────────────
function showConfirm(message, onConfirm, confirmText = 'Evet, Devam Et', cancelText = 'Vazgeç') {
    // Mevcut varsa kaldır
    document.querySelector('.app-confirm-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'app-confirm-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);animation:fadeIn 0.15s ease;';

    overlay.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:1rem;padding:1.75rem 2rem;max-width:380px;width:90%;box-shadow:0 24px 60px rgba(0,0,0,0.5);text-align:center;animation:cardIn 0.2s cubic-bezier(.34,1.2,.64,1);">
            <div style="font-size:2rem;margin-bottom:0.75rem;">⚠️</div>
            <p style="color:var(--text-primary);font-weight:600;font-size:0.95rem;line-height:1.5;margin-bottom:1.5rem;">${message}</p>
            <div style="display:flex;gap:0.75rem;justify-content:center;">
                <button id="_confirm-cancel" style="flex:1;height:42px;border-radius:0.6rem;border:1px solid var(--border);background:transparent;color:var(--text-muted);font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;">${cancelText}</button>
                <button id="_confirm-ok" style="flex:1;height:42px;border-radius:0.6rem;border:none;background:var(--red);color:#fff;font-weight:700;cursor:pointer;font-family:'Montserrat',sans-serif;">${confirmText}</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#_confirm-cancel').onclick = close;
    overlay.querySelector('#_confirm-ok').onclick = () => { close(); onConfirm(); };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}
