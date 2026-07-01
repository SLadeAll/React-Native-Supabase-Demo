import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import 'react-native-get-random-values';

// SecureStore API changed between Expo Go native module versions. We probe for
// the async methods at runtime and fall back to plain AsyncStorage when they
// are absent (e.g. Expo Go / SDK mismatch in development). Production builds
// using a custom dev client or bare workflow always have the native module.
let secureStoreModule: {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
} | null = null;

async function getSecureStore() {
  if (secureStoreModule !== null) return secureStoreModule;
  try {
    const mod = await import('expo-secure-store');
    // Probe that the underlying native methods exist before committing to it.
    const probe = mod as any;
    if (
      typeof probe.setItemAsync === 'function' &&
      typeof probe.getItemAsync === 'function' &&
      typeof probe.deleteItemAsync === 'function'
    ) {
      // Do a lightweight test write to confirm the native call succeeds.
      await probe.setItemAsync('__probe__', '1');
      await probe.deleteItemAsync('__probe__');
      secureStoreModule = mod;
    }
  } catch {
    // Native module unavailable or method missing — fall through to null.
  }
  return secureStoreModule;
}

export class LargeSecureStore {
  private async encrypt(key: string, value: string): Promise<string> {
    const ss = await getSecureStore();
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    if (ss) {
      await ss.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    } else {
      // Fallback: keep the AES key in AsyncStorage (dev-only, not hardware-backed).
      await AsyncStorage.setItem(`${key}__key`, aesjs.utils.hex.fromBytes(encryptionKey));
    }

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const ss = await getSecureStore();
    let encryptionKeyHex: string | null = null;

    if (ss) {
      encryptionKeyHex = await ss.getItemAsync(key);
    } else {
      encryptionKeyHex = await AsyncStorage.getItem(`${key}__key`);
    }

    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    const ss = await getSecureStore();
    if (ss) {
      await ss.deleteItemAsync(key).catch(() => {});
    } else {
      await AsyncStorage.removeItem(`${key}__key`);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }
}
