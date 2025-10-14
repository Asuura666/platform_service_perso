import csv
import io
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Iterable

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from api.models import Webtoon


class Command(BaseCommand):
    help = "Importe des webtoons depuis un fichier CSV"

    COLUMN_ALIASES = {
        "title": {"name", "titre", "title"},
        "type": {"type", "genre"},
        "chapter": {"dernierchapitrelu", "chapitre", "chapter"},
        "last_read_date": {"miseajour", "misejour", "dernierelecture", "datelecture"},
        "tier": {"tier"},
        "rating": {"note", "rating"},
        "status": {"status", "etat"},
        "language": {"langue", "language"},
        "comment": {"commentaire", "notes"},
        "link": {"lienvers", "lien", "url"},
        "image_url": {"imageurl", "image", "cover"},
        "release_day": {"jourdesortie", "jour"},
    }

    TIER_TO_RATING = {
        "s": 5.0,
        "a": 4.5,
        "b": 3.5,
        "c": 2.5,
        "d": 1.5,
    }

    STATUS_MAP = {
        "lecture": "En cours",
        "en cours": "En cours",
        "arreter": "Terminé",
        "terminé": "Terminé",
        "termine": "Terminé",
        "pause": "Hiatus",
        "hiatus": "Hiatus",
    }

    LANGUAGE_MAP = {
        "ang": "Anglais",
        "anglais": "Anglais",
        "en": "Anglais",
        "fr": "Francais",
        "fra": "Francais",
        "francais": "Francais",
    }

    DATE_PATTERNS = (
        "%B %d, %Y %I:%M %p",
        "%d %B %Y %H:%M",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            required=True,
            help="Nom d'utilisateur qui possédera les webtoons importés",
        )
        parser.add_argument(
            "--file",
            default="data/Webtoon Manga.csv",
            help="Chemin du fichier CSV",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["file"])
        if not csv_path.exists():
            raise CommandError(f"Fichier introuvable: {csv_path}")

        User = get_user_model()
        try:
            owner = User.objects.get(username=options["user"])
        except User.DoesNotExist as exc:
            raise CommandError(f"Utilisateur {options['user']} introuvable") from exc

        reader = self._open_reader(csv_path)
        if reader.fieldnames is None:
            raise CommandError("Le fichier CSV est vide ou mal formé.")

        imported = 0
        for index, row in enumerate(reader, start=2):  # ligne 2 = première ligne de données
            payload = self._map_row(row)
            if not payload["title"]:
                self.stdout.write(self.style.WARNING(f"Ligne {index}: titre manquant, entrée ignorée."))
                continue

            webtoon, created = Webtoon.objects.update_or_create(
                user=owner,
                title=payload["title"],
                defaults=payload,
            )
            imported += 1
            action = "créé" if created else "mis à jour"
            self.stdout.write(self.style.SUCCESS(f"{action}: {webtoon.title}"))

        self.stdout.write(self.style.SUCCESS(f"Import terminé ({imported} webtoon(s))."))

    def _open_reader(self, path: Path) -> csv.DictReader:
        encodings = ("utf-8-sig", "utf-8", "cp1252")
        last_error: Exception | None = None
        for encoding in encodings:
            try:
                text = path.read_text(encoding=encoding)
                buffer = io.StringIO(text)
                return csv.DictReader(buffer)
            except UnicodeDecodeError as exc:
                last_error = exc
        raise CommandError(f"Impossible de décoder le fichier CSV ({last_error}).")

    def _map_row(self, row: dict[str, str]) -> dict[str, object]:
        normalized = {self._normalize_key(key): (value or "").strip() for key, value in row.items()}

        def extract(names: Iterable[str]) -> str:
            for name in names:
                if name in normalized:
                    return normalized[name]
            return ""

        title = extract(self.COLUMN_ALIASES["title"]).strip()
        type_value = extract(self.COLUMN_ALIASES["type"]).strip() or "Webtoon"
        chapter_raw = extract(self.COLUMN_ALIASES["chapter"])
        last_read_raw = extract(self.COLUMN_ALIASES["last_read_date"])
        tier_raw = extract(self.COLUMN_ALIASES["tier"]).lower()
        rating_raw = extract(self.COLUMN_ALIASES["rating"])
        status_raw = extract(self.COLUMN_ALIASES["status"]).lower()
        language_raw = extract(self.COLUMN_ALIASES["language"]).lower()
        comment_raw = extract(self.COLUMN_ALIASES["comment"])
        link_raw = extract(self.COLUMN_ALIASES["link"])
        image_url_raw = extract(self.COLUMN_ALIASES["image_url"])
        release_day_raw = extract(self.COLUMN_ALIASES["release_day"])

        rating = self._coerce_rating(rating_raw, tier_raw)
        chapter = self._coerce_int(chapter_raw)
        last_read_date = self._parse_date(last_read_raw)
        status = self.STATUS_MAP.get(status_raw, "En cours")
        language = self.LANGUAGE_MAP.get(language_raw, language_raw.capitalize() or "Francais")

        comment = comment_raw
        if release_day_raw:
            suffix = f"Jour de sortie: {release_day_raw}"
            comment = f"{comment} | {suffix}" if comment else suffix

        return {
            "title": title,
            "type": type_value,
            "language": language,
            "rating": rating,
            "status": status,
            "chapter": chapter if chapter > 0 else 1,
            "link": link_raw,
            "last_read_date": last_read_date,
            "comment": comment,
            "image_url": image_url_raw,
        }

    @staticmethod
    def _normalize_key(value: str) -> str:
        value = value.replace("\u00a0", " ")
        value = unicodedata.normalize("NFKD", value)
        return "".join(ch for ch in value.lower() if ch.isalnum())

    def _coerce_rating(self, rating_raw: str, tier_raw: str) -> float:
        try:
            rating = float(rating_raw.replace(",", "."))
        except (TypeError, ValueError, AttributeError):
            rating = self.TIER_TO_RATING.get(tier_raw, 0.0)
        return max(0.0, min(5.0, rating))

    @staticmethod
    def _coerce_int(value: str) -> int:
        try:
            return int(float(value.replace(",", ".")))
        except (TypeError, ValueError, AttributeError):
            return 0

    def _parse_date(self, value: str):
        if not value:
            return None
        for pattern in self.DATE_PATTERNS:
            try:
                return datetime.strptime(value, pattern).date()
            except ValueError:
                continue
        return None
