import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// This route never uses the service role key. It forwards the caller's own
// Supabase access token, so every query below is evaluated under Postgres
// RLS as that specific user — the API can't see more than the DB allows.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
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

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_beta_qualified, is_premium_qualified')
    .single();

  if (profileError || !profile) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const { data: featureFlags, error: flagsError } = await supabase
    .from('feature_flags')
    .select('key, name, description, audience')
    .order('key', { ascending: true });

  if (flagsError) {
    res.status(500).json({ error: flagsError.message });
    return;
  }

  res.status(200).json({
    environment: process.env.APP_ENV ?? 'unknown',
    profile,
    featureFlags: featureFlags ?? [],
  });
}
