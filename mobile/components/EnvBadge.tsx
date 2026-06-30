import { StyleSheet, Text, View } from 'react-native';
import { appEnv } from '../lib/config';

export default function EnvBadge() {
  const isProduction = appEnv === 'production';
  return (
    <View testID="env-badge" style={[styles.badge, isProduction ? styles.production : styles.staging]}>
      <Text style={styles.text}>{appEnv.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 12,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  staging: { backgroundColor: '#f59e0b' },
  production: { backgroundColor: '#16a34a' },
  text: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
