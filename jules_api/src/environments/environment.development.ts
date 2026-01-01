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
  production: false,
  apiUrl: runtimeEnv?.apiUrl ?? 'http://localhost:8444/api',
  wsUrl: runtimeEnv?.wsUrl ?? 'ws://localhost:8444/ws'
};
