function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Run "npm run start:staging" or "npm run start:production" so the right .env file is loaded.`
    );
  }
  return value;
}

// This is the staging/production toggle point: which file gets loaded here
// is controlled entirely by which npm script (and which .env.* file) was
// used to launch the app — see package.json + .env.staging / .env.production.
//
// The app only ever knows about EXPO_PUBLIC_API_BASE_URL. It has no
// Supabase URL or anon key at all — auth and data both go through the
// Vercel API (see lib/session.ts and screens/HomeScreen.tsx), so Supabase
// credentials never ship in the client bundle.
export const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'unknown';
export const apiBaseUrl = required(process.env.EXPO_PUBLIC_API_BASE_URL, 'EXPO_PUBLIC_API_BASE_URL');
