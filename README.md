# Webtoon Book

Projet full-stack pour gerer une bibliotheque de webtoons avec une API Django REST protege par JWT et un frontend React + TypeScript inspire d'un style AsuraScans.

## Architecture
- **backend/** : Django REST Framework, SimpleJWT, drf-spectacular (Swagger/ReDoc), PostgreSQL (ou SQLite en local)
- **frontend/** : Vite + React + TypeScript + TailwindCSS, animations Framer Motion, gestion de theme et authentification JWT

## Prerequis
- Python 3.12+
- Node.js 20+ et npm
- (Optionnel) Docker et Docker Compose

## Configuration rapide
### 1. Backend
```powershell
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux / macOS

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Par defaut le serveur ecoute sur `http://127.0.0.1:8000/`.

**Variables d'environnement** (fichier `.env` deja present):
```
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
# Variables PostgreSQL (utiles uniquement pour Docker)
POSTGRES_DB=platform_service
POSTGRES_USER=platform_user
POSTGRES_PASSWORD=platform_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

### 2. Frontend
```powershell
cd frontend
cp .env.example .env
npm install
npm run dev
```

Le serveur Vite tourne sur `http://localhost:5173/` et consomme l'API (`VITE_API_BASE_URL=http://localhost:8000/api`).

## Premier lancement
1. Demarrez le backend (`python manage.py runserver`).
2. Demarrez le frontend (`npm run dev` dans `frontend/`).
3. Ouvrez `http://localhost:5173/`, cliquez sur **Se connecter**, creez un compte puis connectez-vous pour commencer a ajouter vos webtoons. Les requetes utilisent automatiquement les tokens JWT recuperes depuis le backend.

## Importer vos webtoons existants
Un importateur CSV est fourni pour le fichier `data/Webtoon Manga.csv` :
```powershell
python manage.py import_webtoons --user VOTRE_PSEUDO --file "data/Webtoon Manga.csv"
```
Remplacez `VOTRE_PSEUDO` par le nom du compte cree via le frontend. Les lignes sont creees ou mises a jour pour cet utilisateur.

## Scraper automatique
- Lancer un scraping depuis le frontend (menu **Scraper**) ou via `POST /api/scraper/` avec `{ "url": "https://..." }`.
- Suivre la progression : `GET /api/scraper/status/{id}/` et consulter l'historique via `GET /api/scraper/history/`.
- Les images sont sauvegardees sous `media/webtoons/<slug>/chapter-XXXX/`.
- (Optionnel) pour lancer le scraping en tache de fond : `celery -A core worker --loglevel=INFO`.

## Documentation API
- Schema OpenAPI : `http://127.0.0.1:8000/api/schema/`
- Swagger UI : `http://127.0.0.1:8000/api/docs/swagger/`
- ReDoc : `http://127.0.0.1:8000/api/docs/redoc/`

Regenerer le schema si besoin :
```powershell
python manage.py spectacular --file docs/openapi-schema.yaml
```

## Tests
```powershell
python manage.py test        # backend
```

Les tests couvrent l'inscription/login JWT, le CRUD webtoon, chapitres et commentaires, ainsi que les verifications de droits d'acces.

## Docker (optionnel)
```powershell
docker compose up --build
```

Expose :
- API : `http://localhost:8000/`
- PostgreSQL : port `5432`

Le frontend reste a lancer via `npm run dev` (non conteneurise).

## Ressources utiles
- `README_BACKEND.md` : memo detaille pour les commandes Django et la regeneration du schema OpenAPI.
- `frontend/.env.example` : configuration par defaut du client Vite.
- `docs/openapi-schema.yaml` : export du schema officiel de l'API.
