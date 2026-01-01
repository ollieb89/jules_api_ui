import re

from rest_framework import serializers

from .models import JulesActivity


class GitHubSourceMetadataSerializer(serializers.Serializer):
    """Serializer for GitHub source metadata."""

    repository = serializers.CharField(
        min_length=1,
        error_messages={
            "required": "Repository is required.",
            "blank": "Repository cannot be blank.",
            "min_length": "Repository must be at least 1 character.",
        },
    )
    branch = serializers.CharField(
        required=False,
        allow_null=True,
        error_messages={"blank": "Branch cannot be blank."},
    )
    commit = serializers.CharField(
        required=False,
        allow_null=True,
        error_messages={"blank": "Commit cannot be blank."},
    )

    def to_internal_value(self, data):
        """Handle camelCase from API."""
        if isinstance(data, dict):
            return {
                "repository": data.get("repository", ""),
                "branch": data.get("branch"),
                "commit": data.get("commit"),
            }
        return super().to_internal_value(data)


class SourceSerializer(serializers.Serializer):
    """Serializer for Source (GitHub repository)."""

    name = serializers.CharField(
        min_length=1,
        error_messages={
            "required": "Source name is required.",
            "blank": "Source name cannot be blank.",
            "min_length": "Source name must be at least 1 character.",
        },
    )
    display_name = serializers.CharField(
        source="displayName",
        min_length=1,
        error_messages={
            "required": "Display name is required.",
            "blank": "Display name cannot be blank.",
            "min_length": "Display name must be at least 1 character.",
        },
    )
    github_metadata = GitHubSourceMetadataSerializer(
        source="githubMetadata", required=False, allow_null=True
    )

    def to_internal_value(self, data):
        """Handle camelCase from API response."""
        if isinstance(data, dict):
            normalized = {
                "name": data.get("name", ""),
                "displayName": data.get("displayName", data.get("display_name", "")),
                "githubMetadata": data.get(
                    "githubMetadata", data.get("github_metadata")
                ),
            }
            return normalized
        return super().to_internal_value(data)


class SessionSerializer(serializers.Serializer):
    """Serializer for Session."""

    name = serializers.CharField(
        min_length=1,
        error_messages={
            "required": "Session name is required.",
            "blank": "Session name cannot be blank.",
            "min_length": "Session name must be at least 1 character.",
        },
    )
    display_name = serializers.CharField(
        source="displayName",
        min_length=1,
        error_messages={
            "required": "Display name is required.",
            "blank": "Display name cannot be blank.",
            "min_length": "Display name must be at least 1 character.",
        },
    )
    state = serializers.ChoiceField(
        choices=["STATE_UNSPECIFIED", "ACTIVE", "COMPLETED", "FAILED"],
        error_messages={
            "required": "Session state is required.",
            "invalid_choice": "Session state is invalid.",
        },
    )
    prompt = serializers.CharField(
        min_length=1,
        error_messages={
            "required": "Prompt is required.",
            "blank": "Prompt cannot be blank.",
            "min_length": "Prompt must be at least 1 character.",
        },
    )
    source = serializers.CharField(
        min_length=1,
        error_messages={
            "required": "Source is required.",
            "blank": "Source cannot be blank.",
            "min_length": "Source must be at least 1 character.",
        },
    )
    create_time = serializers.CharField(
        source="createTime",
        min_length=1,
        error_messages={
            "required": "Create time is required.",
            "blank": "Create time cannot be blank.",
            "min_length": "Create time must be at least 1 character.",
        },
    )
    update_time = serializers.CharField(
        source="updateTime",
        min_length=1,
        error_messages={
            "required": "Update time is required.",
            "blank": "Update time cannot be blank.",
            "min_length": "Update time must be at least 1 character.",
        },
    )

    def to_internal_value(self, data):
        """Handle camelCase from API response."""
        if isinstance(data, dict):
            # Map camelCase keys to snake_case for internal processing
            normalized = {
                "name": data.get("name", ""),
                "displayName": data.get("displayName", data.get("display_name", "")),
                "state": data.get("state", ""),
                "prompt": data.get("prompt", ""),
                "source": data.get("source", ""),
                "createTime": data.get("createTime", data.get("create_time", "")),
                "updateTime": data.get("updateTime", data.get("update_time", "")),
            }
            return normalized
        return super().to_internal_value(data)


class SessionCreateSerializer(serializers.Serializer):
    """Serializer for creating a new session."""

    prompt = serializers.CharField(
        required=True,
        min_length=1,
        error_messages={
            "required": "Prompt is required.",
            "blank": "Prompt cannot be blank.",
            "min_length": "Prompt must be at least 1 character.",
        },
    )
    source = serializers.CharField(
        required=True,
        min_length=1,
        error_messages={
            "required": "Source is required.",
            "blank": "Source cannot be blank.",
            "min_length": "Source must be at least 1 character.",
        },
    )


