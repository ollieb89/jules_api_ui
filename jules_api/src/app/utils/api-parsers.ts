import {
  Activity,
  Artifact,
  JulesSettings,
  PaginatedActivitiesResponse,
  PaginatedSessionsResponse,
  PaginatedSourcesResponse,
  Plan,
  PlanState,
  Session,
  SessionState,
  Source,
  Step,
  StepState,
  TestConnectionResponse,
  UpdateApiKeyResponse
} from '../models/jules.model';

type UnknownRecord = Record<string, unknown>;

const sessionStates = new Set<SessionState>([
  'STATE_UNSPECIFIED',
  'ACTIVE',
  'COMPLETED',
  'FAILED'
]);

const stepStates = new Set<StepState>([
  'STATE_UNSPECIFIED',
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED'
]);

const planStates = new Set<PlanState>([
  'STATE_UNSPECIFIED',
  'PENDING',
  'APPROVED',
  'REJECTED'
]);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const asString = (value: unknown, field: string): string => {
  if (!isString(value)) {
    throw new Error(`${field} must be a string.`);
  }
  return value;
};

const asNullableString = (value: unknown, field: string): string | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  return asString(value, field);
};

const asOptionalNumber = (value: unknown, field: string): number | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== 'number') {
    throw new Error(`${field} must be a number.`);
  }
  return value;
};

