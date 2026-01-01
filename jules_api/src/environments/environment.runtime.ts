export type RuntimeEnvironment = {
  apiUrl?: string;
  wsUrl?: string;
};

export const runtimeEnv =
  (typeof process !== 'undefined' && process.env
    ? {
        apiUrl: process.env['JULES_API_URL'],
        wsUrl: process.env['JULES_WS_URL']
      }
    : undefined) ??
  (globalThis as typeof globalThis & { __JULES_ENV__?: RuntimeEnvironment }).__JULES_ENV__;
