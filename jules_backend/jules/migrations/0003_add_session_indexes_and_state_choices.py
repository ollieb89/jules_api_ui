# Generated manually for model changes
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jules", "0002_add_sessions_activities"),
    ]

    operations = [
        migrations.AlterField(
            model_name="julessession",
            name="state",
            field=models.CharField(
                choices=[
                    ("STATE_UNSPECIFIED", "Unspecified"),
                    ("STATE_PENDING", "Pending"),
                    ("STATE_ACTIVE", "Active"),
                    ("STATE_COMPLETED", "Completed"),
                    ("STATE_FAILED", "Failed"),
                ],
                default="STATE_UNSPECIFIED",
                max_length=32,
            ),
        ),
        migrations.AddIndex(
            model_name="julessession",
            index=models.Index(fields=["update_time"], name="jules_sessi_update__idx"),
        ),
        migrations.AddIndex(
            model_name="julessession",
            index=models.Index(fields=["last_synced_at"], name="jules_sessi_last_sy_idx"),
        ),
    ]
