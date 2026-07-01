function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Run "npm run start:staging" or "npm run start:production" so the right .env file is loaded.`
    );
  }
  return value;
}

// The app only ever knows about EXPO_PUBLIC_API_BASE_URL. It has no
// Supabase URL or anon key — auth and data go through the Vercel API
// (see lib/session.ts), so Supabase credentials never ship in the client bundle.
export const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'unknown';
export const apiBaseUrl = required(process.env.EXPO_PUBLIC_API_BASE_URL, 'EXPO_PUBLIC_API_BASE_URL');
