from __future__ import annotations

from django.core.management.base import BaseCommand

from jules.services import JulesApiClient
from jules.sync import upsert_activities, upsert_session


class Command(BaseCommand):
    help = "Sync Jules sessions and activities into the local database."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--page-size",
            type=int,
            default=100,
            help="Page size for fetching sessions and activities.",
        )

    def handle(self, *args, **options) -> None:
        client = JulesApiClient()
        page_size = options["page_size"]
        page_token = None
        synced_sessions = 0
        synced_activities = 0

        try:
            while True:
                try:
                    data = client.list_sessions(page_size=page_size, page_token=page_token)
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Failed to fetch sessions: {e}")
                    )
                    break

                sessions = data.get("sessions", [])
                for session_data in sessions:
                    try:
                        session = upsert_session(session_data)
                        synced_sessions += 1

                        activity_token = None
                        while True:
                            try:
                                activities_payload = client.list_activities(
                                    session_id=session.name,
                                    page_size=page_size,
                                    page_token=activity_token,
                                )
                            except Exception as e:
                                self.stdout.write(
                                    self.style.WARNING(
                                        f"Failed to fetch activities for {session.name}: {e}"
                                    )
                                )
                                break

                            activities = activities_payload.get("activities", [])
                            upsert_activities(session, activities)
                            synced_activities += len(activities)
                            activity_token = activities_payload.get("nextPageToken")
                            if not activity_token:
                                break
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Failed to sync session {session_data.get('name', 'unknown')}: {e}"
                            )
                        )
                        continue

                page_token = data.get("nextPageToken")
                if not page_token:
                    break

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Sync operation failed: {e}")
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Synced {synced_sessions} sessions and {synced_activities} activities."
            )
        )
