const env = process.env;
export const settings = {
  apiBaseUrl: (
    process.env.EXPO_PUBLIC_API_URL ||
    'https://api-rest-ram4.onrender.com'
  ).replace(/\/$/, ''),

  dataSource:
    process.env.EXPO_PUBLIC_DATA_SOURCE === 'api'
      ? ('api' as const)
      : ('mock' as const),

  pagosSource:
    process.env.EXPO_PUBLIC_PAGOS_SOURCE === 'api'
      ? ('api' as const)
      : ('mock' as const),

  compradorId: Number(
    process.env.EXPO_PUBLIC_COMPRADOR_ID || '1',
  ),

  comercianteId: Number(
    process.env.EXPO_PUBLIC_COMERCIANTE_ID || '1',
  ),
};