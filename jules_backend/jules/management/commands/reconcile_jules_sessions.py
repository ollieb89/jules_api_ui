from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from jules.tasks import poll_sessions_and_activities


class Command(BaseCommand):
    help = "Reconcile Jules sessions and activities into the local database."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--interval",
            type=int,
            default=0,
            help=(
                "Seconds between reconciliation cycles. Use 0 to run once. "
                "Recommended for periodic reconciliation."
            ),
        )
        parser.add_argument(
            "--force-refresh",
            action="store_true",
            help="Force refresh sessions and activities even if cache is fresh.",
        )

    def handle(self, *args, **options) -> None:
        interval = options["interval"]
        force_refresh = options["force_refresh"]

        while True:
            result = poll_sessions_and_activities(force_refresh=force_refresh)
            self.stdout.write(
                self.style.SUCCESS(
                    "Reconciled {sessions} sessions and {new_activities} activities.".format(
                        **result
                    )
                )
            )

            if interval <= 0:
                break

            time.sleep(interval)
