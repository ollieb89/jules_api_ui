from django.apps import AppConfig


class JulesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "jules"

    def ready(self):
        """Register cleanup handler for httpx clients on shutdown."""
        from .services import cleanup_clients
        import atexit

        atexit.register(cleanup_clients)
