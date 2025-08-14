# backend/core/management/commands/import_webtoons.py
import csv
from decimal import Decimal, InvalidOperation
from datetime import datetime, time
from typing import Optional

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import DecimalField, FloatField
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from core.models import FeatureCategory, Content, Chapter, UserProgress

# ---------- En-têtes FR/EN (tolérant) ----------
HEADERS = {
    "title": ["title", "titre", "name", "nom"],
    "type": ["type", "catégorie", "categorie", "category", "genre"],
    "language": ["language", "langue"],
    "status": ["status", "statut"],
    "rating": ["rating", "note", "tier"],
    "description": ["description", "résumé", "resume", "commentaire"],
    "link": ["link", "lien", "url", "lien vers"],
    "last_chapter": [
        "lastchapter", "dernier chapitre", "dernier chapitre lu",
        "chapitre", "chapitre actuel", "current chapter", "chapter"
    ],
    "release_day": ["release day", "jour de sortie"],
    "author": ["author", "auteur"],
    "cover_image": ["cover", "image", "cover_image", "thumbnail", "miniature"],

    # Progression perso
    "last_read_at": [
        "mise à jour", "mise a jour", "date de mise à jour", "updated",
        "last read at", "lastreadat"
    ],
}

STATUS_NORMALIZE = {
    "en cours": "ongoing", "ongoing": "ongoing",
    "termine": "completed", "terminé": "completed", "completed": "completed", "fini": "completed",
    "pause": "hiatus", "en pause": "hiatus", "hiatus": "hiatus",
    "": "unknown", "inconnu": "unknown", "unknown": "unknown",
}

def norm(s: Optional[str]) -> str:
    return (s or "").strip()

def key(s: str) -> str:
    return norm(s).lower()

def match_header(h: str, wanted: str) -> bool:
    h = key(h)
    if h == wanted:
        return True
    return h in (key(x) for x in HEADERS.get(wanted, []))

def status_to_db(v: str) -> str:
    return STATUS_NORMALIZE.get(key(v), "unknown")

# ---------- Parsing robuste du rating ----------
def parse_rating(raw: str) -> Optional[float]:
    """
    Convertit une note en float.
    - '4,50' -> 4.5
    - 'S'/'SS'/'S+' -> 5.0 ; 'A' -> 4.5 ; 'B' -> 3.5 ; 'C' -> 2.5
    - vide/illisible -> None (on n'écrase pas la valeur existante)
    """
    v = norm(raw)
    if not v:
        return None

    up = v.upper()
    if up in {"S", "SS", "S+"}:
        return 5.0
    if up == "A":
        return 4.5
    if up == "B":
        return 3.5
    if up == "C":
        return 2.5

    # Supprime tout sauf chiffres, virgules, points, signes
    cleaned = "".join(ch for ch in v if ch.isdigit() or ch in ",.-")
    if cleaned.count(",") > 1 and cleaned.count(".") == 0:
        # trop de virgules -> on tente un dernier recours en gardant chiffres/point
        cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned.replace(",", "."))
    except ValueError:
        return None

def coerce_rating_for_field(val: Optional[float]) -> Optional[object]:
    """
    Convertit vers le type du champ 'rating' (DecimalField ou FloatField).
    Retourne None si val est None ou si conversion impossible.
    """
    if val is None:
        return None
    try:
        field = Content._meta.get_field("rating")
    except Exception:
        return float(val)

    if isinstance(field, DecimalField):
        try:
            return Decimal(str(val))
        except (InvalidOperation, ValueError):
            return None
    # Float ou autre
    return float(val)

# ---------- Dates “Mise à Jour” ----------
COMMON_DATE_FORMATS = (
    "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%Y-%m-%d", "%m/%d/%Y", "%d.%m.%Y"
)

def parse_any_date(raw: str):
    v = norm(raw)
    if not v:
        return None

    # 1) ISO avec heure
    dt = parse_datetime(v)
    if dt:
        return timezone.make_aware(dt) if timezone.is_naive(dt) else dt

    # 2) Date simple
    d = parse_date(v)
    if d:
        return timezone.make_aware(datetime.combine(d, time(12, 0)))

    # 3) Formats courants
    for fmt in COMMON_DATE_FORMATS:
        try:
            d = datetime.strptime(v, fmt).date()
            return timezone.make_aware(datetime.combine(d, time(12, 0)))
        except Exception:
            pass

    return None

