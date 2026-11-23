const env = process.env;
export const settings = {
  apiBaseUrl: (env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, ''),
  dataSource: env.EXPO_PUBLIC_DATA_SOURCE === 'api' ? 'api' as const : 'mock' as const,
  qrPagoModo: env.EXPO_PUBLIC_QR_PAGO_MODO === 'pasarela' ? 'pasarela' as const : 'manual' as const,
  supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabasePublishableKey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  compradorId: Number(env.EXPO_PUBLIC_COMPRADOR_ID || '1'),
  comercianteId: Number(env.EXPO_PUBLIC_COMERCIANTE_ID || '1'),
};
