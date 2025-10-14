from django.db import migrations, models


def create_default_features(apps, schema_editor):
    Feature = apps.get_model("accounts", "Feature")
    defaults = [
        (
            "webtoon_management",
            "Gestion des webtoons",
            "Accès complet aux fonctionnalités de création et suivi des webtoons.",
        ),
        (
            "scraper_access",
            "Outil de scraping",
            "Autorise le lancement et le suivi des scrapes automatiques.",
        ),
        (
            "reporting_dashboard",
            "Tableau de bord analytique",
            "Permet de consulter les tableaux de bord et rapports statistiques.",
        ),
    ]
    for code, name, description in defaults:
        Feature.objects.get_or_create(
            code=code,
            defaults={"name": name, "description": description},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_alter_user_email_alter_user_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="Feature",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "code",
                    models.CharField(
                        help_text="Identifiant unique de la fonctionnalité (utilisé par le front et les permissions).",
                        max_length=64,
                        unique=True,
                        verbose_name="code",
                    ),
                ),
                ("name", models.CharField(max_length=128, verbose_name="nom")),
                ("description", models.TextField(blank=True, verbose_name="description")),
            ],
            options={
                "ordering": ("name",),
            },
        ),
        migrations.AddField(
            model_name="user",
            name="features",
            field=models.ManyToManyField(
                blank=True,
                help_text="Fonctionnalités auxquelles cet utilisateur a accès.",
                related_name="users",
                to="accounts.feature",
                verbose_name="fonctions disponibles",
            ),
        ),
        migrations.RunPython(create_default_features, migrations.RunPython.noop),
    ]
