import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { signOut, type AuthSession } from '../lib/session';
import { apiBaseUrl } from '../lib/config';
import { loggedFetch } from '../lib/network';

type FeatureFlag = {
  key: string;
  name: string;
  description: string | null;
  audience: string;
};

type ConfigResponse = {
  environment: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    is_beta_qualified: boolean;
    is_premium_qualified: boolean;
  };
  featureFlags: FeatureFlag[];
};

export default function HomeScreen({ session }: { session: AuthSession }) {
  const [data, setData] = useState<ConfigResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await loggedFetch(`${apiBaseUrl}/api/config`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? `Request failed with status ${response.status}`);
        }
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load config');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [session.accessToken]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text testID="config-error" style={styles.error}>
          {error}
        </Text>
        <Pressable style={styles.button} onPress={() => signOut()}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text testID="profile-email" style={styles.subtitle}>
        {data?.profile.email}
      </Text>

      <Text style={styles.sectionTitle}>Visible feature flags</Text>
      {data?.featureFlags.length ? (
        data.featureFlags.map((flag) => (
          <View key={flag.key} testID={`flag-${flag.key}`} style={styles.flagRow}>
            <Text style={styles.flagName}>{flag.name}</Text>
            <Text style={styles.flagMeta}>{flag.audience}</Text>
          </View>
        ))
      ) : (
        <Text>No feature flags visible for this user.</Text>
      )}

      <Pressable testID="sign-out" style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 64, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  flagName: { fontSize: 15, fontWeight: '500' },
  flagMeta: { fontSize: 13, color: '#888', textTransform: 'uppercase' },
  error: { color: '#dc2626', marginBottom: 16 },
  button: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
