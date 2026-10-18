import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

let cachedToken: string | null = null;
let loaded = false;

/** The only place the JWT is persisted: expo-secure-store, a single key. */
export async function loadToken(): Promise<string | null> {
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  loaded = true;
  return cachedToken;
}

export async function saveToken(token: string): Promise<void> {
  cachedToken = token;
  loaded = true;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  loaded = true;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  if (!loaded) return loadToken();
  return cachedToken;
}
