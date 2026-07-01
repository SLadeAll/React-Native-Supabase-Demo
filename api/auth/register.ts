import type { VercelRequest, VercelResponse } from '@vercel/node';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  if (!isValidEmail(String(email))) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const supabaseUrl    = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server is missing SUPABASE_URL / SUPABASE_ANON_KEY' });
    return;
  }

  // Register via Supabase GoTrue
  const signUpRes  = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const signUpData = await signUpRes.json();

  if (!signUpRes.ok) {
    res.status(signUpRes.status).json({
      error: signUpData.error_description ?? signUpData.msg ?? 'Sign up failed',
    });
    return;
  }

  // Auto-login: exchange the sign-up response tokens
  // GoTrue returns access_token directly on signup when email confirmations are off
  if (signUpData.access_token) {
    res.status(200).json({
      accessToken:  signUpData.access_token,
      refreshToken: signUpData.refresh_token,
      expiresAt:    signUpData.expires_at,
      user: { id: signUpData.user.id, email: signUpData.user.email },
    });
    return;
  }

  // Email confirmation required — no session yet
  res.status(200).json({
    message: 'Registration successful. Please check your email to confirm your account.',
  });
}
