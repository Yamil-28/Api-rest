/** Expo solo sustituye referencias directas process.env.EXPO_PUBLIC_*. */
export const settings = {
  apiBaseUrl: (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, ''),
  dataSource: process.env.EXPO_PUBLIC_DATA_SOURCE === 'api' ? 'api' as const : 'mock' as const,
  qrPagoModo: process.env.EXPO_PUBLIC_QR_PAGO_MODO === 'pasarela' ? 'pasarela' as const : 'manual' as const,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  compradorId: Number(process.env.EXPO_PUBLIC_COMPRADOR_ID || '1'),
  comercianteId: Number(process.env.EXPO_PUBLIC_COMERCIANTE_ID || '1'),
};
