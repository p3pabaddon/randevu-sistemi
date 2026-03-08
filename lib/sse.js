// ── SSE (Server-Sent Events) broadcast sistemi ───────────────────────────────
// Her tenant için bağlı istemcileri tutar
const clients = new Map(); // tenantId → Set<res>

/**
 * Tenant'ın tüm bağlı istemcilerine olay yayar
 */
function broadcast(tenantId, event, data) {
    const group = clients.get(tenantId);
    if (!group) return;
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of group) {
        try { res.write(msg); } catch (_) { group.delete(res); }
    }
}

/**
 * Express route handler — GET /api/sse/:tenantId
 */
function sseHandler(req, res) {
    const { tenantId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx için
    res.flushHeaders();

    // Bağlantı sağlıklı mı diye 25 saniyede bir ping at
    const ping = setInterval(() => {
        try { res.write(': ping\n\n'); } catch (_) { clearInterval(ping); }
    }, 25_000);

    // Gruba ekle
    if (!clients.has(tenantId)) clients.set(tenantId, new Set());
    clients.get(tenantId).add(res);
    console.log(`[SSE] Bağlandı → tenant:${tenantId} | Aktif: ${clients.get(tenantId).size}`);

    // Bağlantı kopunca temizle
    req.on('close', () => {
        clearInterval(ping);
        clients.get(tenantId)?.delete(res);
        console.log(`[SSE] Ayrıldı → tenant:${tenantId}`);
    });
}

module.exports = { sseHandler, broadcast };
