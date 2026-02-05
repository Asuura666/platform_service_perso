# 🚀 Deployment Guide — Webtoon Book

## Architecture de Production

```
Internet (HTTPS)
    │
    ▼
Nginx (host) — SSL termination + reverse proxy
    │
    ├── / → Frontend container (React SPA, port 3000)
    ├── /api/ → Backend container (Django/Gunicorn, port 8100)
    ├── /admin/ → Backend container
    ├── /static/ → Fichiers statiques Django (servis par nginx)
    └── /media/ → Fichiers media (images webtoons)
```

## Containers Docker

| Service | Image | Port (host) | Description |
|---------|-------|-------------|-------------|
| **frontend** | nginx:1.27-alpine + React build | 127.0.0.1:3000 | SPA React (multi-stage: build Node → serve nginx) |
| **web** | python:3.12-slim + Django | 127.0.0.1:8100 | API REST (Gunicorn, 3 workers) |
| **worker** | python:3.12-slim + Celery | - | Tâches async (scraping) |
| **db** | postgres:16-alpine | interne | PostgreSQL |
| **redis** | redis:7-alpine | interne | Cache + Celery broker |

## Fichiers Clés

- `docker-compose.prod.yml` — Compose de production
- `.env.prod` — Variables d'environnement (⚠️ ne JAMAIS commiter)
- `frontend/Dockerfile` — Multi-stage build (Node → nginx)
- `frontend/nginx.conf` — Config nginx du container frontend
- `.dockerignore` / `frontend/.dockerignore` — Exclusions du build context

## Domaine et SSL

- **URL** : https://webtoon.apps.ilanewep.cloud
- **Certificat** : Let's Encrypt (renouvellement auto par certbot)
- **Nginx config** : `/etc/nginx/sites-available/webtoon`

## Sécurité

### Headers HTTP (nginx)
- `Strict-Transport-Security` (HSTS, 1 an)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Django
- `DEBUG=False`
- `SECRET_KEY` aléatoire (64 chars)
- `ALLOWED_HOSTS` restreint au domaine
- `CORS_ALLOWED_ORIGINS` restreint au domaine frontend
- `CSRF_TRUSTED_ORIGINS` configuré
- Rate limiting activé (100/h anon, 2000/j user)

### Réseau
- Ports Docker bindés sur `127.0.0.1` uniquement (pas d'exposition directe)
- PostgreSQL et Redis accessibles uniquement en interne (Docker network)
- HTTPS obligatoire (redirect HTTP → HTTPS)

## Commandes Utiles

```bash
# Démarrer
cd /home/debian/platform_service_test
docker compose -f docker-compose.prod.yml up -d

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f frontend

# Arrêter
docker compose -f docker-compose.prod.yml down

# Rebuild après changement de code
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Créer un superuser
docker compose -f docker-compose.prod.yml exec web python manage.py createsuperuser

# Importer les webtoons depuis CSV
docker compose -f docker-compose.prod.yml exec web python manage.py import_webtoons --user PSEUDO --file "data/Webtoon Manga.csv"

# Schema OpenAPI
docker compose -f docker-compose.prod.yml exec web python manage.py spectacular --file docs/openapi-schema.yaml
```

## Bugs Corrigés (Phase 2)

1. **`accounts/tests.py`** : `response.json()` → `response.json()["results"]` (pagination DRF)
2. **`frontend/src/pages/WebtoonPage.tsx:152`** : `....` → `...` (spread operator typo)
3. **`frontend/src/components/GlobalErrorBoundary.tsx:40`** : `process.env.NODE_ENV` → `import.meta.env.DEV` (Vite compat)
