import { Preferences } from '@capacitor/preferences';

const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

/**
 * Storage utility using Capacitor Preferences
 */
export const storage = {
  /**
   * Save access token
   */
  async setAccessToken(token: string): Promise<void> {
    await Preferences.set({ key: KEYS.ACCESS_TOKEN, value: token });
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: KEYS.ACCESS_TOKEN });
    return value;
  },

  /**
   * Save refresh token
   */
  async setRefreshToken(token: string): Promise<void> {
    await Preferences.set({ key: KEYS.REFRESH_TOKEN, value: token });
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: KEYS.REFRESH_TOKEN });
    return value;
  },

  /**
   * Save user data
   */
  async setUser(user: any): Promise<void> {
    await Preferences.set({ key: KEYS.USER, value: JSON.stringify(user) });
  },

  /**
   * Get user data
   */
  async getUser(): Promise<any | null> {
    const { value } = await Preferences.get({ key: KEYS.USER });
    return value ? JSON.parse(value) : null;
  },

  /**
   * Clear all auth data
   */
  async clearAuth(): Promise<void> {
    await Preferences.remove({ key: KEYS.ACCESS_TOKEN });
    await Preferences.remove({ key: KEYS.REFRESH_TOKEN });
    await Preferences.remove({ key: KEYS.USER });
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    await Preferences.clear();
  },
};
