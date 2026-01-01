import { runtimeEnv } from './environment.runtime';

export const environment = {
  production: true,
  apiUrl: runtimeEnv?.apiUrl ?? 'https://api.jules.ai/api',
  wsUrl: runtimeEnv?.wsUrl ?? 'wss://api.jules.ai/ws'
};
