type RuntimeEnvironment = {
  apiUrl?: string;
  wsUrl?: string;
};

const runtimeEnv =
  (typeof process !== 'undefined' && process.env
    ? {
        apiUrl: process.env['JULES_API_URL'],
        wsUrl: process.env['JULES_WS_URL']
      }
    : undefined) ??
  (globalThis as typeof globalThis & { __JULES_ENV__?: RuntimeEnvironment }).__JULES_ENV__;

export const environment = {
  production: true,
  apiUrl: runtimeEnv?.apiUrl ?? 'https://api.jules.ai/api',
  wsUrl: runtimeEnv?.wsUrl ?? 'wss://api.jules.ai/ws'
};
