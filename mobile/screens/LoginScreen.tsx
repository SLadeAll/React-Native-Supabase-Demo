import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signInWithPassword, signUp } from '../lib/session';
import PasswordStrength, { getPasswordStrength } from '../components/PasswordStrength';

type Mode = 'login' | 'signup';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');

  // shared fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // sign-up only
  const [confirm, setConfirm]   = useState('');

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const submitting               = useRef(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      const { level } = getPasswordStrength(password);
      if (level < 2) {
        setError('Password is too weak. Use at least 8 characters with uppercase and a number.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithPassword(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        setSuccess('Account created! Check your email to verify your account.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  };

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12 bg-white">

          {/* Logo / brand */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-violet-600 items-center justify-center mb-4 shadow-lg">
              <Text className="text-white text-3xl">🚀</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to your account'
                : 'Join the platform today'}
            </Text>
          </View>

          {/* Mode tabs */}
          <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg items-center ${
                  mode === m ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    mode === m ? 'text-violet-700' : 'text-gray-500'
                  }`}
                >
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email
            </Text>
            <TextInput
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Password
            </Text>
            <TextInput
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {mode === 'signup' && <PasswordStrength password={password} />}
          </View>

          {/* Confirm password (sign-up only) */}
          {mode === 'signup' && (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Confirm Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm"
                placeholder="••••••••"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
              {passwordsMatch && (
                <Text className="text-xs font-semibold text-green-600 mt-1.5">
                  ✓ Passwords match
                </Text>
              )}
              {passwordsMismatch && (
                <Text className="text-xs font-semibold text-red-500 mt-1.5">
                  Passwords do not match
                </Text>
              )}
            </View>
          )}

          {/* Error / success banners */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm font-medium">{error}</Text>
            </View>
          )}
          {success && (
            <View className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-green-700 text-sm font-medium">{success}</Text>
            </View>
          )}

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl items-center ${
              loading ? 'bg-violet-400' : 'bg-violet-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
