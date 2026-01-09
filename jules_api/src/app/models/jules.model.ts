import type { ApiError } from './user.model';

// Source types
export interface GitHubSourceMetadata {
  repository: string;
  branch?: string | null;
  commit?: string | null;
}

export interface Source {
  name: string;
  display_name: string;
  github_metadata?: GitHubSourceMetadata | null;
}

// Session types
export type SessionState = 'STATE_UNSPECIFIED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface Session {
  name: string;
  display_name: string;
  state: SessionState;
  prompt: string;
  source: string;
  create_time: string;
  update_time: string;
}

export interface CreateSession {
  prompt: string;
  source: string;
}

// Plan and Step types
export type StepState = 'STATE_UNSPECIFIED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type PlanState = 'STATE_UNSPECIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Artifact {
  change_set?: Record<string, unknown> | null;
  bash_output?: string | null;
  git_patch?: string | null;
}

export interface Step {
  id?: string;
  index?: number | null;
  title?: string;
  description?: string;
  state: StepState;
  artifacts?: Artifact[] | null;
}

export interface Plan {
  steps: Step[];
  state: PlanState;
}

// Activity types
export interface PlanGeneratedActivity {
  plan: Plan;
}

export interface PlanApprovedActivity {
  plan?: Plan;
}

export interface ProgressUpdatedActivity {
  title?: string;
  description?: string;
  artifacts?: Artifact[] | null;
}

export interface SessionCompletedActivity {
  // Empty, just indicates completion
}

export interface Activity {
  name: string;
  plan_generated?: PlanGeneratedActivity | null;
  plan_approved?: PlanApprovedActivity | null;
  progress_updated?: ProgressUpdatedActivity | null;
  session_completed?: SessionCompletedActivity | null;
  create_time: string;
}

// Request/Response types
export interface SendMessageRequest {
  message: string;
}

// Paginated response types
export interface PaginatedSourcesResponse {
  sources: Source[];
}

export interface PaginatedSessionsResponse {
  sessions: Session[];
  next_page_token?: string | null;
}

export interface PaginatedActivitiesResponse {
  activities: Activity[];
  next_page_token?: string | null;
}

// Settings types
export interface JulesSettings {
  api_key_configured: boolean;
  masked_api_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateApiKeyResponse {
  status: string;
  message: string;
  masked_api_key?: string;
}

export interface TestConnectionResponse {
  status: string;
  message: string;
  api_key_configured: boolean;
  api_connectivity?: string;
  sources_count?: number;
  error?: string;
}

// API Error types
export interface JulesApiError {
  error:
    | string
    | {
        message?: string;
        detail?: unknown;
      };
  retry_after_seconds?: number;
  fieldErrors?: ApiError;
}
