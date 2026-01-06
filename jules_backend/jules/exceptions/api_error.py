from typing import Any


from typing import Any


class ApiRequestError(Exception):
    """Represents an error response from the Jules API or network layer."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        details: dict[str, Any] | None = None,
        user_message: str | None = None,
        retry_after: float | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}
        self.user_message = user_message or message
        self.retry_after = retry_after
