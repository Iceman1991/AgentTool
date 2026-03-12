import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
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

  if (req.method === 'GET' && action === 'users') {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data.users });
  }

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
