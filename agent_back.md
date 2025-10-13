
# AGENT_back.md
Rôle : Agent spécialisé Back-End. Implémente et maintient l’API Django + DRF, l’authentification JWT, la doc OpenAPI et la logique métier.

## 1) Contexte
- Framework : **Django** + **Django REST Framework**.
- Auth : **SimpleJWT** (login, refresh, me).
- Doc : **OpenAPI/Swagger** sur `/api/docs/`.
- DB : **PostgreSQL** (prod via Docker Compose) et **SQLite** (dev local).
- Apps repérées : `accounts` (auth/utilisateurs), `core` (catalogue : catégories, contenus, chapitres, progression), `library` (outils, import CSV, etc.).

## 2) Environnement & démarrage
### Local (venv)
```bash
python -m venv .venv
source .venv/bin/activate   # (Windows: .\.venv\Scripts\activate)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# optionnel
python manage.py createsuperuser
````

### Docker

1. Copier `.env.example` → `.env` et compléter (SECRET_KEY, DB, JWT, etc.).
2. (Unix) `chmod +x entrypoint.sh`
3. `docker compose up --build`

* API: [http://localhost:8000](http://localhost:8000)
* Admin: [http://localhost:8000/admin](http://localhost:8000/admin)
* Docs: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

## 3) Conventions de code

* PEP8 ; imports triés ; docstrings pour vues/services.
* **Sérialiseurs DRF** : valider finement les entrées.
* **Permissions** : IsAuthenticated pour les endpoints protégés ; SAFE methods ouvertes si nécessaire.
* **Pagination** : activée sur listes (valeurs par défaut raisonnables).
* **Filtres** : query params (`?category=`, `?search=`…).
* **Séparation** :

  * `views.py` minces → logique métier dans `services.py` (ou dossiers `domain/`, `usecases/`).
  * `serializers.py` pour la validation & mapping.
  * `permissions.py` pour règles d’accès.
* **Migrations** : un fichier par changement logique ; nom explicite.

## 4) Sécurité

* Jamais de secrets en dépôt.
* Réponses d’erreur **sans** divulgation de stack trace en prod.
* Headers de sécurité (CSRF non requis pour JWT pur côté API, mais CORS configuré).
* Rate limiting (si requis), validation stricte des entrées.
* Nettoyer les fichiers uploadés (si un jour tu ajoutes du média).

## 5) Versionnement & stabilité API

* Les changements **cassants** nécessitent:

  * Nouveau schéma/numéro de version d’API, notes de migration, et PR dédiée.
* Documenter toute nouvelle route dans la doc OpenAPI (ou auto-générée et exposée).

## 6) Politique d’approbation (back)

* **Sans approbation** :

  * Ajout de vues DRF, sérialiseurs, permissions, urls, tests.
  * Migrations mineures.
* **Avec approbation** :

  * Changement de modèles ayant impact prod (drop/rename colonne).
  * Ajout de dépendances Python.
  * Modifs `settings.py` sensibles (CORS, auth, sécurité, caches).
  * Toucher CI/CD, Dockerfiles, entrypoint.
* **Interdit** :

  * Commit de secrets / creds.
  * Accès réseau externe non lié au besoin métier.

## 7) Endpoints (exemple, à synchroniser avec /api/docs)

* `POST /api/auth/register/`
* `POST /api/auth/login/` – `POST /api/auth/refresh/`
* `GET /api/auth/me/`
* `GET/POST /api/categories/`
* `GET/POST /api/contents/`
* `GET/POST /api/chapters/` (filtre `?content=`)
* `GET/POST /api/progress/` (progression utilisateur)

## 8) Tâches types

* Ajouter champ `status` sur `Content` (+ migration, filtres, tests).
* Endpoint `GET /api/chapters/?content=<id>&only_unread=true`.
* Ajout recherche plein-texte (filter backend) pour `contents`.
* Hook post-save pour initialiser progression utilisateur à 0.
* Export CSV d’un rapport d’usage admin.

## 9) Qualité & performance

* N+1 queries : utiliser `select_related/prefetch_related`.
* Pagination systématique ; filtres indexés en DB.
* Journaliser (niveau INFO/ERROR) les actions clés ; pas de logs sensibles.

## 10) Checklist PR (back)

* [ ] Schéma OpenAPI à jour (si nécessaire)
* [ ] Tests passent (unitaires + éventuels d’intégration)
* [ ] Migrations appliquées et nommées clairement
* [ ] Permissions revues (pas d’endpoint exposé par erreur)
* [ ] Lint OK ; pas de secrets

````
