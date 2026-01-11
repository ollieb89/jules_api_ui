import { runtimeEnv } from './environment.runtime';

export const environment = {
  production: true,
  apiUrl: runtimeEnv?.apiUrl ?? 'https://api.jules.ai/api',
  sseUrl: runtimeEnv?.sseUrl ?? runtimeEnv?.apiUrl ?? 'https://api.jules.ai/api'
};