class ArtifactSerializer(serializers.Serializer):
    """Serializer for Artifact."""

    change_set = serializers.DictField(
        source="changeSet",
        required=False,
        allow_null=True,
        error_messages={"invalid": "Change set must be an object."},
    )
    bash_output = serializers.CharField(
        source="bashOutput",
        required=False,
        allow_null=True,
        error_messages={"blank": "Bash output cannot be blank."},
    )
    git_patch = serializers.CharField(
        source="gitPatch",
        required=False,
        allow_null=True,
        error_messages={"blank": "Git patch cannot be blank."},
    )

    def to_representation(self, instance):
        """Ensure consistent snake_case output format."""
        ret = super().to_representation(instance)
        # Ensure all keys are in snake_case format
        return {
            "change_set": ret.get("change_set"),
            "bash_output": ret.get("bash_output"),
            "git_patch": ret.get("git_patch"),
        }


class StepSerializer(serializers.Serializer):
    """Serializer for Step matching Jules API structure."""

    id = serializers.CharField(
        required=False,
        allow_blank=True,
        error_messages={"blank": "Step ID cannot be blank."},
    )
    index = serializers.IntegerField(
        required=False,
        allow_null=True,
        error_messages={"invalid": "Step index must be an integer."},
    )
    title = serializers.CharField(
        required=False,
        allow_blank=True,
        error_messages={"blank": "Step title cannot be blank."},
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        error_messages={"blank": "Step description cannot be blank."},
    )
    state = serializers.ChoiceField(
        choices=["STATE_UNSPECIFIED", "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
        required=False,
        allow_null=True,
        error_messages={"invalid_choice": "Step state is invalid."},
    )
    artifacts = ArtifactSerializer(
        many=True,
        required=False,
        allow_null=True,
        error_messages={"invalid": "Artifacts must be a list of artifacts."},
    )

    def to_internal_value(self, data):
        """Handle camelCase from API response and provide defaults for missing fields."""
        if isinstance(data, dict):
            normalized = {
                "id": data.get("id", ""),
                "index": data.get("index"),
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "state": data.get("state", "STATE_UNSPECIFIED"),
                "artifacts": data.get("artifacts", data.get("artifact", [])),
            }
            return normalized
        return super().to_internal_value(data)

    def to_representation(self, instance):
        """Ensure consistent snake_case output format with proper step data structure."""
        ret = super().to_representation(instance)

        # Ensure state is valid (not "Unknown")
        state = ret.get("state") or "STATE_UNSPECIFIED"
        valid_states = [
            "STATE_UNSPECIFIED",
            "PENDING",
            "IN_PROGRESS",
            "COMPLETED",
            "FAILED",
        ]
        if state not in valid_states:
            state = "STATE_UNSPECIFIED"

        # Use title as primary display field, fallback to description if title is missing
        title = ret.get("title", "").strip()
        description = ret.get("description", "").strip()

        # If title is missing but description exists, use first sentence of description as title
        if not title and description:
            # Extract first sentence or first 100 chars
            sentences = re.split(r"[.!?]\s+", description)
            if sentences:
                title = sentences[0].strip()
                if len(title) > 100:
                    title = title[:97] + "..."
            else:
                title = description[:100] if len(description) > 100 else description

        return {
            "id": ret.get("id", ""),
            "index": ret.get("index"),
            "title": title,
            "description": description,
            "state": state,
            "artifacts": ret.get("artifacts") or [],
        }


class PlanSerializer(serializers.Serializer):
    """Serializer for Plan."""

    steps = StepSerializer(
        many=True,
        required=False,
        error_messages={"invalid": "Steps must be a list of step objects."},
    )
    state = serializers.ChoiceField(
        choices=["STATE_UNSPECIFIED", "PENDING", "APPROVED", "REJECTED"],
        required=False,
        allow_null=True,
        error_messages={"invalid_choice": "Plan state is invalid."},
    )

    def to_internal_value(self, data):
        """Handle camelCase from API response and provide defaults for missing fields."""
        if isinstance(data, dict):
            normalized = {
                "steps": data.get("steps", []),
                "state": data.get("state", "STATE_UNSPECIFIED"),
            }
            return normalized
        return super().to_internal_value(data)

    def to_representation(self, instance):
        """Ensure consistent snake_case output format with properly formatted steps."""
        ret = super().to_representation(instance)
        # Ensure steps array is properly formatted and state has a default
        # Filter out any None or invalid step entries and ensure states are valid
        steps = ret.get("steps") or []
        valid_steps = []
        valid_step_states = [
            "STATE_UNSPECIFIED",
            "PENDING",
            "IN_PROGRESS",
            "COMPLETED",
            "FAILED",
        ]

        for step in steps:
            if step and isinstance(step, dict):
                # Ensure step state is valid
                step_state = step.get("state", "STATE_UNSPECIFIED")
                if step_state not in valid_step_states:
                    step["state"] = "STATE_UNSPECIFIED"
                valid_steps.append(step)

        # Ensure plan state is valid
        plan_state = ret.get("state") or "STATE_UNSPECIFIED"
        valid_plan_states = ["STATE_UNSPECIFIED", "PENDING", "APPROVED", "REJECTED"]
        if plan_state not in valid_plan_states:
            plan_state = "STATE_UNSPECIFIED"

        return {
            "steps": valid_steps,
            "state": plan_state,
        }

    def validate(self, attrs):
        """Validate plan data and provide helpful error messages."""
        steps = attrs.get("steps", [])
        if steps and not isinstance(steps, list):
            raise serializers.ValidationError(
                {"steps": "Steps must be a list of step objects."}
            )
        return attrs


class PlanGeneratedActivitySerializer(serializers.Serializer):
    """Serializer for planGenerated activity."""

    plan = PlanSerializer()


class PlanApprovedActivitySerializer(serializers.Serializer):
    """Serializer for planApproved activity."""

    pass  # Empty, just indicates approval


class ProgressUpdatedActivitySerializer(serializers.Serializer):
    """Serializer for progressUpdated activity matching Jules API structure."""

    title = serializers.CharField(
        required=False,
        allow_blank=True,
        error_messages={"blank": "Progress title cannot be blank."},
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        error_messages={"blank": "Progress description cannot be blank."},
    )
    artifacts = ArtifactSerializer(
        many=True,
        required=False,
        allow_null=True,
        error_messages={"invalid": "Artifacts must be a list of artifacts."},
    )

    def to_internal_value(self, data):
        """Handle camelCase from API response and provide defaults for missing fields."""
        if isinstance(data, dict):
            normalized = {
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "artifacts": data.get("artifacts", data.get("artifact", [])),
            }
            return normalized
        return super().to_internal_value(data)

    def to_representation(self, instance):
        """Ensure consistent snake_case output format."""
        ret = super().to_representation(instance)
        # Ensure all fields are properly formatted in snake_case
        return {
            "title": ret.get("title", "").strip(),
            "description": ret.get("description", "").strip(),
            "artifacts": ret.get("artifacts") or [],
        }


class SessionCompletedActivitySerializer(serializers.Serializer):
    """Serializer for sessionCompleted activity."""

    pass  # Empty, just indicates completion


class ActivitySerializer(serializers.Serializer):
    """Serializer for Activity."""

    name = serializers.CharField(
        min_length=1,
        error_messages={
            "required": "Activity name is required.",
            "blank": "Activity name cannot be blank.",
            "min_length": "Activity name must be at least 1 character.",
        },
    )
    plan_generated = PlanGeneratedActivitySerializer(
        source="planGenerated", required=False, allow_null=True
    )
    plan_approved = PlanApprovedActivitySerializer(
        source="planApproved", required=False, allow_null=True
    )
    progress_updated = ProgressUpdatedActivitySerializer(
        source="progressUpdated", required=False, allow_null=True
    )
    session_completed = SessionCompletedActivitySerializer(
        source="sessionCompleted", required=False, allow_null=True
    )
    create_time = serializers.CharField(
        source="createTime",
        min_length=1,
        error_messages={
            "required": "Create time is required.",
            "blank": "Create time cannot be blank.",
            "min_length": "Create time must be at least 1 character.",
        },
    )

    def to_internal_value(self, data):
        """Handle camelCase from API response."""
        if isinstance(data, dict):
            normalized = {
                "name": data.get("name", ""),
                "planGenerated": data.get("planGenerated", data.get("plan_generated")),
                "planApproved": data.get("planApproved", data.get("plan_approved")),
                "progressUpdated": data.get(
                    "progressUpdated", data.get("progress_updated")
                ),
                "sessionCompleted": data.get(
                    "sessionCompleted", data.get("session_completed")
                ),
                "createTime": data.get("createTime", data.get("create_time", "")),
            }
            return normalized
        return super().to_internal_value(data)


class ApprovePlanSerializer(serializers.Serializer):
    """Serializer for approving a plan (empty body)."""

    pass


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a message to the agent."""

    message = serializers.CharField(
        required=True,
        min_length=1,
        error_messages={
            "required": "Message is required.",
            "blank": "Message cannot be blank.",
            "min_length": "Message must be at least 1 character.",
        },
    )


class JulesSettingsSerializer(serializers.Serializer):
    """Serializer for Jules settings (read-only, returns masked API key)."""

    api_key_configured = serializers.BooleanField()
    masked_api_key = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class ApiKeyUpdateSerializer(serializers.Serializer):
    """Serializer for updating API key."""

    api_key = serializers.CharField(
        required=True,
        min_length=1,
        error_messages={
            "required": "API key is required.",
            "blank": "API key cannot be blank.",
            "min_length": "API key must be at least 1 character.",
        },
    )


class JulesActivitySerializer(serializers.ModelSerializer):
    """Serializer for cached Jules activities."""

    session_id = serializers.CharField(source="session.session_id")

    class Meta:
        model = JulesActivity
        fields = [
            "id",
            "session_id",
            "name",
            "activity_type",
            "payload",
            "create_time",
            "created_at",
        ]
