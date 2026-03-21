/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL — Vanilla JS
   ═══════════════════════════════════════════════════════════════════════════ */

const API = '/api/admin';
const state = {
    admin: null,
    activeTab: 'dashboard',
    plans: [],
    overview: {},
    tenants: { data: [], total: 0, page: 1, totalPages: 1 },
    subscriptions: { data: [], total: 0, page: 1, totalPages: 1 },
    payments: { data: [], total: 0, page: 1, totalPages: 1 },
    logs: { data: [], total: 0, page: 1, totalPages: 1 },
    tickets: { data: [], total: 0, page: 1, totalPages: 1 },
    notifications: { data: [], total: 0 },
    selectedTenants: [],
    filters: {
        tenants: { search: '', status: '', plan: '', created_from: '', created_to: '' },
        payments: { status: '', from: '', to: '' },
        logs: { action: '' },
        tickets: { status: '', priority: '' }
    }
};

// ── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    await checkAuth();
});

function updateDateTime() {
    const el = document.getElementById('topbarDate');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleDateString('tr-TR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

// ── AUTH ──────────────────────────────────────────────────────────────────
async function checkAuth() {
    try {
        const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (res.ok) {
            const { admin } = await res.json();
            state.admin = admin;
            showApp();
        }
    } catch (e) { /* not logged in */ }
}

async function doLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.style.display = 'none';

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
            errEl.textContent = data.error || 'Giriş başarısız.';
            errEl.style.display = 'block';
            return;
        }
        state.admin = data.admin;
        showApp();
    } catch (err) {
        errEl.textContent = 'Sunucuya bağlanılamadı.';
        errEl.style.display = 'block';
    }
}

async function doLogout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    state.admin = null;
    document.getElementById('adminApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'grid';
    if (state.admin) {
        document.getElementById('adminDisplayName').textContent = state.admin.display_name || state.admin.username;
        document.getElementById('adminAvatar').textContent = (state.admin.display_name || 'A')[0].toUpperCase();
    }
    lucide.createIcons();
    loadPlans();
    switchTab('dashboard');
}

// ── API HELPER ───────────────────────────────────────────────────────────
async function adminFetch(url, opts = {}) {
    const res = await fetch(url, { credentials: 'include', ...opts });
    if (res.status === 401) { doLogout(); return null; }
    return res;
}

async function adminJSON(url, opts = {}) {
    const res = await adminFetch(url, opts);
    if (!res) return null;
    return res.json();
}

// ── TAB NAVIGATION ───────────────────────────────────────────────────────
function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById(`tab-${tab}`);
    const nav = document.querySelector(`.admin-nav-item[data-tab="${tab}"]`);
    if (panel) panel.classList.add('active');
    if (nav) nav.classList.add('active');

    const titles = {
        dashboard: 'Dashboard', tenants: 'İşletme Yönetimi',
        subscriptions: 'Abonelik & Paketler', payments: 'Ödeme Takibi',
        logs: 'Aktivite Logları', analytics: 'Platform İstatistikleri',
        tickets: 'Destek Talepleri', notifications: 'Bildirimler'
    };
    document.getElementById('topbarTitle').textContent = titles[tab] || tab;

    switch (tab) {
        case 'dashboard': loadDashboard(); break;
        case 'tenants': loadTenants(); break;
        case 'subscriptions': loadSubscriptions(); break;
        case 'payments': loadPayments(); break;
        case 'logs': loadLogs(); break;
        case 'analytics': loadAnalytics(); break;
        case 'tickets': loadTickets(); break;
        case 'notifications': loadNotifications(); break;
    }
}

// ── PLANS (shared) ───────────────────────────────────────────────────────
async function loadPlans() {
    const data = await adminJSON(`${API}/plans`);
    if (data) state.plans = data.plans || [];
}

function getPlanName(planId) {
    const p = state.plans.find(x => x.id === planId);
    return p ? p.name : '—';
}

function getPlanSlug(planId) {
    const p = state.plans.find(x => x.id === planId);
    return p ? p.slug : '';
}

function planBadge(planId) {
    const slug = getPlanSlug(planId);
    const name = getPlanName(planId);
    if (!slug) return '<span class="badge badge-cancelled">Plansız</span>';
    return `<span class="badge badge-${slug}">${name}</span>`;
}

function statusBadge(isActive) {
    return isActive !== false
        ? '<span class="badge badge-active">Aktif</span>'
        : '<span class="badge badge-inactive">Pasif</span>';
}

function paymentBadge(status) {
    const map = { paid: 'badge-paid', pending: 'badge-pending', overdue: 'badge-overdue', refunded: 'badge-cancelled' };
    const labels = { paid: 'Ödendi', pending: 'Bekliyor', overdue: 'Gecikmiş', refunded: 'İade' };
    return `<span class="badge ${map[status] || 'badge-cancelled'}">${labels[status] || status}</span>`;
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('tr-TR');
}

function formatCurrency(n) {
    return new Intl.NumberFormat('tr-TR').format(n || 0);
}

function daysUntil(dateStr) {
    if (!dateStr) return 999;
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = msg;
    container.appendChild(el);
    setTimeout(() => { el.remove(); }, 3500);
}

// ── MODAL ─────────────────────────────────────────────────────────────────
function openModal(title, bodyHtml, footerHtml = '', wide = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = footerHtml;
    const card = document.getElementById('modalCard');
    card.classList.toggle('wide', wide);
    document.getElementById('adminModal').classList.add('open');
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('adminModal').classList.remove('open');
}

// ── PAGINATION ───────────────────────────────────────────────────────────
function renderPagination(page, totalPages, onPageFn) {
    if (totalPages <= 1) return '';
    let html = '<div class="pagination">';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="${onPageFn}(${page - 1})"><i data-lucide="chevron-left" style="width:14px;height:14px"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 1 && i !== totalPages) {
            if (i === page - 3 || i === page + 3) html += '<span class="text-dim" style="padding:0 4px">...</span>';
            continue;
        }
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="${onPageFn}(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="${onPageFn}(${page + 1})"><i data-lucide="chevron-right" style="width:14px;height:14px"></i></button>`;
    html += '</div>';
    return html;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadDashboard() {
    const panel = document.getElementById('tab-dashboard');
    panel.innerHTML = '<p class="text-muted">Yükleniyor...</p>';

    const [overview, expiringData, logsData] = await Promise.all([
        adminJSON(`${API}/analytics/overview`),
        adminJSON(`${API}/subscriptions/expiring?days=14`),
        adminJSON(`${API}/logs?limit=8`)
    ]);

    if (!overview) return;
    state.overview = overview;

    const dist = overview.subscription_distribution || {};
    const totalSubs = Object.values(dist).reduce((s, d) => s + (d.count || 0), 0);

    let html = `
    <div class="stats-grid">
        <div class="admin-stat-card">
            <div class="stat-header">
                <span class="stat-label">Toplam İşletme</span>
                <div class="stat-icon blue"><i data-lucide="building-2" style="width:20px;height:20px"></i></div>
            </div>
            <div class="stat-value">${overview.total_tenants || 0}</div>
        </div>
        <div class="admin-stat-card">
            <div class="stat-header">
                <span class="stat-label">Aktif İşletme</span>
                <div class="stat-icon green"><i data-lucide="check-circle" style="width:20px;height:20px"></i></div>
            </div>
            <div class="stat-value">${overview.active_tenants || 0}</div>
        </div>
        <div class="admin-stat-card">
            <div class="stat-header">
                <span class="stat-label">Aylık Gelir</span>
                <div class="stat-icon gold"><i data-lucide="trending-up" style="width:20px;height:20px"></i></div>
            </div>
            <div class="stat-value currency">${formatCurrency(overview.monthly_revenue)}</div>
        </div>
        <div class="admin-stat-card">
            <div class="stat-header">
                <span class="stat-label">Bugünün Randevuları</span>
                <div class="stat-icon purple"><i data-lucide="calendar-check" style="width:20px;height:20px"></i></div>
            </div>
            <div class="stat-value">${overview.today_appointments || 0}</div>
        </div>
    </div>

    <div class="two-col">
        <div class="section-card">
            <h3>Paket Dağılımı</h3>
            <div style="display:flex;align-items:center;gap:2rem">
                <div class="donut-chart" id="donutChart" style="background:conic-gradient(
                    #3b82f6 0deg ${(dist.standart?.count || 0) / Math.max(totalSubs, 1) * 360}deg,
                    #8b5cf6 ${(dist.standart?.count || 0) / Math.max(totalSubs, 1) * 360}deg ${((dist.standart?.count || 0) + (dist.profesyonel?.count || 0)) / Math.max(totalSubs, 1) * 360}deg,
                    #c9a84c ${((dist.standart?.count || 0) + (dist.profesyonel?.count || 0)) / Math.max(totalSubs, 1) * 360}deg ${((dist.standart?.count || 0) + (dist.profesyonel?.count || 0) + (dist.kurumsal?.count || 0)) / Math.max(totalSubs, 1) * 360}deg,
                    var(--border) ${((dist.standart?.count || 0) + (dist.profesyonel?.count || 0) + (dist.kurumsal?.count || 0)) / Math.max(totalSubs, 1) * 360}deg 360deg
                )">
                    <div class="donut-center">
                        <span class="donut-total">${totalSubs}</span>
                        <span class="donut-label">Toplam</span>
                    </div>
                </div>
                <div class="donut-legend">
                    <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span> Standart: ${dist.standart?.count || 0}</div>
                    <div class="legend-item"><span class="legend-dot" style="background:#8b5cf6"></span> Profesyonel: ${dist.profesyonel?.count || 0}</div>
                    <div class="legend-item"><span class="legend-dot" style="background:#c9a84c"></span> Kurumsal: ${dist.kurumsal?.count || 0}</div>
                    <div class="legend-item"><span class="legend-dot" style="background:var(--border)"></span> Plansız: ${dist.plansiz?.count || 0}</div>
                </div>
            </div>
        </div>

        <div class="section-card">
            <h3>Süresi Dolacak Abonelikler (14 gün)</h3>
            ${(expiringData?.expiring || []).length === 0
                ? '<p class="text-muted" style="font-size:0.8rem">Yakında süresi dolacak abonelik yok.</p>'
                : (expiringData.expiring || []).map(s => `
                    <div class="alert-row">
                        <i data-lucide="alert-triangle" class="alert-icon" style="width:16px;height:16px"></i>
                        <span class="alert-text">${s.tenants?.name || '?'}</span>
                        <span class="alert-date">${formatDate(s.expires_at)} (${daysUntil(s.expires_at)} gün)</span>
                        <button class="btn btn-ghost btn-sm" onclick="openExtendModal('${s.tenant_id}')" style="margin-left:0.5rem"><i data-lucide="plus-circle" style="width:12px;height:12px"></i> Uzat</button>
                    </div>
                `).join('')
            }
        </div>
    </div>

    <div class="section-card">
        <h3>Son Aktiviteler</h3>
        ${(logsData?.logs || []).length === 0
            ? '<p class="text-muted" style="font-size:0.8rem">Henüz aktivite yok.</p>'
            : (logsData.logs || []).map(l => `
                <div class="log-item">
                    <div class="log-icon stat-icon ${logIconColor(l.action)}" style="width:28px;height:28px;min-width:28px">
                        <i data-lucide="${logIcon(l.action)}" style="width:14px;height:14px"></i>
                    </div>
                    <div class="log-content">
                        <div class="log-action">${logLabel(l.action)} ${l.actor_name ? `<span class="text-muted">— ${l.actor_name}</span>` : ''}</div>
                        <div class="log-time">${formatDate(l.created_at)}</div>
                    </div>
                </div>
            `).join('')
        }
    </div>`;

    panel.innerHTML = html;
    lucide.createIcons();
}

