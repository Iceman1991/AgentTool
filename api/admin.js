import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify caller is authenticated
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Nicht authentifiziert' });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Ungültiges Token' });

  // Optional admin email restriction
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const action = req.query.action;

  // ── List active users ────────────────────────────────────────────────────
  if (req.method === 'GET' && action === 'users') {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) return res.status(500).json({ error: error.message });

    // Get trashed user IDs to exclude them
    const { data: trashRows } = await supabaseAdmin
      .from('user_trash')
      .select('user_id');
    const trashedIds = new Set((trashRows ?? []).map(r => r.user_id));

    const activeUsers = data.users.filter(u => !trashedIds.has(u.id));
    return res.status(200).json({ users: activeUsers });
  }

  // ── List trashed users (with auto-purge of >30d entries) ────────────────
  if (req.method === 'GET' && action === 'trash') {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Auto-purge expired entries
    const { data: expired } = await supabaseAdmin
      .from('user_trash')
      .select('user_id')
      .lt('deleted_at', thirtyDaysAgo);

    if (expired?.length) {
      for (const row of expired) {
        await supabaseAdmin.auth.admin.deleteUser(row.user_id).catch(() => {});
        await supabaseAdmin.from('user_trash').delete().eq('user_id', row.user_id);
      }
    }

    const { data: trashRows, error } = await supabaseAdmin
      .from('user_trash')
      .select('*')
      .order('deleted_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: trashRows ?? [] });
  }

  // ── Move user to trash (ban + add to user_trash) ─────────────────────────
  if (req.method === 'POST' && action === 'trash-user') {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId fehlt' });
    if (userId === user.id) return res.status(400).json({ error: 'Du kannst dich nicht selbst löschen' });

    // Get user info before banning
    const { data: targetData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const targetUser = targetData?.user;

    // Ban the user (effectively disable login)
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // ~100 years
    });
    if (banError) return res.status(500).json({ error: banError.message });

    // Record in trash
    const { error: insertError } = await supabaseAdmin
      .from('user_trash')
      .upsert({
        user_id: userId,
        email: targetUser?.email ?? null,
        created_at_original: targetUser?.created_at ?? null,
        deleted_at: Date.now(),
        deleted_by_id: user.id,
      }, { onConflict: 'user_id' });
    if (insertError) return res.status(500).json({ error: insertError.message });

    return res.status(200).json({ success: true });
  }

  // ── Restore user from trash (unban + remove from user_trash) ─────────────
  if (req.method === 'POST' && action === 'restore-user') {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId fehlt' });

    const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });
    if (unbanError) return res.status(500).json({ error: unbanError.message });

    await supabaseAdmin.from('user_trash').delete().eq('user_id', userId);
    return res.status(200).json({ success: true });
  }

  // ── Permanently delete user ───────────────────────────────────────────────
  if (req.method === 'DELETE' && action === 'purge-user') {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId fehlt' });
    if (userId === user.id) return res.status(400).json({ error: 'Du kannst dich nicht selbst löschen' });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return res.status(500).json({ error: error.message });
    await supabaseAdmin.from('user_trash').delete().eq('user_id', userId);
    return res.status(200).json({ success: true });
  }

  // ── Legacy: direct permanent delete (kept for compatibility) ─────────────
  if (req.method === 'DELETE' && action === 'delete') {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId fehlt' });
    if (userId === user.id) return res.status(400).json({ error: 'Du kannst dich nicht selbst löschen' });
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Ungültige Aktion' });
}
