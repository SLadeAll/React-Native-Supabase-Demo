import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadSession, onAuthStateChange, type AuthSession } from './lib/session';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import EnvBadge from './components/EnvBadge';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadSession().then((restored) => {
      setSession(restored);
      setInitializing(false);
    });

    return onAuthStateChange(setSession);
  }, []);

  if (initializing) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <EnvBadge />
      {session ? <HomeScreen session={session} /> : <LoginScreen />}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
