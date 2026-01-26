declare const process: { env: Record<string, string | undefined> } | undefined;

export type RuntimeEnvironment = {
  apiUrl?: string;
  sseUrl?: string;
};

export const runtimeEnv: RuntimeEnvironment | undefined =
  (typeof process !== 'undefined' && process?.env
    ? {
        apiUrl: process.env['JULES_API_URL'],
        sseUrl: process.env['JULES_SSE_URL'],
      }
    : undefined) ??
  (globalThis as typeof globalThis & { __JULES_ENV__?: RuntimeEnvironment }).__JULES_ENV__;
