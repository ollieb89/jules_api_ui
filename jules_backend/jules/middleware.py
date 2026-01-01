import uuid

from django.http import HttpRequest, HttpResponse

from .utils import get_correlation_id, reset_correlation_id, set_correlation_id


class CorrelationIdMiddleware:
    header_name = "X-Correlation-ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        correlation_id = get_correlation_id(request) or str(uuid.uuid4())
        token = set_correlation_id(correlation_id)
        request.correlation_id = correlation_id
        try:
            response = self.get_response(request)
        finally:
            reset_correlation_id(token)
        response[self.header_name] = correlation_id
        return response
