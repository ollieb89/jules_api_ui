from __future__ import annotations


class APIError(Exception):
    def __init__(
        self,
        detail: str,
        *,
        status_code: int,
        error_type: str,
        title: str,
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code
        self.error_type = error_type
        self.title = title


class NotFoundError(APIError):
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(
            detail,
            status_code=404,
            error_type="https://api.jules.dev/errors/not-found",
            title="Not Found",
        )


class ValidationError(APIError):
    def __init__(self, detail: str = "Validation failed") -> None:
        super().__init__(
            detail,
            status_code=422,
            error_type="https://api.jules.dev/errors/validation-error",
            title="Validation Failed",
        )


class ConflictError(APIError):
    def __init__(self, detail: str = "Conflict") -> None:
        super().__init__(
            detail,
            status_code=409,
            error_type="https://api.jules.dev/errors/conflict",
            title="Conflict",
        )


class UnauthorizedError(APIError):
    def __init__(self, detail: str = "Unauthorized") -> None:
        super().__init__(
            detail,
            status_code=401,
            error_type="https://api.jules.dev/errors/unauthorized",
            title="Unauthorized",
        )


class ForbiddenError(APIError):
    def __init__(self, detail: str = "Forbidden") -> None:
        super().__init__(
            detail,
            status_code=403,
            error_type="https://api.jules.dev/errors/forbidden",
            title="Forbidden",
        )
