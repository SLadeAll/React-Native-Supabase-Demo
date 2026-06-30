import type { VercelRequest, VercelResponse } from '@vercel/node';

// Forwards a refresh token to Supabase Auth server-side, same rationale as
// login.ts — the client never talks to Supabase directly.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server is missing SUPABASE_URL / SUPABASE_ANON_KEY' });
    return;
  }

  const gotrueResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await gotrueResponse.json();

  if (!gotrueResponse.ok) {
    res.status(gotrueResponse.status).json({ error: data.error_description ?? data.msg ?? 'Session refresh failed' });
    return;
  }

  res.status(200).json({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    user: { id: data.user.id, email: data.user.email },
  });
}
