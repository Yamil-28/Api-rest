const env = process.env;
export const settings = {
  apiBaseUrl: (env.EXPO_PUBLIC_API_URL || 'https://api-rest-6an3.onrender.com').replace(/\/$/, ''),
  dataSource: env.EXPO_PUBLIC_DATA_SOURCE === 'api' ? 'api' as const : 'mock' as const,
  compradorId: Number(env.EXPO_PUBLIC_COMPRADOR_ID || '1'),
  comercianteId: Number(env.EXPO_PUBLIC_COMERCIANTE_ID || '1'),
};
