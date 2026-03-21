const supabase = require('./supabase');

async function logActivity({ actorType, actorId, actorName, action, targetType, targetId, details, ipAddress }) {
    try {
        await supabase.from('activity_logs').insert([{
            actor_type: actorType,
            actor_id: actorId,
            actor_name: actorName,
            action,
            target_type: targetType,
            target_id: targetId,
            details: details || {},
            ip_address: ipAddress || null
        }]);
    } catch (err) {
        console.error('[ActivityLog] Loglama hatası:', err.message);
    }
}

module.exports = { logActivity };
