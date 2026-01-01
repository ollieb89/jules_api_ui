import { runtimeEnv } from './environment.runtime';

export const environment = {
  production: false,
  apiUrl: runtimeEnv?.apiUrl ?? 'http://localhost:8444/api',
  wsUrl: runtimeEnv?.wsUrl ?? 'ws://localhost:8444/ws'
};
