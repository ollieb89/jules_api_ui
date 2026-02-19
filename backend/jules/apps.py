import logging

from django.apps import AppConfig
from django.db.utils import OperationalError, ProgrammingError

logger = logging.getLogger(__name__)


class JulesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "jules"

    def ready(self) -> None:
        import sys
        from django_q.models import Schedule

        # Avoid running schedule setup during migrations or tests
        if any(cmd in sys.argv for cmd in ["makemigrations", "migrate", "test", "check"]):
            return

        try:
            Schedule.objects.get_or_create(
                name="poll-jules-activities",
                defaults={
                    "func": "jules.tasks.poll_sessions_and_activities",
                    "schedule_type": Schedule.MINUTES,
                    "minutes": 1,
                    "repeats": -1,
                },
            )
        except (OperationalError, ProgrammingError) as exc:
            logger.warning("Skipping Django-Q schedule setup: %s", exc)
