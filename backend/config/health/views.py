from django.http import JsonResponse


def health_check(request):  # noqa: ARG001
    """Health check endpoint."""
    return JsonResponse({"status": "ok"})
