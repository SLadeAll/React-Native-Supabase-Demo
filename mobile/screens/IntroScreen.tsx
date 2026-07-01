import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { apiBaseUrl } from '../lib/config';
import { loggedFetch } from '../lib/network';
import type { AuthSession } from '../lib/session';

type FeatureFlag = { key: string; name: string; description: string | null; audience: string };

const STEPS = [
  { n: '1', title: 'Create an account', desc: 'Sign up with your email and a strong password. A verification email will be sent.' },
  { n: '2', title: 'Sign in',            desc: 'Log in with your credentials. Your session is securely stored on-device.' },
  { n: '3', title: 'Explore your flags', desc: 'Feature flags visible to you depend on your account tier (free, beta, premium).' },
  { n: '4', title: 'Manage settings',    desc: 'Change your password or sign out anytime from the Settings tab.' },
];

const STACK = ['React Native', 'Expo', 'TypeScript', 'Supabase', 'Vercel', 'NativeWind'];

export default function IntroScreen({ session }: { session: AuthSession }) {
  const [flags, setFlags]     = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await loggedFetch(`${apiBaseUrl}/api/config`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load');
        if (!cancelled) setFlags(json.featureFlags ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session.accessToken]);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

      {/* Hero */}
      <View className="bg-violet-600 rounded-2xl p-6 mb-5">
        <Text className="text-white text-2xl font-bold mb-1">Feature Flag Platform</Text>
        <Text className="text-violet-200 text-sm leading-relaxed">
          A full-stack demo showcasing role-based feature flags with Supabase RLS, a Vercel API
          proxy, and a React Native mobile client.
        </Text>
      </View>

      {/* How it works */}
      <Text className="text-base font-bold text-gray-800 mb-3">How it works</Text>
      <View className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
        {STEPS.map((step, i) => (
          <View
            key={step.n}
            className={`flex-row gap-4 p-4 ${i < STEPS.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <View className="w-8 h-8 rounded-full bg-violet-100 items-center justify-center flex-shrink-0">
              <Text className="text-violet-700 font-bold text-sm">{step.n}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm mb-0.5">{step.title}</Text>
              <Text className="text-gray-500 text-xs leading-relaxed">{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Tech stack */}
      <Text className="text-base font-bold text-gray-800 mb-3">Tech Stack</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {STACK.map((s) => (
          <View key={s} className="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100">
            <Text className="text-violet-700 text-xs font-semibold">{s}</Text>
          </View>
        ))}
      </View>

      {/* Your feature flags */}
      <Text className="text-base font-bold text-gray-800 mb-3">Your Feature Flags</Text>
      {loading ? (
        <ActivityIndicator color="#6d28d9" />
      ) : error ? (
        <Text className="text-red-500 text-sm">{error}</Text>
      ) : flags.length === 0 ? (
        <Text className="text-gray-400 text-sm">No feature flags visible for your account.</Text>
      ) : (
        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {flags.map((flag, i) => (
            <View
              key={flag.key}
              className={`flex-row items-center justify-between px-4 py-3 ${
                i < flags.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-gray-900 font-semibold text-sm">{flag.name}</Text>
                {flag.description ? (
                  <Text className="text-gray-500 text-xs mt-0.5">{flag.description}</Text>
                ) : null}
              </View>
              <View className={`px-2.5 py-1 rounded-full ${
                flag.audience === 'all'     ? 'bg-gray-100'   :
                flag.audience === 'beta'    ? 'bg-blue-100'   :
                                              'bg-amber-100'
              }`}>
                <Text className={`text-xs font-bold uppercase ${
                  flag.audience === 'all'     ? 'text-gray-600'   :
                  flag.audience === 'beta'    ? 'text-blue-700'   :
                                               'text-amber-700'
                }`}>
                  {flag.audience}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}