function logIcon(action) {
    const map = {
        'admin.login': 'log-in', 'tenant.created': 'plus-circle', 'tenant.updated': 'edit',
        'tenant.password_reset': 'key', 'tenant.enabled': 'toggle-right', 'tenant.disabled': 'toggle-left',
        'subscription.plan_changed': 'refresh-cw', 'subscription.extended': 'clock',
        'payment.recorded': 'banknote', 'payment.updated': 'credit-card', 'plan.updated': 'settings',
        'admin.password_changed': 'lock', 'bulk.extend': 'clock', 'bulk.change_plan': 'refresh-cw',
        'bulk.toggle_status': 'toggle-right', 'payment.reminders_sent': 'send',
        'notification.sent': 'bell', 'ticket.replied': 'message-square', 'ticket.updated': 'edit',
        'branding.updated': 'palette'
    };
    return map[action] || 'activity';
}

function logIconColor(action) {
    if (action.includes('created') || action.includes('enabled')) return 'green';
    if (action.includes('disabled') || action.includes('password')) return 'red';
    if (action.includes('payment')) return 'gold';
    if (action.includes('plan') || action.includes('subscription')) return 'purple';
    return 'blue';
}

function logLabel(action) {
    const map = {
        'admin.login': 'Admin girisi yapildi', 'tenant.created': 'Yeni isletme olusturuldu',
        'tenant.updated': 'Isletme bilgileri guncellendi', 'tenant.password_reset': 'Sifre sifirlandi',
        'tenant.enabled': 'Isletme aktif edildi', 'tenant.disabled': 'Isletme devre disi birakildi',
        'subscription.plan_changed': 'Paket degistirildi', 'subscription.extended': 'Abonelik uzatildi',
        'payment.recorded': 'Odeme kaydedildi', 'payment.updated': 'Odeme guncellendi',
        'plan.updated': 'Paket tanimi guncellendi',
        'admin.password_changed': 'Admin sifresi degisti', 'bulk.extend': 'Toplu sure uzatma',
        'bulk.change_plan': 'Toplu paket degisikligi', 'bulk.toggle_status': 'Toplu durum degisikligi',
        'payment.reminders_sent': 'Odeme hatirlatma gonderildi', 'notification.sent': 'Bildirim gonderildi',
        'ticket.replied': 'Ticket yanitlandi', 'ticket.updated': 'Ticket guncellendi',
        'branding.updated': 'Marka ayarlari guncellendi'
    };
    return map[action] || action;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TENANTS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadTenants(page = 1) {
    const panel = document.getElementById('tab-tenants');
    state.selectedTenants = [];
    const f = state.filters.tenants;
    const params = new URLSearchParams({ page, limit: 15 });
    if (f.search) params.set('search', f.search);
    if (f.status) params.set('status', f.status);
    if (f.plan) params.set('plan', f.plan);
    if (f.created_from) params.set('created_from', f.created_from);
    if (f.created_to) params.set('created_to', f.created_to);

    const data = await adminJSON(`${API}/tenants?${params}`);
    if (!data) return;
    state.tenants = { data: data.tenants, total: data.total, page: data.page, totalPages: data.totalPages };

    let planOptions = state.plans.map(p => `<option value="${p.id}" ${f.plan === p.id ? 'selected' : ''}>${p.name}</option>`).join('');

    let html = `
    ${state.selectedTenants.length > 0 ? `
    <div class="bulk-actions-bar">
        <span class="bulk-count">${state.selectedTenants.length} işletme seçildi</span>
        <button class="btn btn-ghost btn-sm" onclick="openBulkActionModal('extend')"><i data-lucide="clock" style="width:13px;height:13px"></i> Toplu Uzat</button>
        <button class="btn btn-ghost btn-sm" onclick="openBulkActionModal('change-plan')"><i data-lucide="refresh-cw" style="width:13px;height:13px"></i> Toplu Paket</button>
        <button class="btn btn-ghost btn-sm" onclick="openBulkActionModal('toggle-status')"><i data-lucide="toggle-right" style="width:13px;height:13px"></i> Toplu Durum</button>
    </div>` : ''}
    <div class="data-table-wrapper">
        <div class="table-header">
            <h3>İşletmeler (${data.total})</h3>
            <div class="filter-bar">
                <input type="text" placeholder="Ara..." value="${f.search}" onkeyup="if(event.key==='Enter'){state.filters.tenants.search=this.value;loadTenants()}" onblur="state.filters.tenants.search=this.value">
                <select onchange="state.filters.tenants.status=this.value;loadTenants()">
                    <option value="">Tüm Durum</option>
                    <option value="active" ${f.status === 'active' ? 'selected' : ''}>Aktif</option>
                    <option value="inactive" ${f.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                </select>
                <select onchange="state.filters.tenants.plan=this.value;loadTenants()">
                    <option value="">Tüm Paketler</option>
                    ${planOptions}
                </select>
                <input type="date" value="${f.created_from}" title="Kayıt başlangıç" onchange="state.filters.tenants.created_from=this.value;loadTenants()">
                <input type="date" value="${f.created_to}" title="Kayıt bitiş" onchange="state.filters.tenants.created_to=this.value;loadTenants()">
                <button class="btn btn-secondary btn-sm" onclick="exportCSV('tenants')" title="CSV İndir"><i data-lucide="download" style="width:14px;height:14px"></i></button>
                <button class="btn btn-primary btn-sm" onclick="openOnboardingWizard()">
                    <i data-lucide="plus" style="width:14px;height:14px"></i> Yeni İşletme
                </button>
            </div>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th><input type="checkbox" class="row-checkbox" onchange="toggleSelectAll(this.checked)"></th>
                    <th>İşletme</th>
                    <th>Slug</th>
                    <th>Paket</th>
                    <th>Durum</th>
                    <th>Randevu</th>
                    <th>Abonelik Bitiş</th>
                    <th>İşlemler</th>
                </tr>
            </thead>
            <tbody>
                ${data.tenants.length === 0 ? '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:2rem">İşletme bulunamadı.</td></tr>' : ''}
                ${data.tenants.map(t => `
                    <tr>
                        <td><input type="checkbox" class="row-checkbox" value="${t.id}" onchange="toggleSelectTenant('${t.id}', this.checked)" ${state.selectedTenants.includes(t.id) ? 'checked' : ''}></td>
                        <td class="fw-700">${esc(t.name)}</td>
                        <td class="text-muted">${esc(t.slug)}</td>
                        <td>${planBadge(t.current_plan_id)}</td>
                        <td>${statusBadge(t.is_active)}</td>
                        <td>${t.stats?.appointments || 0}</td>
                        <td>
                            ${t.subscription_expires_at
                                ? `<span class="${daysUntil(t.subscription_expires_at) <= 7 ? 'text-red' : daysUntil(t.subscription_expires_at) <= 30 ? 'text-yellow' : ''}">${formatDate(t.subscription_expires_at)}</span>`
                                : '<span class="text-dim">—</span>'
                            }
                        </td>
                        <td>
                            <div style="display:flex;gap:0.3rem">
                                <button class="btn-icon" title="Detay" onclick="openTenantDetail('${t.id}')"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
                                <button class="btn-icon" title="Düzenle" onclick="openEditTenantModal('${t.id}')"><i data-lucide="edit-2" style="width:14px;height:14px"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${renderPagination(data.page, data.totalPages, 'loadTenants')}
    </div>`;

    panel.innerHTML = html;
    lucide.createIcons();
}

function openAddTenantModal() {
    const planOpts = state.plans.map(p => `<option value="${p.id}">${p.name} — ₺${formatCurrency(p.price_monthly)}/ay</option>`).join('');

    openModal('Yeni İşletme Ekle', `
        <div class="form-grid">
            <div class="form-group"><label>İşletme Adı *</label><input type="text" id="newTenantName" placeholder="Salon XYZ"></div>
            <div class="form-group"><label>Slug (URL kodu) *</label><input type="text" id="newTenantSlug" placeholder="salon-xyz"></div>
            <div class="form-group"><label>Telefon</label><input type="text" id="newTenantPhone" placeholder="05XX..."></div>
            <div class="form-group"><label>E-posta</label><input type="email" id="newTenantEmail" placeholder="info@..."></div>
            <div class="form-group full"><label>Adres</label><input type="text" id="newTenantAddress"></div>
            <div class="form-group"><label>WhatsApp No</label><input type="text" id="newTenantWhatsapp" placeholder="+90..."></div>
            <div class="form-group"><label>Şifre *</label><input type="password" id="newTenantPassword" placeholder="Min 4 karakter"></div>
            <div class="form-group"><label>Paket</label><select id="newTenantPlan"><option value="">Plansız</option>${planOpts}</select></div>
            <div class="form-group"><label>Abonelik Süresi (Ay)</label><input type="number" id="newTenantMonths" value="1" min="1" max="24"></div>
            <div class="form-group full"><label>Notlar</label><textarea id="newTenantNotes" rows="2"></textarea></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn btn-primary" onclick="createTenant()">Oluştur</button>
    `);
}

async function createTenant() {
    const body = {
        name: document.getElementById('newTenantName').value,
        slug: document.getElementById('newTenantSlug').value,
        phone: document.getElementById('newTenantPhone').value,
        email: document.getElementById('newTenantEmail').value,
        address: document.getElementById('newTenantAddress').value,
        whatsapp_number: document.getElementById('newTenantWhatsapp').value,
        password: document.getElementById('newTenantPassword').value,
        plan_id: document.getElementById('newTenantPlan').value || undefined,
        subscription_months: document.getElementById('newTenantMonths').value,
        notes: document.getElementById('newTenantNotes').value
    };

    if (!body.name || !body.slug || !body.password) {
        showToast('İsim, slug ve şifre zorunludur.', 'error');
        return;
    }

    const res = await adminFetch(`${API}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata oluştu.', 'error'); return; }

    closeModal();
    showToast(`İşletme oluşturuldu! Kurtarma PIN: ${data.recovery_pin}`);
    loadTenants();
}

async function openTenantDetail(id) {
    const data = await adminJSON(`${API}/tenants/${id}`);
    if (!data) return;
    const t = data.tenant;

    let subsHtml = (data.subscriptions || []).map(s => `
        <tr>
            <td>${s.subscription_plans?.name || '?'}</td>
            <td>${formatDate(s.starts_at)}</td>
            <td>${formatDate(s.expires_at)}</td>
            <td><span class="badge badge-${s.status === 'active' ? 'active' : s.status === 'expired' ? 'expired' : 'cancelled'}">${s.status}</span></td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="text-muted">Abonelik kaydı yok</td></tr>';

    let paymentsHtml = (data.payments || []).map(p => `
        <tr>
            <td>₺${formatCurrency(p.amount)}</td>
            <td>${p.payment_method}</td>
            <td>${paymentBadge(p.status)}</td>
            <td>${formatDate(p.payment_date || p.created_at)}</td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="text-muted">Ödeme kaydı yok</td></tr>';

    openModal(`${t.name} — Detay`, `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Slug</span><span class="detail-value">${esc(t.slug)}</span></div>
            <div class="detail-item"><span class="detail-label">Telefon</span><span class="detail-value">${esc(t.phone || '—')}</span></div>
            <div class="detail-item"><span class="detail-label">E-posta</span><span class="detail-value">${esc(t.email || '—')}</span></div>
            <div class="detail-item"><span class="detail-label">WhatsApp</span><span class="detail-value">${esc(t.whatsapp_number || '—')}</span></div>
            <div class="detail-item"><span class="detail-label">Paket</span><span class="detail-value">${planBadge(t.current_plan_id)}</span></div>
            <div class="detail-item"><span class="detail-label">Durum</span><span class="detail-value">${statusBadge(t.is_active)}</span></div>
            <div class="detail-item"><span class="detail-label">Abonelik Bitiş</span><span class="detail-value">${formatDate(t.subscription_expires_at)}</span></div>
            <div class="detail-item"><span class="detail-label">Kurtarma PIN</span><span class="detail-value text-accent fw-700">${t.recovery_pin || '—'}</span></div>
        </div>

        <div class="stats-grid" style="margin-top:1rem">
            <div class="admin-stat-card"><div class="stat-label">Randevular</div><div class="stat-value" style="font-size:1.3rem">${data.stats.appointments}</div></div>
            <div class="admin-stat-card"><div class="stat-label">Hizmetler</div><div class="stat-value" style="font-size:1.3rem">${data.stats.services}</div></div>
            <div class="admin-stat-card"><div class="stat-label">Personel</div><div class="stat-value" style="font-size:1.3rem">${data.stats.staff}</div></div>
            <div class="admin-stat-card"><div class="stat-label">Müşteriler</div><div class="stat-value" style="font-size:1.3rem">${data.stats.customers}</div></div>
        </div>

        <div class="detail-actions">
            <button class="btn btn-ghost btn-sm" onclick="closeModal();openChangePlanModal('${t.id}')"><i data-lucide="refresh-cw" style="width:13px;height:13px"></i> Paket Değiştir</button>
            <button class="btn btn-ghost btn-sm" onclick="closeModal();openExtendModal('${t.id}')"><i data-lucide="clock" style="width:13px;height:13px"></i> Süre Uzat</button>
            <button class="btn btn-ghost btn-sm" onclick="closeModal();openResetPasswordModal('${t.id}')"><i data-lucide="key" style="width:13px;height:13px"></i> Şifre Sıfırla</button>
            <button class="btn btn-ghost btn-sm" onclick="closeModal();openBrandingModal('${t.id}')"><i data-lucide="palette" style="width:13px;height:13px"></i> Marka</button>
            <button class="btn btn-ghost btn-sm" onclick="closeModal();generateAuditReport('${t.id}')"><i data-lucide="file-text" style="width:13px;height:13px"></i> Rapor</button>
            <button class="btn btn-ghost btn-sm" onclick="toggleTenantStatus('${t.id}')" style="color:${t.is_active ? 'var(--red)' : 'var(--green)'}">
                <i data-lucide="${t.is_active ? 'toggle-left' : 'toggle-right'}" style="width:13px;height:13px"></i> ${t.is_active ? 'Devre Dışı Bırak' : 'Aktif Et'}
            </button>
        </div>

        <h4 style="margin:1.2rem 0 0.5rem;font-size:0.82rem;color:var(--text-muted)">Abonelik Geçmişi</h4>
        <table class="data-table" style="font-size:0.75rem">
            <thead><tr><th>Paket</th><th>Başlangıç</th><th>Bitiş</th><th>Durum</th></tr></thead>
            <tbody>${subsHtml}</tbody>
        </table>

        <h4 style="margin:1.2rem 0 0.5rem;font-size:0.82rem;color:var(--text-muted)">Ödeme Geçmişi</h4>
        <table class="data-table" style="font-size:0.75rem">
            <thead><tr><th>Tutar</th><th>Yöntem</th><th>Durum</th><th>Tarih</th></tr></thead>
            <tbody>${paymentsHtml}</tbody>
        </table>
    `, '', true);
}

async function openEditTenantModal(id) {
    const data = await adminJSON(`${API}/tenants/${id}`);
    if (!data) return;
    const t = data.tenant;

    openModal('İşletme Düzenle', `
        <div class="form-grid">
            <div class="form-group"><label>İşletme Adı</label><input type="text" id="editTenantName" value="${esc(t.name)}"></div>
            <div class="form-group"><label>Slug (URL Kodu)</label><input type="text" id="editTenantSlug" value="${esc(t.slug)}" placeholder="harf, rakam, nokta, tire"></div>
            <div class="form-group"><label>Telefon</label><input type="text" id="editTenantPhone" value="${esc(t.phone || '')}"></div>
            <div class="form-group"><label>E-posta</label><input type="email" id="editTenantEmail" value="${esc(t.email || '')}"></div>
            <div class="form-group"><label>WhatsApp</label><input type="text" id="editTenantWhatsapp" value="${esc(t.whatsapp_number || '')}"></div>
            <div class="form-group full"><label>Adres</label><input type="text" id="editTenantAddress" value="${esc(t.address || '')}"></div>
            <div class="form-group full"><label>Notlar</label><textarea id="editTenantNotes" rows="2">${esc(t.notes || '')}</textarea></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn btn-primary" onclick="updateTenant('${t.id}')">Kaydet</button>
    `);
}

async function updateTenant(id) {
    const body = {
        name: document.getElementById('editTenantName').value,
        slug: document.getElementById('editTenantSlug').value.trim().toLowerCase(),
        phone: document.getElementById('editTenantPhone').value,
        email: document.getElementById('editTenantEmail').value,
        whatsapp_number: document.getElementById('editTenantWhatsapp').value,
        address: document.getElementById('editTenantAddress').value,
        notes: document.getElementById('editTenantNotes').value
    };

    const res = await adminFetch(`${API}/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast('İşletme güncellendi.');
    loadTenants(state.tenants.page);
}

function openChangePlanModal(id) {
    const planOpts = state.plans.map(p => `<option value="${p.id}">${p.name} — ₺${formatCurrency(p.price_monthly)}/ay</option>`).join('');
    openModal('Paket Değiştir', `
        <div class="form-grid single">
            <div class="form-group"><label>Yeni Paket</label><select id="changePlanSelect">${planOpts}</select></div>
            <div class="form-group"><label>Abonelik Süresi (Ay)</label><input type="number" id="changePlanMonths" value="1" min="1"></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn btn-primary" onclick="changePlan('${id}')">Değiştir</button>
    `);
}

async function changePlan(id) {
    const res = await adminFetch(`${API}/tenants/${id}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            plan_id: document.getElementById('changePlanSelect').value,
            subscription_months: document.getElementById('changePlanMonths').value
        })
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast('Paket değiştirildi.');
    loadTenants(state.tenants.page);
}

function openExtendModal(id) {
    openModal('Abonelik Uzat', `
        <div class="form-grid single">
            <div class="form-group"><label>Uzatılacak Gün Sayısı</label><input type="number" id="extendDays" value="30" min="1"></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn btn-primary" onclick="extendSub('${id}')">Uzat</button>
    `);
}

async function extendSub(id) {
    const res = await adminFetch(`${API}/tenants/${id}/extend-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: parseInt(document.getElementById('extendDays').value) })
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast(`Abonelik ${data.new_expires_at} tarihine uzatıldı.`);
    loadTenants(state.tenants.page);
}

function openResetPasswordModal(id) {
    openModal('Şifre Sıfırla', `
        <div class="form-grid single">
            <div class="form-group"><label>Yeni Şifre</label><input type="password" id="resetNewPassword" placeholder="Min 4 karakter"></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn btn-danger" onclick="resetPassword('${id}')">Sıfırla</button>
    `);
}

async function resetPassword(id) {
    const res = await adminFetch(`${API}/tenants/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: document.getElementById('resetNewPassword').value })
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast('Şifre başarıyla sıfırlandı.');
}

