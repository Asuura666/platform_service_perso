# Architecture du module de scraping

Ce document d\u00e9crit comment la fonctionnalit\u00e9 de scraping asynchrone s'int\u00e8gre dans la plateforme.

## Vue d'ensemble

- **App Django** : `scraper`
- **T\u00e2ches asynchrones** : Celery
- **Broker / Cache** : Redis
- **Stockage** : base relationnelle (PostgreSQL en production) + syst\u00e8me de fichiers pour les images
- **Clients** : API REST (JWT) + worker Celery

```
Utilisateur -> API Django -> Cr\u00e9ation d'un ScrapeJob
                                |
                                v
                          Celery (Redis)
                                |
                                v
                   Worker -> crawler Crawl4AI -> persistance
```

## Workflow

1. L'utilisateur d\u00e9clenche un scraping via l'endpoint `POST /api/scraper/jobs/`.
2. L'API cr\u00e9e un `ScrapeJob` et appelle `enqueue_scrape(job_id)` dans `scraper.tasks`.
3. Si Celery est configur\u00e9, la t\u00e2che `scraper.perform_scrape` est envoy\u00e9e au broker Redis, sinon un thread local ex\u00e9cute la t\u00e2che (mode dev).
4. Le worker t\u00e9l\u00e9charge les chapitres via Crawl4AI, sauvegarde les images et met \u00e0 jour les mod\u00e8les `Webtoon` et `Chapter`.
5. `ScrapeJob` est mis \u00e0 jour (statut, message, nombre d'images) puis la r\u00e9ponse est retourn\u00e9e au client.

## Configuration

Variables d'environnement principales :

- `REDIS_URL` : URL du cache (ex. `redis://redis:6379/0`)
- `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` : file d'attente Celery
- `CELERY_TASK_ALWAYS_EAGER` : `True` pour ex\u00e9cuter en synchrone (d\u00e9veloppement)

Dans `docker-compose.yml` :

- Service `redis` pour le broker
- Service `worker` pour ex\u00e9cuter `celery -A core worker`
- Volume partag\u00e9 `webtoon_media` pour stocker les images

## R\u00e9silience & monitoring

- Les exceptions de scraping sont loggu\u00e9es (logger `scraper.tasks`).
- Les t\u00e2ches en \u00e9chec mettent \u00e0 jour `ScrapeJob.status` et `message`.
- Sentry peut \u00eatre configur\u00e9 via `SENTRY_DSN` pour remonter les erreurs.
- Les caches sont centralis\u00e9s (Redis) et partag\u00e9s avec DRF (rate limiting) et Celery.

## Bonnes pratiques

- Toujours valider les URL en entr\u00e9e (backend).
- Utiliser des timeouts raisonnables pour le t\u00e9l\u00e9chargement des images.
- Purger les caches li\u00e9s aux webtoons (`WebtoonViewSet` invalide automatiquement les cl\u00e9s).
- Documenter tout nouvel endpoint dans `docs/api_usage.md`.
