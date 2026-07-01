import { Text, View } from 'react-native';
import { appEnv } from '../lib/config';

export default function EnvBadge() {
  const isProduction = appEnv === 'production';
  return (
    <View
      testID="env-badge"
      className={`absolute top-3 right-4 px-2.5 py-1 rounded-xl z-10 ${
        isProduction ? 'bg-green-600' : 'bg-amber-500'
      }`}
    >
      <Text className="text-white font-bold text-xs">{appEnv.toUpperCase()}</Text>
    </View>
  );
}
