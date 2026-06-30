import type { VercelRequest, VercelResponse } from '@vercel/node';

// Revokes the refresh token server-side (GoTrue's logout endpoint) so
// signing out actually invalidates the session, not just the local copy.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!accessToken) {
    res.status(401).json({ error: 'Missing Authorization bearer token' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server is missing SUPABASE_URL / SUPABASE_ANON_KEY' });
    return;
  }

  await fetch(`${supabaseUrl}/auth/v1/logout?scope=global`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});

  res.status(204).end();
}
