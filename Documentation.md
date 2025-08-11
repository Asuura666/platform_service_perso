
# 2) Documentation Technique & Code

## Architecture

* **frontend/** (Vite + React)
* **backend/**

  * `api/` : settings/urls/wsgi
  * `core/` : **models**, **serializers**, **views**, admin, management commands
* **docker-compose.yml** : services `db`, `backend`, `frontend`

### Modèle de données (Django)

* `FeatureCategory` (id, name, description)
* `Content`

  * `title`, `author`, `language`, `status` (`ongoing/completed/hiatus/unknown`),
    `rating` (float), `description`, `link`, `release_day`, `feature_category(FK)`, `cover_image`
* `Chapter` (FK `content`, `chapter_number`, `title?`, `release_date?`, `link?`)
* `UserProgress` (FK `user`, `content`, `last_chapter`, `last_read_at`, `notes`)

### API (DRF)

* **Auth** : JWT

  * `POST /api/auth/jwt/create/` → `{access, refresh}`
  * `POST /api/auth/jwt/refresh/`
* **Collections**

  * `GET/POST /api/categories/` (search: `?search=xx`, ordering: `?ordering=name`)
  * `GET/POST /api/contents/`

    * filtres : `?feature_category=<id>&status=<s>&language=<fr>`
    * search : `?search=<q>` ; ordering : `?ordering=title|created_at|updated_at|rating`
  * `GET/POST /api/chapters/?content=<id>` (ordering : `release_date`, `created_at`)
  * `GET/POST /api/progress/` + `GET /api/progress/mine` (auth requis)
* **Permissions**

  * `IsAuthenticatedOrReadOnly` (lecture publique, écritures nécessitent JWT).
  * Pour du dev libre : passer temporairement à `AllowAny` dans les ViewSets.
* **Docs** : `/api/docs/` (drf-spectacular).

### Sérialisation

* `ContentSerializer` expose `feature_category` (en lecture) et `feature_category_id` (écriture).
* `ChapterSerializer`, `UserProgressSerializer`, `FeatureCategorySerializer` → `fields="__all__"`.

### Import CSV (management command)

* Fichier : `core/management/commands/import_webtoons.py`
* **Auto-détection** du séparateur (`; , \t |`) via `csv.Sniffer` (override avec `--delimiter`).
* **Mapping d’entêtes** tolérant (`Title/Titre/Name`, `Tier`→`rating`, `Dernier chapitre lu`, etc.).
* **Normalisation statut** FR→EN.
* **Note** : gère `Tier` (S/A/B/…) ou valeur numérique (`"4,5"` → `4.5`).
* Crée/Met à jour `Content`, crée un `Chapter` si “dernier chapitre” fourni.
* Exemples :

  ```bash
  python manage.py import_webtoons data.csv --delimiter ";" --default-category "Manhwa" --dry-run
  ```

### Frontend (Vite + React)

* **Fichiers clés**

  * `src/App.jsx` :

    * `LoginBar` : login JWT → stocke `access` dans `localStorage` → remonte `token`.
    * `AddForm` : POST `/contents/` (envoie `Authorization: Bearer <token>` si présent).
    * `Card` : carte cliquable.
    * `DetailModal` : GET `/chapters/?content=<id>&ordering=-created_at` (dernier chap). Ajout d’un chapitre via POST `/chapters/`.
    * `useApi()` : helper fetch GET (liste).
* **Config**

  * `VITE_API_BASE` injecté par Compose (ex : `https://webtoon.mondomaine.fr/api`).
* **Style**

  * CSS simple inline (peut être migré vers Tailwind/shadcn plus tard).

### Flux typiques

* **Création œuvre**

  * Front → POST `/api/contents/` (JWT) → 201 + JSON → refresh liste.
* **Ajout chapitre**

  * Front → POST `/api/chapters/ {content, chapter_number}` (JWT) → met à jour “Dernier chapitre”.
* **Consultation**

  * GET publics (no token) : `/api/contents/`, `/api/categories/`, `/api/chapters/…`.

### Variables d’environnement Backend

```
DEBUG=0|1
SECRET_KEY=...
ALLOWED_HOSTS=domain1,domain2
DB_ENGINE=django.db.backends.postgresql | django.db.backends.sqlite3
DB_NAME=webtoon
DB_USER=webtoon
DB_PASSWORD=...
DB_HOST=db
DB_PORT=5432
CORS_ALLOW_ALL=true|false
```

### Sécurité & Prod

* Mettre `DEBUG=0`, `CORS_ALLOW_ALL=false`, `ALLOWED_HOSTS` correct.
* Stocker `SECRET_KEY` et mots de passe hors Git (fichier `.env`).
* Utiliser un **reverse-proxy** HTTPS (Nginx/Caddy).
* Sauvegardes régulières de Postgres (`pg_dump`) et des volumes.

### Extensions possibles

* **Auth front complète** (refresh token, expiration, rôles).
* **Upload d’images** (cover) vers un bucket (S3/Cloud Storage) + champ `ImageField`.
* **Historique de lecture** (trail des chapitres lus par user).
* **Pagination** côté API + UI.
* **Filtres avancés** (par note, statut multiple).
* **Tests** (pytest + DRF APITestCase), CI Github Actions.

### Tests rapides (exemples cURL)

```bash
# token
curl -X POST http://localhost:8000/api/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"***"}'

# lister contenus
curl http://localhost:8000/api/contents/?ordering=title

# créer une catégorie
curl -X POST http://localhost:8000/api/categories/ \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"Manhwa"}'

# créer un contenu
curl -X POST http://localhost:8000/api/contents/ \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"title":"Genius Archer", "feature_category_id":1, "language":"fr", "status":"ongoing"}'

# ajouter un chapitre
curl -X POST http://localhost:8000/api/chapters/ \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"content":1,"chapter_number":"42"}'
```

---

Si tu veux, je te génère ces deux docs en **fichiers Markdown/PDF** et je les ajoute au dépôt (avec un sommaire). Dis-moi le format (MD, PDF, DOCX) et je te fournis les liens de téléchargement.
