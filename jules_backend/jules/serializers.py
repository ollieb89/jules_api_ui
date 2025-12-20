from rest_framework import serializers


class GitHubSourceMetadataSerializer(serializers.Serializer):
    """Serializer for GitHub source metadata."""

    repository = serializers.CharField()
    branch = serializers.CharField(required=False, allow_null=True)
    commit = serializers.CharField(required=False, allow_null=True)

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

    name = serializers.CharField()
    display_name = serializers.CharField(source="displayName")
    github_metadata = GitHubSourceMetadataSerializer(
        source="githubMetadata", required=False, allow_null=True
    )

    def to_internal_value(self, data):
        """Handle camelCase from API response."""
        if isinstance(data, dict):
            normalized = {
                "name": data.get("name", ""),
                "displayName": data.get("displayName", data.get("display_name", "")),
                "githubMetadata": data.get("githubMetadata", data.get("github_metadata")),
            }
            return normalized
        return super().to_internal_value(data)


class SessionSerializer(serializers.Serializer):
    """Serializer for Session."""

    name = serializers.CharField()
    display_name = serializers.CharField(source="displayName")
    state = serializers.ChoiceField(
        choices=["STATE_UNSPECIFIED", "ACTIVE", "COMPLETED", "FAILED"]
    )
    prompt = serializers.CharField()
    source = serializers.CharField()
    create_time = serializers.CharField(source="createTime")
    update_time = serializers.CharField(source="updateTime")

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

    prompt = serializers.CharField(required=True)
    source = serializers.CharField(required=True)


class ArtifactSerializer(serializers.Serializer):
    """Serializer for Artifact."""

    change_set = serializers.DictField(source="changeSet", required=False, allow_null=True)
    bash_output = serializers.CharField(source="bashOutput", required=False, allow_null=True)
    git_patch = serializers.CharField(source="gitPatch", required=False, allow_null=True)


class StepSerializer(serializers.Serializer):
    """Serializer for Step."""

    description = serializers.CharField()
    state = serializers.ChoiceField(
        choices=["STATE_UNSPECIFIED", "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]
    )
    artifacts = ArtifactSerializer(many=True, required=False, allow_null=True)


class PlanSerializer(serializers.Serializer):
    """Serializer for Plan."""

    steps = StepSerializer(many=True)
    state = serializers.ChoiceField(
        choices=["STATE_UNSPECIFIED", "PENDING", "APPROVED", "REJECTED"]
    )


class PlanGeneratedActivitySerializer(serializers.Serializer):
    """Serializer for planGenerated activity."""

    plan = PlanSerializer()


class PlanApprovedActivitySerializer(serializers.Serializer):
    """Serializer for planApproved activity."""

    pass  # Empty, just indicates approval


class ProgressUpdatedActivitySerializer(serializers.Serializer):
    """Serializer for progressUpdated activity."""

    step_index = serializers.IntegerField(source="stepIndex")
    step_state = serializers.ChoiceField(
        source="stepState",
        choices=["STATE_UNSPECIFIED", "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
    )
    artifacts = ArtifactSerializer(many=True, required=False, allow_null=True)


class SessionCompletedActivitySerializer(serializers.Serializer):
    """Serializer for sessionCompleted activity."""

    pass  # Empty, just indicates completion


class ActivitySerializer(serializers.Serializer):
    """Serializer for Activity."""

    name = serializers.CharField()
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
    create_time = serializers.CharField(source="createTime")

    def to_internal_value(self, data):
        """Handle camelCase from API response."""
        if isinstance(data, dict):
            normalized = {
                "name": data.get("name", ""),
                "planGenerated": data.get("planGenerated", data.get("plan_generated")),
                "planApproved": data.get("planApproved", data.get("plan_approved")),
                "progressUpdated": data.get("progressUpdated", data.get("progress_updated")),
                "sessionCompleted": data.get("sessionCompleted", data.get("session_completed")),
                "createTime": data.get("createTime", data.get("create_time", "")),
            }
            return normalized
        return super().to_internal_value(data)


class ApprovePlanSerializer(serializers.Serializer):
    """Serializer for approving a plan (empty body)."""

    pass


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a message to the agent."""

    message = serializers.CharField(required=True)

