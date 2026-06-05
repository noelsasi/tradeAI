export const CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  clientName: import.meta.env.VITE_CLIENT_NAME ?? 'Shippify UAE',
  clientId: import.meta.env.VITE_CLIENT_ID ?? 'shippify',
} as const
