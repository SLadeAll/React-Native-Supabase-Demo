import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

const SKILLS: string[] = [
  'React Native',
  'TypeScript',
  'Node.js',
  'GraphQL',
  'Tailwind CSS',
  'css-in-js',
  'vercel',
  'docker',
  'Git',
  'CI/CD',
  'Testing',
  'ui/ux',
  'agile',
  'IA',
  'problem solving',
  'Bilingual',
];

const SOCIAL = [
  { label: 'GitHub',   icon: '🐙', url: 'https://github.com/SLadeAll/React-Native-Supabase-Demo', username: 'SladeAll'},
  { label: 'LinkedIn', icon: '💼', url: 'https://www.linkedin.com/in/oscar-javier-vera-perea-230400198/', username: 'Oscar Javier Vera Perea' }
];

export default function AboutScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

      {/* Profile card */}
      <View className="bg-white rounded-2xl border border-gray-100 p-6 items-center mb-5">
        {/* Avatar */}
        <View className="w-20 h-20 rounded-full bg-violet-600 items-center justify-center mb-4">
          <Text className="text-white text-3xl font-bold">YN</Text>
        </View>

        {/* Name & role */}
        <Text className="text-xl font-bold text-gray-900 mb-1">Oscar Vera</Text>
        <Text className="text-violet-600 font-semibold text-sm mb-3">Full-Stack Developer</Text>

        {/* Bio */}
        <Text className="text-gray-500 text-sm text-center leading-relaxed">
          Add a short bio here — who you are, what you build, and what drives you as a developer.
          This is your space to introduce yourself to anyone who views your app.
        </Text>
      </View>

      {/* Skills */}
      <Text className="text-base font-bold text-gray-800 mb-3">Skills</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {SKILLS.map((skill) => (
          <View key={skill} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200">
            <Text className="text-gray-700 text-xs font-semibold">{skill}</Text>
          </View>
        ))}
        <View className="px-3 py-1.5 rounded-lg bg-gray-100 border border-dashed border-gray-300">
          <Text className="text-gray-400 text-xs font-semibold">+ Add more</Text>
        </View>
      </View>

      {/* Characteristics */}
      <Text className="text-base font-bold text-gray-800 mb-3">Characteristics</Text>
      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        {[
          { icon: '🎯', label: 'Problem Solver',    desc: 'Describe how you approach challenges.' },
          { icon: '🤝', label: 'Team Player',       desc: 'Describe how you work with others.' },
          { icon: '📚', label: 'Continuous Learner', desc: 'Describe how you keep growing.' },
        ].map((item, i, arr) => (
          <View
            key={item.label}
            className={`flex-row gap-4 p-4 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <Text className="text-2xl">{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm mb-0.5">{item.label}</Text>
              <Text className="text-gray-400 text-xs">{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Social links */}
      <Text className="text-base font-bold text-gray-800 mb-3">Find Me Online</Text>
      <View className="flex-row gap-3">
        {SOCIAL.map((s) => (
          <Pressable
            key={s.label}
            onPress={() => Linking.openURL(s.url)}
            className="flex-1 bg-white border border-gray-100 rounded-xl p-4 items-center active:opacity-70"
          >
            <Text className="text-3xl mb-1">{s.icon}</Text>
            <Text className="text-gray-700 font-semibold text-sm">{s.label}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">{s.username}</Text>
          </Pressable>
        ))}
      </View>

    </ScrollView>
  );
}
