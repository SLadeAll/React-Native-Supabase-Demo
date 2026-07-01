import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { signOut, changePassword, type AuthSession } from '../lib/session';
import PasswordStrength, { getPasswordStrength } from '../components/PasswordStrength';

export default function SettingsScreen({ session }: { session: AuthSession }) {
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [pwLoading, setPwLoading]           = useState(false);
  const [pwError, setPwError]               = useState<string | null>(null);
  const [pwSuccess, setPwSuccess]           = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const submitting                          = useRef(false);

  const passwordsMatch    = confirmPw.length > 0 && newPassword === confirmPw;
  const passwordsMismatch = confirmPw.length > 0 && newPassword !== confirmPw;

  const handleChangePassword = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPwError(null);
    setPwSuccess(null);

    const { level } = getPasswordStrength(newPassword);
    if (level < 2) {
      setPwError('Password too weak. Use 8+ characters with uppercase and a number.');
      return;
    }
    if (newPassword !== confirmPw) {
      setPwError('Passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await changePassword(newPassword);
      setPwSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPw('');
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Failed to change password.');
    } finally {
      setPwLoading(false);
      submitting.current = false;
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

      {/* Account info */}
      <Text className="text-base font-bold text-gray-800 mb-3">Account</Text>
      <View className="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-5 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-violet-100 items-center justify-center">
          <Text className="text-violet-700 font-bold text-base">
            {(session.user.email ?? '?')[0].toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-500 text-xs font-medium">Signed in as</Text>
          <Text className="text-gray-900 text-sm font-semibold">{session.user.email}</Text>
        </View>
      </View>

      {/* Change password */}
      <Text className="text-base font-bold text-gray-800 mb-3">Change Password</Text>
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">

        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            New Password
          </Text>
          <TextInput
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm"
            placeholder="••••••••"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <PasswordStrength password={newPassword} />
        </View>

        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Confirm New Password
          </Text>
          <TextInput
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPw}
            onChangeText={setConfirmPw}
          />
          {passwordsMatch && (
            <Text className="text-xs font-semibold text-green-600 mt-1.5">✓ Passwords match</Text>
          )}
          {passwordsMismatch && (
            <Text className="text-xs font-semibold text-red-500 mt-1.5">Passwords do not match</Text>
          )}
        </View>

        {pwError && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-600 text-sm font-medium">{pwError}</Text>
          </View>
        )}
        {pwSuccess && (
          <View className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-green-700 text-sm font-medium">{pwSuccess}</Text>
          </View>
        )}

        <Pressable
          onPress={handleChangePassword}
          disabled={pwLoading}
          className={`py-3 rounded-xl items-center ${pwLoading ? 'bg-violet-400' : 'bg-violet-600'}`}
        >
          {pwLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-sm">Update Password</Text>
          )}
        </Pressable>
      </View>

      {/* Sign out */}
      <Text className="text-base font-bold text-gray-800 mb-3">Session</Text>
      <Pressable
        onPress={handleSignOut}
        disabled={signOutLoading}
        className="bg-white border border-red-200 rounded-2xl py-4 items-center"
      >
        {signOutLoading ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <Text className="text-red-600 font-semibold text-sm">Sign Out</Text>
        )}
      </Pressable>

    </ScrollView>
  );
}