async function toggleTenantStatus(id) {
    const res = await adminFetch(`${API}/tenants/${id}/toggle-status`, { method: 'POST' });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast(data.is_active ? 'İşletme aktif edildi.' : 'İşletme devre dışı bırakıldı.', data.is_active ? 'success' : 'warning');
    loadTenants(state.tenants.page);
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUBSCRIPTIONS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadSubscriptions() {
    const panel = document.getElementById('tab-subscriptions');

    const [plansData, subsData, expiringData] = await Promise.all([
        adminJSON(`${API}/plans`),
        adminJSON(`${API}/subscriptions?limit=20`),
        adminJSON(`${API}/subscriptions/expiring?days=30`)
    ]);

    if (!plansData) return;

    const featureLabels = {
        whatsapp_api: 'WhatsApp API', auto_confirm: 'Otomatik Onay', staff_management: 'Personel Yönetimi',
        advanced_reports: 'Gelişmiş Raporlama', priority_support: 'Öncelikli Destek',
        multi_branch: 'Çoklu Şube', custom_domain: 'Özel Domain', custom_integrations: 'Özel Entegrasyonlar',
        corporate_training: 'Kurumsal Eğitim'
    };

    let plansHtml = (plansData.plans || []).map(p => {
        const features = p.features || {};
        const featureList = Object.entries(featureLabels).map(([key, label]) =>
            `<li class="${features[key] ? 'enabled' : ''}">
                <span class="${features[key] ? 'check' : 'cross'}">${features[key] ? '✓' : '✗'}</span> ${label}
            </li>`
        ).join('');

        return `
        <div class="plan-card ${p.slug === 'profesyonel' ? 'highlight' : ''}">
            <div class="plan-name">${p.name}</div>
            <div class="plan-price">₺${formatCurrency(p.price_monthly)} <span>/ ay</span></div>
            <ul class="plan-features">${featureList}</ul>
        </div>`;
    }).join('');

    let subsRows = (subsData?.subscriptions || []).map(s => `
        <tr>
            <td class="fw-700">${s.tenants?.name || '?'}</td>
            <td>${s.subscription_plans?.name || '?'}</td>
            <td>${formatDate(s.starts_at)}</td>
            <td>
                <span class="${daysUntil(s.expires_at) <= 7 ? 'text-red' : ''}">${formatDate(s.expires_at)}</span>
            </td>
            <td><span class="badge badge-${s.status === 'active' ? 'active' : s.status === 'expired' ? 'expired' : 'cancelled'}">${s.status}</span></td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-muted" style="text-align:center">Abonelik bulunamadı.</td></tr>';

    panel.innerHTML = `
        <h3 style="font-size:0.9rem;margin-bottom:1rem;color:var(--text-primary)">Paket Tanımları</h3>
        <div class="plans-grid">${plansHtml}</div>

        ${(expiringData?.expiring || []).length > 0 ? `
        <div class="section-card" style="border-left:3px solid var(--yellow)">
            <h3 style="color:var(--yellow)">⚠ Süresi Dolacak Abonelikler (30 gün)</h3>
            ${expiringData.expiring.map(s => `
                <div class="alert-row">
                    <span class="alert-text">${s.tenants?.name} — ${s.subscription_plans?.name}</span>
                    <span class="alert-date">${formatDate(s.expires_at)} (${daysUntil(s.expires_at)} gün)</span>
                </div>
            `).join('')}
        </div>` : ''}

        <div class="data-table-wrapper">
            <div class="table-header"><h3>Tüm Abonelikler</h3></div>
            <table class="data-table">
                <thead><tr><th>İşletme</th><th>Paket</th><th>Başlangıç</th><th>Bitiş</th><th>Durum</th></tr></thead>
                <tbody>${subsRows}</tbody>
            </table>
        </div>
    `;
    lucide.createIcons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENTS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadPayments(page = 1) {
    const panel = document.getElementById('tab-payments');
    const f = state.filters.payments;
    const params = new URLSearchParams({ page, limit: 20 });
    if (f.status) params.set('status', f.status);
    if (f.from) params.set('from', f.from);
    if (f.to) params.set('to', f.to);

    const [paymentsData, summaryData] = await Promise.all([
        adminJSON(`${API}/payments?${params}`),
        adminJSON(`${API}/payments/summary`)
    ]);

    if (!paymentsData) return;
    state.payments = { data: paymentsData.payments, total: paymentsData.total, page: paymentsData.page, totalPages: paymentsData.totalPages };

    const s = summaryData || {};
    const breakdown = s.monthly_breakdown || [];
    const maxRev = Math.max(...breakdown.map(b => b.revenue), 1);

    let barsHtml = breakdown.map(b => {
        const pct = (b.revenue / maxRev * 100);
        return `<div class="bar-item">
            <span class="bar-value">₺${formatCurrency(b.revenue)}</span>
            <div class="bar-fill" style="height:${Math.max(pct, 3)}%"></div>
            <span class="bar-label">${b.month.slice(5)}</span>
        </div>`;
    }).join('');

    let rows = (paymentsData.payments || []).map(p => `
        <tr>
            <td class="fw-700">${p.tenants?.name || '?'}</td>
            <td>₺${formatCurrency(p.amount)}</td>
            <td>${p.payment_method || 'manual'}</td>
            <td>${paymentBadge(p.status)}</td>
            <td>${formatDate(p.payment_date || p.created_at)}</td>
            <td>
                <div style="display:flex;gap:0.3rem">
                    ${p.status === 'pending' ? `<button class="btn-icon" title="Ödendi" onclick="updatePayment('${p.id}','paid')"><i data-lucide="check" style="width:14px;height:14px;color:var(--green)"></i></button>` : ''}
                    ${p.status === 'pending' ? `<button class="btn-icon" title="Gecikmiş" onclick="updatePayment('${p.id}','overdue')"><i data-lucide="alert-circle" style="width:14px;height:14px;color:var(--red)"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-muted" style="text-align:center">Ödeme bulunamadı.</td></tr>';

    panel.innerHTML = `
        <div class="stats-grid">
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Toplam Gelir</span><div class="stat-icon green"><i data-lucide="trending-up" style="width:20px;height:20px"></i></div></div><div class="stat-value currency">${formatCurrency(s.total_revenue)}</div></div>
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Bu Ay</span><div class="stat-icon gold"><i data-lucide="calendar" style="width:20px;height:20px"></i></div></div><div class="stat-value currency">${formatCurrency(s.monthly_revenue)}</div></div>
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Bekleyen</span><div class="stat-icon orange"><i data-lucide="clock" style="width:20px;height:20px"></i></div></div><div class="stat-value">${s.pending_count || 0}</div></div>
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Gecikmiş</span><div class="stat-icon red"><i data-lucide="alert-triangle" style="width:20px;height:20px"></i></div></div><div class="stat-value">${s.overdue_count || 0}</div></div>
        </div>

        <div class="section-card">
            <h3>Aylık Gelir (Son 6 Ay)</h3>
            <div class="bar-chart">${barsHtml}</div>
        </div>

        <div class="data-table-wrapper">
            <div class="table-header">
                <h3>Ödeme Kayıtları (${paymentsData.total})</h3>
                <div class="filter-bar">
                    <select onchange="state.filters.payments.status=this.value;loadPayments()">
                        <option value="">Tüm Durum</option>
                        <option value="paid" ${f.status === 'paid' ? 'selected' : ''}>Ödendi</option>
                        <option value="pending" ${f.status === 'pending' ? 'selected' : ''}>Bekliyor</option>
                        <option value="overdue" ${f.status === 'overdue' ? 'selected' : ''}>Gecikmiş</option>
                    </select>
                    <button class="btn btn-secondary btn-sm" onclick="exportCSV('payments')" title="CSV İndir"><i data-lucide="download" style="width:14px;height:14px"></i></button>
                    <button class="btn btn-secondary btn-sm" onclick="sendPaymentReminders()"><i data-lucide="send" style="width:14px;height:14px"></i> Hatırlatma</button>
                    <button class="btn btn-primary btn-sm" onclick="openRecordPaymentModal()">
                        <i data-lucide="plus" style="width:14px;height:14px"></i> Ödeme Kaydet
                    </button>
                </div>
            </div>
            <table class="data-table">
                <thead><tr><th>İşletme</th><th>Tutar</th><th>Yöntem</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${renderPagination(paymentsData.page, paymentsData.totalPages, 'loadPayments')}
        </div>
    `;
    lucide.createIcons();
}

function openRecordPaymentModal() {
    openModal('Ödeme Kaydet', `
        <div class="form-grid">
            <div class="form-group full"><label>İşletme Seçin</label><select id="paymentTenantSelect"><option value="">Yükleniyor...</option></select></div>
            <div class="form-group"><label>Tutar (₺)</label><input type="number" id="paymentAmount" placeholder="5000" step="0.01"></div>
            <div class="form-group"><label>Ödeme Yöntemi</label>
                <select id="paymentMethod">
                    <option value="bank_transfer">Banka Havalesi</option>
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="cash">Nakit</option>
                    <option value="manual">Manuel</option>
                </select>
            </div>
            <div class="form-group"><label>Durum</label>
                <select id="paymentStatus">
                    <option value="paid">Ödendi</option>
                    <option value="pending">Bekliyor</option>
                </select>
            </div>
            <div class="form-group"><label>Ödeme Tarihi</label><input type="date" id="paymentDate" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group full"><label>Notlar</label><textarea id="paymentNotes" rows="2"></textarea></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn btn-primary" onclick="recordPayment()">Kaydet</button>
    `);

    // Tenant listesini yukle
    adminJSON(`${API}/tenants?limit=100`).then(data => {
        if (!data) return;
        const sel = document.getElementById('paymentTenantSelect');
        sel.innerHTML = '<option value="">Seçin...</option>' + data.tenants.map(t =>
            `<option value="${t.id}">${t.name} (${t.slug})</option>`
        ).join('');
    });
}

async function recordPayment() {
    const body = {
        tenant_id: document.getElementById('paymentTenantSelect').value,
        amount: document.getElementById('paymentAmount').value,
        payment_method: document.getElementById('paymentMethod').value,
        status: document.getElementById('paymentStatus').value,
        payment_date: document.getElementById('paymentDate').value,
        notes: document.getElementById('paymentNotes').value
    };

    if (!body.tenant_id || !body.amount) {
        showToast('İşletme ve tutar zorunludur.', 'error');
        return;
    }

    const res = await adminFetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast('Ödeme kaydedildi.');
    loadPayments();
}

async function updatePayment(id, status) {
    const res = await adminFetch(`${API}/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    if (!res) return;
    if (!res.ok) { showToast('Hata oluştu.', 'error'); return; }
    showToast(`Ödeme durumu "${status}" olarak güncellendi.`);
    loadPayments(state.payments.page);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadLogs(page = 1) {
    const panel = document.getElementById('tab-logs');
    const f = state.filters.logs;
    const params = new URLSearchParams({ page, limit: 30 });
    if (f.action) params.set('action', f.action);

    const data = await adminJSON(`${API}/logs?${params}`);
    if (!data) return;
    state.logs = { data: data.logs, total: data.total, page: data.page, totalPages: data.totalPages };

    let rows = (data.logs || []).map(l => `
        <tr>
            <td>
                <div class="log-icon stat-icon ${logIconColor(l.action)}" style="width:24px;height:24px;min-width:24px;display:inline-flex">
                    <i data-lucide="${logIcon(l.action)}" style="width:12px;height:12px"></i>
                </div>
                ${logLabel(l.action)}
            </td>
            <td>${l.actor_name || '<span class="text-dim">—</span>'}</td>
            <td class="text-muted">${l.target_type || '—'}</td>
            <td class="text-muted">${l.ip_address || '—'}</td>
            <td>${formatDate(l.created_at)}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-muted" style="text-align:center">Log bulunamadı.</td></tr>';

    panel.innerHTML = `
        <div class="data-table-wrapper">
            <div class="table-header">
                <h3>Aktivite Logları (${data.total})</h3>
                <div class="filter-bar">
                    <select onchange="state.filters.logs.action=this.value;loadLogs()">
                        <option value="">Tüm Aksiyonlar</option>
                        <option value="admin.login">Admin Girişi</option>
                        <option value="tenant.created">İşletme Oluşturma</option>
                        <option value="tenant.updated">İşletme Güncelleme</option>
                        <option value="tenant.password_reset">Şifre Sıfırlama</option>
                        <option value="subscription.plan_changed">Paket Değişikliği</option>
                        <option value="subscription.extended">Abonelik Uzatma</option>
                        <option value="payment.recorded">Ödeme Kaydı</option>
                    </select>
                </div>
            </div>
            <table class="data-table">
                <thead><tr><th>Aksiyon</th><th>Yapan</th><th>Hedef</th><th>IP</th><th>Tarih</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${renderPagination(data.page, data.totalPages, 'loadLogs')}
        </div>
    `;
    lucide.createIcons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANALYTICS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadAnalytics() {
    const panel = document.getElementById('tab-analytics');
    panel.innerHTML = '<p class="text-muted">Yükleniyor...</p>';

    const [overview, growthData, topData, usageData] = await Promise.all([
        adminJSON(`${API}/analytics/overview`),
        adminJSON(`${API}/analytics/growth?months=6`),
        adminJSON(`${API}/analytics/top-tenants?by=appointments&limit=10`),
        adminJSON(`${API}/analytics/usage`)
    ]);

    if (!overview) return;

    const growth = growthData?.growth || [];
    const maxAppts = Math.max(...growth.map(g => g.new_appointments), 1);
    const maxTenants = Math.max(...growth.map(g => g.new_tenants), 1);

    let growthBars = growth.map(g => `
        <div class="bar-item">
            <span class="bar-value">${g.new_appointments}</span>
            <div class="bar-fill" style="height:${Math.max((g.new_appointments / maxAppts * 100), 3)}%"></div>
            <span class="bar-label">${g.month.slice(5)}</span>
        </div>
    `).join('');

    let topRows = (topData?.top_tenants || []).map((t, i) => `
        <tr>
            <td class="fw-700">#${i + 1}</td>
            <td class="fw-700">${esc(t.name)}</td>
            <td class="text-muted">${esc(t.slug)}</td>
            <td class="text-accent fw-700">${t.value}</td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="text-muted" style="text-align:center">Veri yok.</td></tr>';

    panel.innerHTML = `
        <div class="stats-grid">
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Toplam İşletme</span><div class="stat-icon blue"><i data-lucide="building-2" style="width:20px;height:20px"></i></div></div><div class="stat-value">${overview.total_tenants || 0}</div></div>
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Toplam Randevu</span><div class="stat-icon purple"><i data-lucide="calendar" style="width:20px;height:20px"></i></div></div><div class="stat-value">${overview.total_appointments || 0}</div></div>
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Toplam Gelir</span><div class="stat-icon gold"><i data-lucide="banknote" style="width:20px;height:20px"></i></div></div><div class="stat-value currency">${formatCurrency(overview.total_revenue)}</div></div>
            <div class="admin-stat-card"><div class="stat-header"><span class="stat-label">Bugün Randevu</span><div class="stat-icon green"><i data-lucide="calendar-check" style="width:20px;height:20px"></i></div></div><div class="stat-value">${overview.today_appointments || 0}</div></div>
        </div>

        <div class="two-col">
            <div class="section-card">
                <h3>Aylık Büyüme — Randevular</h3>
                <div class="bar-chart">${growthBars}</div>
            </div>
            <div class="section-card">
                <h3>Aylık Büyüme — Yeni İşletmeler</h3>
                <div class="bar-chart">
                    ${growth.map(g => `
                        <div class="bar-item">
                            <span class="bar-value">${g.new_tenants}</span>
                            <div class="bar-fill" style="height:${Math.max((g.new_tenants / maxTenants * 100), 3)}%;background:linear-gradient(to top, #8b5cf6, rgba(139,92,246,0.5))"></div>
                            <span class="bar-label">${g.month.slice(5)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="data-table-wrapper">
            <div class="table-header"><h3>En Aktif İşletmeler (Randevu Sayısına Göre)</h3></div>
            <table class="data-table">
                <thead><tr><th>#</th><th>İşletme</th><th>Slug</th><th>Randevu</th></tr></thead>
                <tbody>${topRows}</tbody>
            </table>
        </div>

        ${usageData?.summary ? `
        <div class="section-card">
            <h3>Özellik Kullanım Oranları</h3>
            <div class="h-bar-chart">
                <div class="h-bar-item">
                    <span class="h-bar-label">Randevu Kullanan</span>
                    <div class="h-bar-track"><div class="h-bar-fill" style="width:${Math.max((usageData.summary.with_appointments / Math.max(usageData.summary.total, 1)) * 100, 3)}%"><span class="h-bar-value">${usageData.summary.with_appointments}/${usageData.summary.total}</span></div></div>
                </div>
                <div class="h-bar-item">
                    <span class="h-bar-label">Hizmet Tanımlı</span>
                    <div class="h-bar-track"><div class="h-bar-fill" style="width:${Math.max((usageData.summary.with_services / Math.max(usageData.summary.total, 1)) * 100, 3)}%;background:linear-gradient(to right, #8b5cf6, rgba(139,92,246,0.5))"><span class="h-bar-value">${usageData.summary.with_services}/${usageData.summary.total}</span></div></div>
                </div>
                <div class="h-bar-item">
                    <span class="h-bar-label">Personel Tanımlı</span>
                    <div class="h-bar-track"><div class="h-bar-fill" style="width:${Math.max((usageData.summary.with_staff / Math.max(usageData.summary.total, 1)) * 100, 3)}%;background:linear-gradient(to right, #22c55e, rgba(34,197,94,0.5))"><span class="h-bar-value">${usageData.summary.with_staff}/${usageData.summary.total}</span></div></div>
                </div>
            </div>
        </div>` : ''}
    `;
    lucide.createIcons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — ADMIN PASSWORD CHANGE
   ═══════════════════════════════════════════════════════════════════════════ */
function openChangePasswordModal() {
    openModal('Şifre Değiştir', `
        <div class="form-grid single">
            <div class="form-group"><label>Mevcut Şifre</label><input type="password" id="cpCurrentPassword"></div>
            <div class="form-group"><label>Yeni Şifre</label><input type="password" id="cpNewPassword" placeholder="Min 6 karakter"></div>
            <div class="form-group"><label>Yeni Şifre (Tekrar)</label><input type="password" id="cpConfirmPassword"></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn btn-primary" onclick="changeAdminPassword()">Değiştir</button>
    `);
}

async function changeAdminPassword() {
    const currentPassword = document.getElementById('cpCurrentPassword').value;
    const newPassword = document.getElementById('cpNewPassword').value;
    const confirm = document.getElementById('cpConfirmPassword').value;

    if (!currentPassword || !newPassword) { showToast('Tüm alanları doldurun.', 'error'); return; }
    if (newPassword.length < 6) { showToast('Yeni şifre en az 6 karakter olmalı.', 'error'); return; }
    if (newPassword !== confirm) { showToast('Şifreler eşleşmiyor.', 'error'); return; }

    const res = await adminFetch(`${API}/profile/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast('Şifre başarıyla değiştirildi.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — BULK OPERATIONS
   ═══════════════════════════════════════════════════════════════════════════ */
function toggleSelectTenant(id, checked) {
    if (checked) {
        if (!state.selectedTenants.includes(id)) state.selectedTenants.push(id);
    } else {
        state.selectedTenants = state.selectedTenants.filter(x => x !== id);
    }
    loadTenants(state.tenants.page);
}

function toggleSelectAll(checked) {
    if (checked) {
        state.selectedTenants = state.tenants.data.map(t => t.id);
    } else {
        state.selectedTenants = [];
    }
    loadTenants(state.tenants.page);
}

function openBulkActionModal(action) {
    if (state.selectedTenants.length === 0) { showToast('Önce işletme seçin.', 'error'); return; }
    const count = state.selectedTenants.length;

    if (action === 'extend') {
        openModal(`Toplu Süre Uzat (${count} işletme)`, `
            <div class="form-grid single">
                <div class="form-group"><label>Uzatılacak Gün</label><input type="number" id="bulkExtendDays" value="30" min="1"></div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary" onclick="executeBulkAction('extend')">Uzat</button>
        `);
    } else if (action === 'change-plan') {
        const opts = state.plans.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        openModal(`Toplu Paket Değiştir (${count} işletme)`, `
            <div class="form-grid single">
                <div class="form-group"><label>Yeni Paket</label><select id="bulkPlanId">${opts}</select></div>
                <div class="form-group"><label>Abonelik Süresi (Ay)</label><input type="number" id="bulkPlanMonths" value="1" min="1"></div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary" onclick="executeBulkAction('change-plan')">Değiştir</button>
        `);
    } else if (action === 'toggle-status') {
        openModal(`Toplu Durum Değiştir (${count} işletme)`, `
            <div class="form-grid single">
                <div class="form-group"><label>Yeni Durum</label>
                    <select id="bulkIsActive">
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                    </select>
                </div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary" onclick="executeBulkAction('toggle-status')">Uygula</button>
        `);
    }
}

async function executeBulkAction(action) {
    let body = { tenant_ids: state.selectedTenants };

    if (action === 'extend') {
        body.days = parseInt(document.getElementById('bulkExtendDays').value);
    } else if (action === 'change-plan') {
        body.plan_id = document.getElementById('bulkPlanId').value;
        body.subscription_months = parseInt(document.getElementById('bulkPlanMonths').value);
    } else if (action === 'toggle-status') {
        body.is_active = document.getElementById('bulkIsActive').value === 'true';
    }

    const res = await adminFetch(`${API}/bulk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    state.selectedTenants = [];
    showToast(`Toplu işlem tamamlandı: ${data.processed || 0} işletme güncellendi.`);
    loadTenants(state.tenants.page);
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — CSV EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */
async function exportCSV(type) {
    let url = `${API}/export/${type}?format=csv`;
    if (type === 'payments') {
        const f = state.filters.payments;
        if (f.from) url += `&from=${f.from}`;
        if (f.to) url += `&to=${f.to}`;
    }

    const res = await adminFetch(url);
    if (!res) return;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('CSV dosyası indiriliyor.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — PAYMENT REMINDERS
   ═══════════════════════════════════════════════════════════════════════════ */
async function sendPaymentReminders() {
    if (!confirm('Süresi dolacak ve bekleyen ödemelere WhatsApp hatırlatma gönderilecek. Devam?')) return;

    const res = await adminFetch(`${API}/payments/send-reminders`, { method: 'POST' });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    showToast(`${data.sent_count} hatırlatma gönderildi.`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — AUDIT REPORT PDF
   ═══════════════════════════════════════════════════════════════════════════ */
async function generateAuditReport(tenantId) {
    showToast('Rapor oluşturuluyor...');

    const data = await adminJSON(`${API}/export/report?tenant_id=${tenantId}`);
    if (!data) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Denetim Raporu', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Isletme: ${data.tenant?.name || '?'}`, 14, 30);
    doc.text(`Slug: ${data.tenant?.slug || '?'}`, 14, 36);
    doc.text(`Olusturma: ${new Date().toLocaleDateString('tr-TR')}`, 14, 42);
    doc.text(`Durum: ${data.tenant?.is_active ? 'Aktif' : 'Pasif'}`, 14, 48);

    // Stats
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Istatistikler', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Randevu: ${data.stats?.appointments || 0}`, 14, 68);
    doc.text(`Hizmet: ${data.stats?.services || 0}`, 14, 74);
    doc.text(`Personel: ${data.stats?.staff || 0}`, 14, 80);
    doc.text(`Musteri: ${data.stats?.customers || 0}`, 14, 86);

    // Payments table
    if (data.payments && data.payments.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Odeme Gecmisi', 14, 100);

        doc.autoTable({
            startY: 106,
            head: [['Tutar', 'Yontem', 'Durum', 'Tarih']],
            body: data.payments.map(p => [
                `${p.amount} TL`,
                p.payment_method || 'manual',
                p.status,
                p.payment_date || p.created_at?.substring(0, 10) || '-'
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [201, 168, 76] }
        });
    }

    doc.save(`rapor_${data.tenant?.slug || 'tenant'}_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('PDF rapor indirildi.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — ONBOARDING WIZARD
   ═══════════════════════════════════════════════════════════════════════════ */
let wizardStep = 1;
let wizardData = {};

function openOnboardingWizard() {
    wizardStep = 1;
    wizardData = { plan_id: '', subscription_months: 1, brand_logo_url: '', brand_primary_color: '#c9a84c', brand_secondary_color: '#111827' };
    renderWizard();
}

function renderWizard() {
    const steps = ['Bilgiler', 'Paket', 'Hesap', 'Marka', 'Ozet'];
    const stepsHtml = steps.map((s, i) => {
        const num = i + 1;
        const cls = num < wizardStep ? 'completed' : num === wizardStep ? 'active' : '';
        const connector = i < steps.length - 1 ? `<div class="wizard-connector ${num < wizardStep ? 'completed' : ''}"></div>` : '';
        return `<div class="wizard-step ${cls}"><span class="step-num">${num < wizardStep ? '✓' : num}</span> ${s}</div>${connector}`;
    }).join('');

    let bodyHtml = '';
    if (wizardStep === 1) {
        bodyHtml = `
            <div class="form-grid">
                <div class="form-group"><label>Isletme Adi *</label><input type="text" id="wizName" value="${esc(wizardData.name || '')}"></div>
                <div class="form-group"><label>Slug (URL Kodu) *</label><input type="text" id="wizSlug" value="${esc(wizardData.slug || '')}" placeholder="salon-xyz"></div>
                <div class="form-group"><label>Telefon</label><input type="text" id="wizPhone" value="${esc(wizardData.phone || '')}"></div>
                <div class="form-group"><label>E-posta</label><input type="email" id="wizEmail" value="${esc(wizardData.email || '')}"></div>
                <div class="form-group full"><label>Adres</label><input type="text" id="wizAddress" value="${esc(wizardData.address || '')}"></div>
                <div class="form-group"><label>WhatsApp</label><input type="text" id="wizWhatsapp" value="${esc(wizardData.whatsapp_number || '')}" placeholder="+90..."></div>
            </div>`;
    } else if (wizardStep === 2) {
        bodyHtml = `<div class="plan-select-grid">${state.plans.map(p => `
            <div class="plan-select-card ${wizardData.plan_id === p.id ? 'selected' : ''}" onclick="wizardData.plan_id='${p.id}';renderWizard()">
                <div class="plan-select-name">${p.name}</div>
                <div class="plan-select-price">${formatCurrency(p.price_monthly)} <span>/ ay</span></div>
            </div>`).join('')}
            <div class="plan-select-card ${!wizardData.plan_id ? 'selected' : ''}" onclick="wizardData.plan_id='';renderWizard()">
                <div class="plan-select-name">Plansiz</div>
                <div class="plan-select-price">Ucretsiz</div>
            </div>
        </div>`;
    } else if (wizardStep === 3) {
        bodyHtml = `
            <div class="form-grid single">
                <div class="form-group"><label>Sifre *</label><input type="password" id="wizPassword" value="${esc(wizardData.password || '')}" placeholder="Min 4 karakter"></div>
                <div class="form-group"><label>Abonelik Suresi (Ay)</label><input type="number" id="wizMonths" value="${wizardData.subscription_months || 1}" min="1" max="24"></div>
                <div class="form-group full"><label>Notlar</label><textarea id="wizNotes" rows="2">${esc(wizardData.notes || '')}</textarea></div>
            </div>`;
    } else if (wizardStep === 4) {
        bodyHtml = `
            <div class="form-grid single">
                <div class="form-group"><label>Logo URL (opsiyonel)</label><input type="text" id="wizLogoUrl" value="${esc(wizardData.brand_logo_url || '')}" placeholder="https://..."></div>
                <div class="form-group"><label>Ana Renk</label>
                    <div class="color-picker-group">
                        <input type="color" id="wizPrimaryColor" value="${wizardData.brand_primary_color || '#c9a84c'}" onchange="document.getElementById('wizPrimaryHex').textContent=this.value">
                        <span class="color-hex" id="wizPrimaryHex">${wizardData.brand_primary_color || '#c9a84c'}</span>
                    </div>
                </div>
                <div class="form-group"><label>Ikincil Renk</label>
                    <div class="color-picker-group">
                        <input type="color" id="wizSecondaryColor" value="${wizardData.brand_secondary_color || '#111827'}" onchange="document.getElementById('wizSecondaryHex').textContent=this.value">
                        <span class="color-hex" id="wizSecondaryHex">${wizardData.brand_secondary_color || '#111827'}</span>
                    </div>
                </div>
            </div>
            <p class="text-muted" style="font-size:0.75rem;margin-top:1rem">Bu adim opsiyoneldir. Bos birakabilirsiniz.</p>`;
    } else if (wizardStep === 5) {
        const planName = wizardData.plan_id ? getPlanName(wizardData.plan_id) : 'Plansiz';
        bodyHtml = `
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Isletme</span><span class="detail-value">${esc(wizardData.name || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">Slug</span><span class="detail-value">${esc(wizardData.slug || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">Telefon</span><span class="detail-value">${esc(wizardData.phone || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">E-posta</span><span class="detail-value">${esc(wizardData.email || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">Paket</span><span class="detail-value">${planName}</span></div>
                <div class="detail-item"><span class="detail-label">Sure</span><span class="detail-value">${wizardData.subscription_months} ay</span></div>
            </div>`;
    }

    const footerHtml = `
        <div class="wizard-footer">
            <button class="btn btn-secondary" onclick="${wizardStep === 1 ? 'closeModal()' : 'wizardPrev()'}">${wizardStep === 1 ? 'Iptal' : 'Geri'}</button>
            <button class="btn btn-primary" onclick="${wizardStep === 5 ? 'wizardSubmit()' : 'wizardNext()'}">${wizardStep === 5 ? 'Olustur' : 'Ileri'}</button>
        </div>`;

    openModal('Yeni Isletme Ekle', `<div class="wizard-steps">${stepsHtml}</div><div class="wizard-body">${bodyHtml}</div>`, footerHtml);
}

function wizardSaveStep() {
    if (wizardStep === 1) {
        wizardData.name = document.getElementById('wizName')?.value || '';
        wizardData.slug = document.getElementById('wizSlug')?.value || '';
        wizardData.phone = document.getElementById('wizPhone')?.value || '';
        wizardData.email = document.getElementById('wizEmail')?.value || '';
        wizardData.address = document.getElementById('wizAddress')?.value || '';
        wizardData.whatsapp_number = document.getElementById('wizWhatsapp')?.value || '';
    } else if (wizardStep === 3) {
        wizardData.password = document.getElementById('wizPassword')?.value || '';
        wizardData.subscription_months = parseInt(document.getElementById('wizMonths')?.value) || 1;
        wizardData.notes = document.getElementById('wizNotes')?.value || '';
    } else if (wizardStep === 4) {
        wizardData.brand_logo_url = document.getElementById('wizLogoUrl')?.value || '';
        wizardData.brand_primary_color = document.getElementById('wizPrimaryColor')?.value || '#c9a84c';
        wizardData.brand_secondary_color = document.getElementById('wizSecondaryColor')?.value || '#111827';
    }
}

function wizardNext() {
    wizardSaveStep();
    if (wizardStep === 1 && (!wizardData.name || !wizardData.slug)) {
        showToast('Isim ve slug zorunludur.', 'error'); return;
    }
    if (wizardStep === 3 && !wizardData.password) {
        showToast('Sifre zorunludur.', 'error'); return;
    }
    wizardStep++;
    renderWizard();
}

function wizardPrev() {
    wizardSaveStep();
    wizardStep--;
    renderWizard();
}

async function wizardSubmit() {
    const body = {
        name: wizardData.name,
        slug: wizardData.slug,
        phone: wizardData.phone,
        email: wizardData.email,
        address: wizardData.address,
        whatsapp_number: wizardData.whatsapp_number,
        password: wizardData.password,
        plan_id: wizardData.plan_id || undefined,
        subscription_months: wizardData.subscription_months,
        notes: wizardData.notes
    };

    const res = await adminFetch(`${API}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }

    // Branding varsa kaydet
    if (wizardData.brand_logo_url || wizardData.brand_primary_color !== '#c9a84c') {
        await adminFetch(`${API}/branding/${data.tenant.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                brand_logo_url: wizardData.brand_logo_url,
                brand_primary_color: wizardData.brand_primary_color,
                brand_secondary_color: wizardData.brand_secondary_color
            })
        });
    }

    closeModal();
    showToast(`Isletme olusturuldu! Kurtarma PIN: ${data.recovery_pin}`);
    loadTenants();
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — BRANDING (WHITE-LABEL)
   ═══════════════════════════════════════════════════════════════════════════ */
async function openBrandingModal(tenantId) {
    const data = await adminJSON(`${API}/branding/${tenantId}`);
    if (!data) return;
    const b = data.branding || {};

    openModal('Marka Ayarlari', `
        <div class="form-grid single">
            <div class="form-group"><label>Logo URL</label><input type="text" id="brandLogoUrl" value="${esc(b.brand_logo_url || '')}" placeholder="https://..."></div>
            <div class="form-group"><label>Ana Renk</label>
                <div class="color-picker-group">
                    <input type="color" id="brandPrimaryColor" value="${b.brand_primary_color || '#c9a84c'}" onchange="document.getElementById('brandPrimaryHex').textContent=this.value">
                    <span class="color-hex" id="brandPrimaryHex">${b.brand_primary_color || '#c9a84c'}</span>
                </div>
            </div>
            <div class="form-group"><label>Ikincil Renk</label>
                <div class="color-picker-group">
                    <input type="color" id="brandSecondaryColor" value="${b.brand_secondary_color || '#111827'}" onchange="document.getElementById('brandSecondaryHex').textContent=this.value">
                    <span class="color-hex" id="brandSecondaryHex">${b.brand_secondary_color || '#111827'}</span>
                </div>
            </div>
        </div>
        ${b.brand_logo_url ? `<div style="margin-top:1rem;text-align:center"><img src="${esc(b.brand_logo_url)}" style="max-height:60px;border-radius:8px" onerror="this.style.display='none'"></div>` : ''}
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
        <button class="btn btn-primary" onclick="saveBranding('${tenantId}')">Kaydet</button>
    `);
}

async function saveBranding(tenantId) {
    const res = await adminFetch(`${API}/branding/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            brand_logo_url: document.getElementById('brandLogoUrl').value,
            brand_primary_color: document.getElementById('brandPrimaryColor').value,
            brand_secondary_color: document.getElementById('brandSecondaryColor').value
        })
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast('Marka ayarlari kaydedildi.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — TICKETS (SUPPORT SYSTEM)
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadTickets(page = 1) {
    const panel = document.getElementById('tab-tickets');
    const f = state.filters.tickets;
    const params = new URLSearchParams({ page, limit: 20 });
    if (f.status) params.set('status', f.status);
    if (f.priority) params.set('priority', f.priority);

    const data = await adminJSON(`${API}/tickets?${params}`);
    if (!data) return;
    state.tickets = { data: data.tickets || [], total: data.total, page: data.page, totalPages: data.totalPages };

    const priorityLabels = { low: 'Dusuk', normal: 'Normal', high: 'Yuksek', urgent: 'Acil' };
    const statusLabels = { open: 'Acik', in_progress: 'Islemde', resolved: 'Cozuldu', closed: 'Kapali' };

    let rows = (data.tickets || []).map(t => `
        <tr style="cursor:pointer">
            <td class="fw-700" onclick="openTicketDetail('${t.id}')">${esc(t.subject)}</td>
            <td onclick="openTicketDetail('${t.id}')">${esc(t.tenants?.name || '?')}</td>
            <td onclick="openTicketDetail('${t.id}')"><span class="badge badge-${t.status}">${statusLabels[t.status] || t.status}</span></td>
            <td onclick="openTicketDetail('${t.id}')"><span class="badge badge-${t.priority}">${priorityLabels[t.priority] || t.priority}</span></td>
            <td onclick="openTicketDetail('${t.id}')">${formatDate(t.created_at)}</td>
            <td onclick="openTicketDetail('${t.id}')">${formatDate(t.updated_at)}</td>
            <td><button class="btn btn-sm" style="background:var(--red);color:#fff;font-size:0.7rem;padding:0.2rem 0.5rem" onclick="deleteTicketAdmin('${t.id}')">Sil</button></td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:2rem">Destek talebi bulunamadi.</td></tr>';

    panel.innerHTML = `
        <div class="data-table-wrapper">
            <div class="table-header">
                <h3>Destek Talepleri (${data.total || 0})</h3>
                <div class="filter-bar">
                    <select onchange="state.filters.tickets.status=this.value;loadTickets()">
                        <option value="">Tum Durum</option>
                        <option value="open" ${f.status === 'open' ? 'selected' : ''}>Acik</option>
                        <option value="in_progress" ${f.status === 'in_progress' ? 'selected' : ''}>Islemde</option>
                        <option value="resolved" ${f.status === 'resolved' ? 'selected' : ''}>Cozuldu</option>
                        <option value="closed" ${f.status === 'closed' ? 'selected' : ''}>Kapali</option>
                    </select>
                    <select onchange="state.filters.tickets.priority=this.value;loadTickets()">
                        <option value="">Tum Oncelik</option>
                        <option value="low" ${f.priority === 'low' ? 'selected' : ''}>Dusuk</option>
                        <option value="normal" ${f.priority === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="high" ${f.priority === 'high' ? 'selected' : ''}>Yuksek</option>
                        <option value="urgent" ${f.priority === 'urgent' ? 'selected' : ''}>Acil</option>
                    </select>
                </div>
            </div>
            <table class="data-table">
                <thead><tr><th>Konu</th><th>Isletme</th><th>Durum</th><th>Oncelik</th><th>Olusturma</th><th>Guncelleme</th><th></th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${renderPagination(data.page || 1, data.totalPages || 1, 'loadTickets')}
        </div>
    `;
    lucide.createIcons();
}

async function openTicketDetail(id) {
    const data = await adminJSON(`${API}/tickets/${id}`);
    if (!data) return;
    const t = data.ticket;
    const msgs = data.messages || [];

    const priorityLabels = { low: 'Dusuk', normal: 'Normal', high: 'Yuksek', urgent: 'Acil' };
    const statusLabels = { open: 'Acik', in_progress: 'Islemde', resolved: 'Cozuldu', closed: 'Kapali' };

    const chatHtml = msgs.map(m => `
        <div class="chat-message ${m.sender_type}">
            <div class="chat-sender">${esc(m.sender_name || m.sender_type)}</div>
            <div>${esc(m.message)}</div>
            <div class="chat-time">${formatDate(m.created_at)}</div>
        </div>
    `).join('') || '<p class="text-muted" style="font-size:0.8rem;text-align:center">Henuz mesaj yok.</p>';

    openModal(`Ticket: ${esc(t.subject)}`, `
        <div class="detail-grid" style="margin-bottom:1rem">
            <div class="detail-item"><span class="detail-label">Isletme</span><span class="detail-value">${esc(t.tenants?.name || '?')}</span></div>
            <div class="detail-item"><span class="detail-label">Durum</span><span class="detail-value"><span class="badge badge-${t.status}">${statusLabels[t.status] || t.status}</span></span></div>
            <div class="detail-item"><span class="detail-label">Oncelik</span><span class="detail-value"><span class="badge badge-${t.priority}">${priorityLabels[t.priority] || t.priority}</span></span></div>
            <div class="detail-item"><span class="detail-label">Tarih</span><span class="detail-value">${formatDate(t.created_at)}</span></div>
        </div>

        <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
            <select id="ticketStatus" style="font-size:0.75rem;padding:0.3rem 0.5rem;background:var(--bg-mid);border:1px solid var(--border);border-radius:6px;color:var(--text-primary)">
                <option value="open" ${t.status === 'open' ? 'selected' : ''}>Acik</option>
                <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>Islemde</option>
                <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>Cozuldu</option>
                <option value="closed" ${t.status === 'closed' ? 'selected' : ''}>Kapali</option>
            </select>
            <select id="ticketPriority" style="font-size:0.75rem;padding:0.3rem 0.5rem;background:var(--bg-mid);border:1px solid var(--border);border-radius:6px;color:var(--text-primary)">
                <option value="low" ${t.priority === 'low' ? 'selected' : ''}>Dusuk</option>
                <option value="normal" ${t.priority === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="high" ${t.priority === 'high' ? 'selected' : ''}>Yuksek</option>
                <option value="urgent" ${t.priority === 'urgent' ? 'selected' : ''}>Acil</option>
            </select>
            <button class="btn btn-ghost btn-sm" onclick="updateTicketStatus('${t.id}')">Guncelle</button>
            <button class="btn btn-sm" style="background:var(--red);color:#fff;font-size:0.75rem" onclick="deleteTicketAdmin('${t.id}')">Sil</button>
        </div>

        <div class="chat-container">${chatHtml}</div>

        <div class="chat-input">
            <textarea id="ticketReply" placeholder="Yanitinizi yazin..." rows="2"></textarea>
            <button class="btn btn-primary" onclick="replyToTicket('${t.id}')"><i data-lucide="send" style="width:14px;height:14px"></i></button>
        </div>
    `, '', true);
}

async function updateTicketStatus(id) {
    const status = document.getElementById('ticketStatus').value;
    const priority = document.getElementById('ticketPriority').value;

    const res = await adminFetch(`${API}/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority })
    });
    if (!res) return;
    if (!res.ok) { showToast('Hata', 'error'); return; }
    showToast('Ticket guncellendi.');
    openTicketDetail(id);
}

async function replyToTicket(id) {
    const message = document.getElementById('ticketReply').value.trim();
    if (!message) { showToast('Mesaj bos olamaz.', 'error'); return; }

    const res = await adminFetch(`${API}/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
    if (!res) return;
    if (!res.ok) { showToast('Hata', 'error'); return; }
    showToast('Yanit gonderildi.');
    openTicketDetail(id);
}

async function deleteTicketAdmin(id) {
    if (!confirm('Bu destek talebini silmek istediginize emin misiniz?')) return;
    const res = await adminFetch(`${API}/tickets/${id}`, { method: 'DELETE' });
    if (!res) return;
    if (!res.ok) { showToast('Silinemedi.', 'error'); return; }
    showToast('Ticket silindi.');
    closeModal();
    loadTickets();
}

/* ═══════════════════════════════════════════════════════════════════════════
   V2 — NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadNotifications() {
    const panel = document.getElementById('tab-notifications');

    const data = await adminJSON(`${API}/notifications`);
    if (!data) return;
    state.notifications = { data: data.notifications || [], total: (data.notifications || []).length };

    const notifsHtml = (data.notifications || []).map(n => `
        <div class="notif-card">
            <div class="notif-title">${esc(n.title)}</div>
            <div class="notif-body">${esc(n.message)}</div>
            <div class="notif-meta">
                <span>Hedef: ${n.target_type === 'all' ? 'Tumu' : n.target_type === 'plan' ? 'Pakete gore' : 'Spesifik'}</span>
                <span>Kanal: ${n.sent_via || 'panel'}</span>
                <span>${formatDate(n.created_at)}</span>
            </div>
        </div>
    `).join('') || '<div class="empty-state"><p>Henuz bildirim gonderilmemis.</p></div>';

    panel.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <h3 style="font-size:0.9rem;font-weight:700;color:var(--text-primary)">Gonderilen Bildirimler (${state.notifications.total})</h3>
            <button class="btn btn-primary btn-sm" onclick="openSendNotificationModal()">
                <i data-lucide="send" style="width:14px;height:14px"></i> Yeni Bildirim
            </button>
        </div>
        ${notifsHtml}
    `;
    lucide.createIcons();
}

function openSendNotificationModal() {
    const planOpts = state.plans.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    openModal('Bildirim Gonder', `
        <div class="form-grid single">
            <div class="form-group"><label>Baslik *</label><input type="text" id="notifTitle" placeholder="Bildirim basligi"></div>
            <div class="form-group"><label>Mesaj *</label><textarea id="notifMessage" rows="3" placeholder="Bildirim icerigi..."></textarea></div>
            <div class="form-group"><label>Hedef</label>
                <select id="notifTarget" onchange="toggleNotifTarget()">
                    <option value="all">Tum Isletmeler</option>
                    <option value="plan">Pakete Gore</option>
                </select>
            </div>
            <div class="form-group" id="notifPlanGroup" style="display:none">
                <label>Hedef Paket</label>
                <select id="notifTargetPlan">${planOpts}</select>
            </div>
            <div class="form-group"><label>Gonderim Kanali</label>
                <select id="notifVia">
                    <option value="panel">Sadece Panel</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="both">Panel + WhatsApp</option>
                </select>
            </div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModal()">Iptal</button>
        <button class="btn btn-primary" onclick="sendNotification()">Gonder</button>
    `);
}

function toggleNotifTarget() {
    const target = document.getElementById('notifTarget').value;
    document.getElementById('notifPlanGroup').style.display = target === 'plan' ? '' : 'none';
}

async function sendNotification() {
    const title = document.getElementById('notifTitle').value.trim();
    const message = document.getElementById('notifMessage').value.trim();
    const target_type = document.getElementById('notifTarget').value;
    const sent_via = document.getElementById('notifVia').value;

    if (!title || !message) { showToast('Baslik ve mesaj zorunludur.', 'error'); return; }

    const body = { title, message, target_type, sent_via };
    if (target_type === 'plan') {
        body.target_plan_id = document.getElementById('notifTargetPlan').value;
    }

    const res = await adminFetch(`${API}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Hata', 'error'); return; }
    closeModal();
    showToast(`Bildirim gonderildi. ${data.whatsapp_sent ? `WhatsApp: ${data.whatsapp_sent} kisi` : ''}`);
    loadNotifications();
}

// ── XSS Prevention ───────────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