const asOptionalRecord = (value: unknown, field: string): UnknownRecord | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  if (!isRecord(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value;
};

const asArray = <T>(value: unknown, field: string, mapper: (item: unknown) => T): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array.`);
  }
  return value.map(mapper);
};

const parseArtifact = (value: unknown): Artifact => {
  if (!isRecord(value)) {
    throw new Error('Artifact must be an object.');
  }

  return {
    change_set: asOptionalRecord(value['change_set'], 'artifact.change_set') ?? null,
    bash_output: asNullableString(value['bash_output'], 'artifact.bash_output') ?? null,
    git_patch: asNullableString(value['git_patch'], 'artifact.git_patch') ?? null
  };
};

const parseStep = (value: unknown): Step => {
  if (!isRecord(value)) {
    throw new Error('Step must be an object.');
  }

  const stateValue = value['state'];
  const state = stateValue === undefined || stateValue === null ? 'STATE_UNSPECIFIED' : stateValue;
  if (!isString(state) || !stepStates.has(state as StepState)) {
    throw new Error('step.state must be a valid state string.');
  }

  return {
    id: asNullableString(value['id'], 'step.id') ?? undefined,
    index: asOptionalNumber(value['index'], 'step.index') ?? null,
    title: asNullableString(value['title'], 'step.title') ?? undefined,
    description: asNullableString(value['description'], 'step.description') ?? undefined,
    state: state as StepState,
    artifacts: value['artifacts'] ? asArray(value['artifacts'], 'step.artifacts', parseArtifact) : null
  };
};

const parsePlan = (value: unknown): Plan => {
  if (!isRecord(value)) {
    throw new Error('Plan must be an object.');
  }

  const steps = value['steps'] ? asArray(value['steps'], 'plan.steps', parseStep) : [];
  const stateValue = value['state'];
  const state = stateValue === undefined || stateValue === null ? 'STATE_UNSPECIFIED' : stateValue;

  if (!isString(state) || !planStates.has(state as PlanState)) {
    throw new Error('plan.state must be a valid state string.');
  }

  return {
    steps,
    state: state as PlanState
  };
};

const parseSource = (value: unknown): Source => {
  if (!isRecord(value)) {
    throw new Error('Source must be an object.');
  }

  const githubMetadata = value['github_metadata'];
  if (githubMetadata && !isRecord(githubMetadata)) {
    throw new Error('source.github_metadata must be an object.');
  }

  return {
    name: asString(value['name'], 'source.name'),
    display_name: asString(value['display_name'], 'source.display_name'),
    github_metadata: githubMetadata
      ? {
          repository: asString(
            (githubMetadata as UnknownRecord)['repository'],
            'source.github_metadata.repository'
          ),
          branch: asNullableString(
            (githubMetadata as UnknownRecord)['branch'],
            'source.github_metadata.branch'
          ),
          commit: asNullableString(
            (githubMetadata as UnknownRecord)['commit'],
            'source.github_metadata.commit'
          )
        }
      : null
  };
};

const parseSession = (value: unknown): Session => {
  if (!isRecord(value)) {
    throw new Error('Session must be an object.');
  }

  const stateValue = value['state'];
  const state = stateValue === undefined || stateValue === null ? 'STATE_UNSPECIFIED' : stateValue;
  if (!isString(state) || !sessionStates.has(state as SessionState)) {
    throw new Error('session.state must be a valid state string.');
  }

  return {
    name: asString(value['name'], 'session.name'),
    display_name: asString(value['display_name'], 'session.display_name'),
    state: state as SessionState,
    prompt: asString(value['prompt'], 'session.prompt'),
    source: asString(value['source'], 'session.source'),
    create_time: asString(value['create_time'], 'session.create_time'),
    update_time: asString(value['update_time'], 'session.update_time')
  };
};

const parseActivity = (value: unknown): Activity => {
  if (!isRecord(value)) {
    throw new Error('Activity must be an object.');
  }

  const planGenerated = value['plan_generated'];
  const planApproved = value['plan_approved'];
  const progressUpdated = value['progress_updated'];
  const sessionCompleted = value['session_completed'];

  if (planGenerated && !isRecord(planGenerated)) {
    throw new Error('activity.plan_generated must be an object.');
  }

  if (planApproved && !isRecord(planApproved)) {
    throw new Error('activity.plan_approved must be an object.');
  }

  if (progressUpdated && !isRecord(progressUpdated)) {
    throw new Error('activity.progress_updated must be an object.');
  }

  if (sessionCompleted && !isRecord(sessionCompleted)) {
    throw new Error('activity.session_completed must be an object.');
  }

  return {
    name: asString(value['name'], 'activity.name'),
    plan_generated: planGenerated ? { plan: parsePlan(planGenerated['plan']) } : null,
    plan_approved: planApproved ? {} : null,
    progress_updated: progressUpdated
      ? {
          title: asNullableString(progressUpdated['title'], 'activity.progress_updated.title'),
          description: asNullableString(
            progressUpdated['description'],
            'activity.progress_updated.description'
          ),
          artifacts: progressUpdated['artifacts']
            ? asArray(
                progressUpdated['artifacts'],
                'activity.progress_updated.artifacts',
                parseArtifact
              )
            : null
        }
      : null,
    session_completed: sessionCompleted ? {} : null,
    create_time: asString(value['create_time'], 'activity.create_time')
  };
};

export const getParserErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const parseSourcesResponse = (value: unknown): PaginatedSourcesResponse => {
  if (!isRecord(value)) {
    throw new Error('Sources response must be an object.');
  }

  return {
    sources: asArray(value['sources'], 'sources', parseSource)
  };
};

export const parseSessionsResponse = (value: unknown): PaginatedSessionsResponse => {
  if (!isRecord(value)) {
    throw new Error('Sessions response must be an object.');
  }

  return {
    sessions: asArray(value['sessions'], 'sessions', parseSession),
    next_page_token: asNullableString(value['next_page_token'], 'sessions.next_page_token') ?? null
  };
};

export const parseSessionsList = (value: unknown): Session[] =>
  asArray(value, 'sessions', parseSession);

export const parseSessionResponse = (value: unknown): Session => parseSession(value);

export const parseActivitiesResponse = (value: unknown): PaginatedActivitiesResponse => {
  if (!isRecord(value)) {
    throw new Error('Activities response must be an object.');
  }

  return {
    activities: asArray(value['activities'], 'activities', parseActivity),
    next_page_token: asNullableString(value['next_page_token'], 'activities.next_page_token') ?? null
  };
};

export const parseActivitiesList = (value: unknown): Activity[] =>
  asArray(value, 'activities', parseActivity);

export const parseSettingsResponse = (value: unknown): JulesSettings => {
  if (!isRecord(value)) {
    throw new Error('Settings response must be an object.');
  }

  const apiKeyConfigured = value['api_key_configured'];
  if (!isBoolean(apiKeyConfigured)) {
    throw new Error('settings.api_key_configured must be a boolean.');
  }

  return {
    api_key_configured: apiKeyConfigured,
    masked_api_key: asNullableString(value['masked_api_key'], 'settings.masked_api_key') ?? null,
    created_at: asString(value['created_at'], 'settings.created_at'),
    updated_at: asString(value['updated_at'], 'settings.updated_at')
  };
};

export const parseUpdateApiKeyResponse = (value: unknown): UpdateApiKeyResponse => {
  if (!isRecord(value)) {
    throw new Error('Update API key response must be an object.');
  }

  return {
    status: asString(value['status'], 'update_api_key.status'),
    message: asString(value['message'], 'update_api_key.message'),
    masked_api_key: asNullableString(value['masked_api_key'], 'update_api_key.masked_api_key') ?? undefined
  };
};

export const parseTestConnectionResponse = (value: unknown): TestConnectionResponse => {
  if (!isRecord(value)) {
    throw new Error('Test connection response must be an object.');
  }

  const apiKeyConfigured = value['api_key_configured'];
  if (!isBoolean(apiKeyConfigured)) {
    throw new Error('test_connection.api_key_configured must be a boolean.');
  }

  const status = asString(value['status'], 'test_connection.status');
  const message = asString(value['message'], 'test_connection.message');

  return {
    status,
    message,
    api_key_configured: apiKeyConfigured,
    api_connectivity: asNullableString(
      value['api_connectivity'],
      'test_connection.api_connectivity'
    ) ?? undefined,
    sources_count: asOptionalNumber(value['sources_count'], 'test_connection.sources_count'),
    error: asNullableString(value['error'], 'test_connection.error') ?? undefined
  };
};
