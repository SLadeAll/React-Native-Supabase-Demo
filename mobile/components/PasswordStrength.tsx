import { View, Text } from 'react-native';

type Strength = { level: number; label: string; barColor: string; textColor: string };

export function getPasswordStrength(password: string): Strength {
  if (!password) return { level: 0, label: '', barColor: '', textColor: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak',        barColor: 'bg-red-500',     textColor: 'text-red-500' };
  if (score === 2) return { level: 2, label: 'Fair',        barColor: 'bg-orange-400',  textColor: 'text-orange-500' };
  if (score === 3) return { level: 3, label: 'Good',        barColor: 'bg-yellow-400',  textColor: 'text-yellow-600' };
  if (score === 4) return { level: 4, label: 'Strong',      barColor: 'bg-green-500',   textColor: 'text-green-600' };
  return              { level: 5, label: 'Very Strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
}

export default function PasswordStrength({ password }: { password: string }) {
  const { level, label, barColor, textColor } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <View className="mt-2">
      <View className="flex-row gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            className={`flex-1 h-1.5 rounded-full ${i <= level ? barColor : 'bg-gray-200'}`}
          />
        ))}
      </View>
      <Text className={`text-xs font-semibold ${textColor}`}>{label}</Text>
    </View>
  );
}
