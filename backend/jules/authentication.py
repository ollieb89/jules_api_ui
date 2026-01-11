from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication


class QueryParamJWTAuthentication(JWTAuthentication):
    """Allow JWT auth via query param for streaming endpoints."""

    def authenticate(self, request: Request):
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        raw_token = request.query_params.get("token")
        if not raw_token:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