class Command(BaseCommand):
    help = (
        "Importe un CSV (webtoon/manga) et, si présent, alimente la progression utilisateur "
        "(colonne 'Mise à Jour' + 'Dernier chapitre lu'). Conversion rating robuste."
    )

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=str, help="Chemin du CSV")
        parser.add_argument("--delimiter", type=str, default="", help="Forcer un séparateur, ex: ';' ',' '\\t' '|'")
        parser.add_argument("--default-category", type=str, default="Webtoon Book", help="Catégorie par défaut")
        parser.add_argument("--progress-user", type=str, default=None,
                            help="Username pour stocker UserProgress (sinon premier superuser)")
        parser.add_argument("--dry-run", action="store_true", help="N'écrit rien en base")
        parser.add_argument("--strict", action="store_true", help="Erreur fatale au lieu d'ignorer une valeur invalide")

    # --- CSV helpers ---
    def _open_csv(self, path: str):
        encodings = ("utf-8-sig", "utf-8", "cp1252", "latin-1")
        last = None
        for enc in encodings:
            try:
                f = open(path, "r", encoding=enc, newline="")
                sample = f.read(8192); f.seek(0)
                return f, sample
            except UnicodeDecodeError as e:
                last = e
        if last: raise last

    def _reader(self, fh, sample: str, forced: str):
        if forced:
            return csv.DictReader(fh, delimiter=forced)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=";,|\t,")
        except csv.Error:
            dialect = csv.excel
        return csv.DictReader(fh, dialect=dialect)

    def _build_keymap(self, fieldnames):
        keymap = {}
        for col in fieldnames or []:
            for wanted in HEADERS:
                if wanted not in keymap and match_header(col, wanted):
                    keymap[wanted] = col
        return keymap

    def _pick(self, row, keymap, name):
        col = keymap.get(name)
        return norm(row.get(col, "")) if col else ""

    @transaction.atomic
    def handle(self, *args, **opts):
        path = opts["csv_path"]
        forced = opts["delimiter"]
        default_cat = opts["default_category"]
        dry = opts["dry_run"]
        strict = opts["strict"]

        # user cible pour la progression
        target_user = None
        if opts["progress_user"]:
            try:
                target_user = get_user_model().objects.get(username=opts["progress_user"])
            except get_user_model().DoesNotExist:
                raise CommandError(f"Utilisateur '{opts['progress_user']}' introuvable.")
        else:
            target_user = get_user_model().objects.filter(is_superuser=True).first()

        try:
            fh, sample = self._open_csv(path)
        except FileNotFoundError:
            raise CommandError(f"File not found: {path}")

        stats = dict(rows=0, created=0, updated=0, new_categories=0, chapter_refs=0, progress=0, warnings=0)

        with fh:
            reader = self._reader(fh, sample, forced)
            if not reader.fieldnames:
                raise CommandError("En-tête introuvable dans le CSV.")
            keymap = self._build_keymap(reader.fieldnames)

            if "title" not in keymap:
                raise CommandError("Colonne obligatoire manquante : Title/Titre/Name.")

            for row in reader:
                stats["rows"] += 1
                title = self._pick(row, keymap, "title")
                if not title:
                    continue

                # Catégorie
                cat_name = self._pick(row, keymap, "type") or default_cat
                category, new_cat = FeatureCategory.objects.get_or_create(name=cat_name)
                if new_cat: stats["new_categories"] += 1

                # Rating (robuste)
                rating_raw = self._pick(row, keymap, "rating")
                rating_value = parse_rating(rating_raw)
                rating_value = coerce_rating_for_field(rating_value)

                payload = {
                    "title": title,
                    "author": self._pick(row, keymap, "author"),
                    "language": self._pick(row, keymap, "language"),
                    "status": status_to_db(self._pick(row, keymap, "status")),
                    "description": self._pick(row, keymap, "description"),
                    "link": self._pick(row, keymap, "link"),
                    "release_day": self._pick(row, keymap, "release_day"),
                    "cover_image": self._pick(row, keymap, "cover_image"),
                    "feature_category": category,
                }
                if rating_value is not None:
                    payload["rating"] = rating_value

                if dry:
                    # on ne fait que valider le parsing
                    continue

                # Création/mise à jour
                content, created = Content.objects.get_or_create(
                    title=payload["title"], feature_category=category, defaults=payload
                )
                if created:
                    stats["created"] += 1
                else:
                    changed = False
                    for k, v in payload.items():
                        if getattr(content, k, None) != v and v != "":
                            setattr(content, k, v)
                            changed = True
                    if changed:
                        content.save()
                        stats["updated"] += 1

                # Référence de chapitre "dernier chapitre lu" (facultatif)
                last_ch = self._pick(row, keymap, "last_chapter")
                if last_ch:
                    try:
                        _, ref_created = Chapter.objects.get_or_create(
                            content=content, chapter_number=str(last_ch)
                        )
                        if ref_created: stats["chapter_refs"] += 1
                    except Exception as e:
                        stats["warnings"] += 1
                        if strict: raise
                        self.stdout.write(self.style.WARNING(f"[WARN] Ligne '{title}': chapitre '{last_ch}' ignoré ({e})."))

                # Progression perso depuis "Mise à Jour" (si user cible)
                if target_user:
                    last_read_at = self._pick(row, keymap, "last_read_at")
                    if last_read_at or last_ch:
                        dt = parse_any_date(last_read_at) or timezone.now()
                        try:
                            up, _ = UserProgress.objects.get_or_create(user=target_user, content=content)
                            if last_ch:
                                try:
                                    up.last_chapter = int(last_ch)
                                except (TypeError, ValueError):
                                    up.last_chapter = None
                            up.last_read_at = dt
                            up.save()
                            stats["progress"] += 1
                        except Exception as e:
                            stats["warnings"] += 1
                            if strict: raise
                            self.stdout.write(self.style.WARNING(
                                f"[WARN] Progress '{title}' ignorée (date='{last_read_at}', ch='{last_ch}') : {e}"
                            ))

        self.stdout.write(self.style.SUCCESS(
            "Import terminé : "
            f"rows={stats['rows']}, created={stats['created']}, updated={stats['updated']}, "
            f"new_categories={stats['new_categories']}, chapter_refs={stats['chapter_refs']}, "
            f"progress={stats['progress']}, warnings={stats['warnings']}"
        ))
