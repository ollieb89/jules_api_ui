import { runtimeEnv } from './environment.runtime';

export const environment = {
  production: false,
  apiUrl: runtimeEnv?.apiUrl ?? 'http://localhost:8444/api',
  sseUrl: runtimeEnv?.sseUrl ?? runtimeEnv?.apiUrl ?? 'http://localhost:8444/api'
};
