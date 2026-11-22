import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { settings } from '../config/env';

const url = settings.supabaseUrl;
const pubKey = settings.supabasePublishableKey;
export const supabaseAuth = url && pubKey
  ? createClient(url, pubKey, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;
export async function getToken(): Promise<string | undefined> {
  if (!supabaseAuth) return undefined;
  return (await supabaseAuth.auth.getSession()).data.session?.access_token;
}
