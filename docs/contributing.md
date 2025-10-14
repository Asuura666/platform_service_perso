# Guide de contribution

Merci de votre int\u00e9r\u00eat pour la plateforme ! Ce document r\u00e9sume les bonnes pratiques pour proposer une contribution de qualit\u00e9.

## Pr\u00e9requis

- Python 3.12+ avec `pip`
- Node.js 20+ et `npm`
- Redis (pour tester Celery en local)
- Docker (optionnel mais recommand\u00e9 pour les tests d'int\u00e9gration)

## Installer le backend

```bash
python -m venv .venv
.venv\\Scripts\\activate  # PowerShell
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Pour ex\u00e9cuter le worker Celery en local :

```bash
redis-server
celery -A core worker --loglevel=info
```

## Installer le frontend

```bash
cd frontend
npm install
npm run dev
```

Les tests unitaires se lancent avec :

```bash
cd frontend
npm test
```

## R\u00e8gles de codage

- Suivre PEP8 et utiliser `ruff` ou `flake8` avant de pousser.
- Ajouter des **docstrings** sur les vues, services et fonctions utilitaires.
- Privil\u00e9gier `select_related/prefetch_related` pour \u00e9viter les N+1.
- Lorsqu'un endpoint renvoie une liste, activer la pagination DRF.
- Toute logique complexe doit \u00eatre couverte par des tests (Django `APITestCase` ou Jest + Testing Library pour le front).

## Git & commits

- Cr\u00e9er une branche \u00e0 partir de `main` avec un nom explicite (`feature/celery-monitoring`, `fix/webtoon-pagination`, ...).
- Commits courts et pr\u00e9cis : `feat`, `fix`, `docs`, `test`, `refactor`.
- Mettre \u00e0 jour les fichiers de documentation pertinents (`docs/`, `README`, `openapi-schema.yaml` si n\u00e9cessaire).

## Revues de code

Chaque PR doit :

1. R\u00e9sumer les changements (backend / frontend / docs).
2. Mentionner les tests ex\u00e9cut\u00e9s et leurs r\u00e9sultats.
3. Pointer vers de nouvelles variables d'environnement ou migrations.
4. Inclure des captures \u00e9cran pour les modifications UI significatives.

## Bonnes pratiques

- Ne jamais exposer de secrets (utiliser `.env.example`).
- Utiliser la mise en cache (`django-redis`) et documenter les dur\u00e9es.
- Monitorer les erreurs : le DSN Sentry doit \u00eatre configurable via l'environnement.
- Pour le frontend, pr\u00e9f\u00e9rer `React.memo`, `useMemo`, `useCallback` pour \u00e9viter les re-renders inutiles.
- Ajouter des exemples d'utilisation dans `docs/api_usage.md` d\u00e8s qu'un endpoint \u00e9volue.

Merci de prendre le temps de consulter ce guide avant d'ouvrir une pull request. Bonne contribution \u00e0 toutes et \u00e0 tous !
