import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadSession, onAuthStateChange, type AuthSession } from './lib/session';
import LoginScreen from './screens/LoginScreen';
import IntroScreen from './screens/IntroScreen';
import AboutScreen from './screens/AboutScreen';
import SettingsScreen from './screens/SettingsScreen';
import TabBar, { type TabId } from './components/TabBar';
import EnvBadge from './components/EnvBadge';

export default function App() {
  const [session, setSession]       = useState<AuthSession | null>(null);
  const [initializing, setInit]     = useState(true);
  const [activeTab, setActiveTab]   = useState<TabId>('intro');

  useEffect(() => {
    loadSession().then((restored) => {
      setSession(restored);
      setInit(false);
    });
    return onAuthStateChange(setSession);
  }, []);

  if (initializing) return null;

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EnvBadge />
        <LoginScreen />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <EnvBadge />

      {/* Tab content */}
      <SafeAreaView className="flex-1">
        {activeTab === 'intro'    && <IntroScreen session={session} />}
        {activeTab === 'about'    && <AboutScreen />}
        {activeTab === 'settings' && <SettingsScreen session={session} />}
      </SafeAreaView>

      {/* Bottom tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
