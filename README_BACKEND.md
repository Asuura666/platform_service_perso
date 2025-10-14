# Webtoon Book - Backend

Backend Django + Django REST Framework pour alimenter le frontend Webtoon Book.

## Stack
- Django 5.2
- Django REST Framework & SimpleJWT
- drf-spectacular (Swagger & ReDoc)
- PostgreSQL (via Docker) ou SQLite (local)

## Installation locale
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS / Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### URLs utiles
- API racine : http://127.0.0.1:8000/api/
- Swagger : http://127.0.0.1:8000/api/docs/swagger/
- ReDoc : http://127.0.0.1:8000/api/docs/redoc/
- Schema OpenAPI : http://127.0.0.1:8000/api/schema/

## Lancer avec Docker
```bash
docker-compose up --build
```
Le service `web` sert l'API sur http://127.0.0.1:8000/ ; la base PostgreSQL est accessible via le service `db`.

## Authentification
- `POST /api/auth/register/` : creer un compte
- `POST /api/auth/login/` : obtenir un couple access/refresh JWT
- Les routes `/api/webtoons/` et derivees necessitent l'en-tete `Authorization: Bearer <token>`.

## Tests
```bash
python manage.py test
```
Les tests couvrent l'inscription/login, le CRUD Webtoon, la gestion des chapitres/commentaires et les permissions.

## Documentation OpenAPI
Le schema genere est exporte dans `docs/openapi-schema.yaml`. Pour le regenerer :
```bash
python manage.py spectacular --file docs/openapi-schema.yaml
```

## Scraper automatique

Le backend expose un service de scraping (`/api/scraper/`) qui importe un webtoon (titre, chapitres, images) et
sauvegarde les fichiers sous `media/webtoons/`.

### Endpoints
- `POST /api/scraper/` : lance un scraping (payload `{ "url": "https://..." }`).
- `GET /api/scraper/status/{id}/` : récupère le statut d'une tâche (pending/running/success/failed).
- `GET /api/scraper/history/` : renvoie l'historique des scrapes de l'utilisateur.

### Utilisation
```bash
python manage.py runserver
# (optionnel) lancer un worker Celery si Redis est configuré
celery -A core worker --loglevel=INFO
```

Les médias sont stockés dans `MEDIA_ROOT` (`media/` par défaut). Chaque chapitre dispose d'un dossier
`webtoons/<slug>/chapter-XXXX/` et les chemins relatifs sont retournés par l'API et via le modèle `Chapter`.

### Frontend
La page « Scraper » du frontend consomme ces endpoints via `frontend/src/api/scraper.ts` et affiche la progression
des tâches en temps réel.

## Exemple de payload Webtoon
```json
{
  "title": "Solo Leveling",
  "type": "Manhwa",
  "language": "Francais",
  "rating": 4.5,
  "status": "En cours",
  "chapter": 192,
  "link": "https://example.com/solo",
  "last_read_date": "2024-10-12",
  "comment": "Arc finale incroyable",
  "image_url": "https://example.com/solo.jpg"
}
```
