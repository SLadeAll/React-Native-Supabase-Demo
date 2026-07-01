import { View, Text, Pressable } from 'react-native';

export type TabId = 'intro' | 'about' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'intro',    label: 'Intro' },
  { id: 'about',    label: 'About' },
  { id: 'settings', label: 'Settings' },
];

export default function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <View className="flex-row border-t border-gray-100 bg-white">
      {TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            className="flex-1 items-center py-3"
          >
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center mb-0.5 ${
                isActive ? 'bg-violet-100' : 'bg-transparent'
              }`}
            >
              <TabIcon id={id} active={isActive} />
            </View>
            <Text
              className={`text-xs font-semibold ${
                isActive ? 'text-violet-700' : 'text-gray-400'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const color = active ? '#6d28d9' : '#9ca3af';
  const size = 22;

  if (id === 'intro') {
    return (
      <Text style={{ fontSize: size, lineHeight: size + 2 }}>📋</Text>
    );
  }
  if (id === 'about') {
    return (
      <Text style={{ fontSize: size, lineHeight: size + 2 }}>👤</Text>
    );
  }
  return (
    <Text style={{ fontSize: size, lineHeight: size + 2 }}>⚙️</Text>
  );
}
