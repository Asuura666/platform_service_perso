import os
from pathlib import Path
from datetime import timedelta

# === Chemins de base ===
BASE_DIR = Path(__file__).resolve().parent.parent

# === Clé & Debug ===
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "CHANGE-ME")
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() in ("1", "true", "yes", "on")

# === Hôtes autorisés ===
def _split_env(name: str):
    raw = os.environ.get(name, "")
    if not raw:
        return []
    # supporte virgule ou point-virgule
    parts = [p.strip() for p in raw.replace(";", ",").split(",") if p.strip()]
    return parts

ALLOWED_HOSTS = _split_env("DJANGO_ALLOWED_HOSTS")

# === Applications ===
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Tiers
    "rest_framework",
    "corsheaders",

    # App métier
    "core",
]

# === Middleware ===
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise pour servir les fichiers statiques derrière Gunicorn
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "api.urls"
WSGI_APPLICATION = "api.wsgi.application"
ASGI_APPLICATION = "api.asgi.application"

# === Templates ===
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# === Base de données (Docker : Postgres ; fallback dev : SQLite) ===
if os.environ.get("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "app"),
            "USER": os.environ.get("POSTGRES_USER", "app"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "app"),
            "HOST": os.environ.get("POSTGRES_HOST", "db"),  # service docker-compose
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }
else:
    # Dev local sans Postgres
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# === Mots de passe ===
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# === i18n ===
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True

# === Fichiers statiques & médias ===
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # monté dans docker : /app/staticfiles
STATICFILES_DIRS = []  # ajoute éventuellement BASE_DIR/'static' si tu as des assets locaux

# WhiteNoise: compression + cache-busting
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"  # monté dans docker : /app/media

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# === Sécurité production ===
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 an
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    X_FRAME_OPTIONS = "DENY"

# === CORS / CSRF ===
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = _split_env("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = _split_env("CSRF_TRUSTED_ORIGINS")
# Astuce: si l'utilisateur a mis juste le domaine sans schéma, on ajoute https:// automatiquement
def _ensure_scheme(url: str) -> str:
    return url if "://" in url else f"https://{url}"

CSRF_TRUSTED_ORIGINS = [_ensure_scheme(u) for u in CSRF_TRUSTED_ORIGINS]

# === REST Framework ===
_default_auth = [
    "rest_framework.authentication.SessionAuthentication",
]
try:
    # si simplejwt est installé, on l’active en priorité
    import rest_framework_simplejwt  # noqa: F401
    _default_auth.insert(0, "rest_framework_simplejwt.authentication.JWTAuthentication")
except Exception:
    pass

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": _default_auth,
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

# === Logging simple (console) ===
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
