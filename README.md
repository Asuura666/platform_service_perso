# Webtoon Platform (Django REST + React)

This repo implements the project described in your *cahier des charges*:
- Backend: **Django + Django REST Framework** with JWT auth, filtering, and OpenAPI docs.
- Frontend: **React (Vite)** minimal UI that lists contents, opens a detail modal, and lets you add items.
- Data loader: management command to import from CSV (e.g., `Webtoon Manga.csv`).

## Quick start (dev)

### With Docker (recommended)
```bash
# 1) Copy .env example
cp backend/.env.example backend/.env

# 2) Build & run
docker compose up --build

# 3) Open the app
# API: http://localhost:8000/api/
# Docs: http://localhost:8000/api/docs/
# Frontend: http://localhost:5173/
```

### Bare-metal (Python 3.11+ & Node 18+)
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000

# (Optional) Load sample data from CSV
python manage.py import_webtoons ../data/Webtoon\ Manga.csv

# Frontend
cd ../frontend
npm install
npm run dev
```

## API Endpoints (selection)
- `POST /api/auth/jwt/create/` -> obtain JWT (email/username + password)
- `GET /api/categories/`
- `GET /api/contents/?search=<q>&ordering=title`
- `GET /api/chapters/?content=<id>`
- `GET /api/progress/?user=<id>&content=<id>`

OpenAPI docs (Swagger UI): **/api/docs/**

## Data model (simplified)
- **FeatureCategory**: name, description
- **Content**: title, author, language, status, rating, description, link, release_day, feature_category
- **Chapter**: content FK, chapter_number, title, release_date, link
- **UserProgress**: user FK, content FK, last_chapter FK, last_read_at, notes

## CSV Importer
The importer accepts flexible headers and tries to map common names:
```
Title, Titre, title
Type, Catégorie, type
Language, Langue, language
Status, Statut, status
Rating, Note, rating
Description, Résumé, description
Link, Lien, link
LastChapter, Dernier chapitre, last_chapter
ReleaseDay, Jour de sortie, release_day
Author, Auteur, author
```
Unknown columns are ignored. Rows without a Title are skipped.

---

Made with ❤️ to match your wireframes and requirements.
