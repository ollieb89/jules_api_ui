from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("jules", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="JulesSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_id", models.CharField(max_length=255, unique=True)),
                ("source", models.CharField(blank=True, max_length=255)),
                ("state", models.CharField(blank=True, max_length=64)),
                ("create_time", models.DateTimeField(blank=True, null=True)),
                ("last_polled_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "jules_sessions",
            },
        ),
        migrations.CreateModel(
            name="JulesActivity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("activity_type", models.CharField(blank=True, max_length=64)),
                ("payload", models.JSONField(default=dict)),
                ("create_time", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="activities",
                        to="jules.julessession",
                    ),
                ),
            ],
            options={
                "db_table": "jules_activities",
            },
        ),
        migrations.AddConstraint(
            model_name="julesactivity",
            constraint=models.UniqueConstraint(
                fields=("session", "name"), name="unique_session_activity"
            ),
        ),
    ]
