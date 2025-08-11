Parfait — voici **2 documents** prêts à copier-coller (ou à mettre dans un Wiki/SharePoint) :

---

# 1) Guide Utilisateur & Opérationnel

## Vue d’ensemble

Application “Webtoon Book” pour **lister**, **rechercher**, **ajouter** des œuvres (webtoon/manga), **gérer les chapitres** et **consulter une fiche**.

* Backend : Django + DRF (JWT, filtres, Swagger).
* Frontend : React (Vite).
* Base : PostgreSQL (Docker) ou SQLite (dev local).

## Fonctionnalités

* **Accueil / Catalogue**

  * Recherche plein-texte (titre + description).
  * Tri par titre (`?ordering=title`).
  * Cartes cliquables → **fiche détaillée**.
* **Fiche d’œuvre**

  * Métadonnées : type/catégorie, langue, statut, note, lien, jour de sortie.
  * **Dernier chapitre** (affiché).
  * **Ajout d’un chapitre** (bouton dans la modale).
* **Ajout d’une œuvre**

  * Formulaire rapide : titre, catégorie, langue, statut, description.
* **Catégories**

  * CRUD via l’admin Django ou API.
* **Import CSV**

  * `manage.py import_webtoons` (auto-détection du séparateur, mapping FR/EN).
* **Docs API**

  * Swagger : `/api/docs/`.

## Comment ajouter du contenu

### A. Depuis le Frontend (recommandé pour non-tech)

1. **Se connecter** via la barre “Se connecter” (username/password admin).
2. Saisir *Titre*, sélectionner *Catégorie*, compléter langue/statut/description.
3. Cliquer **Ajouter**.
4. Ouvrir la carte → **Ajouter un chapitre** (champ “Nouveau chapitre”).

### B. Via l’Admin Django

1. Aller sur `http://<host>:8000/admin/` (créer d’abord un superuser).
2. Gérer **FeatureCategory**, **Content**, **Chapter**.

### C. Par CSV

```bash
docker compose exec backend python manage.py import_webtoons "/data/Webtoon Manga.csv"
# Forcer le séparateur si besoin
docker compose exec backend python manage.py import_webtoons "/data/Webtoon Manga.csv" --delimiter ";"
```

Entêtes reconnus (exemples) : `Title/Titre/Name`, `Type/Catégorie`, `Language/Langue`, `Status/Statut`,
`Rating/Note/Tier`, `Description/Résumé/Commentaire`, `Link/Lien`, `Dernier chapitre lu`, `Author/Auteur`, etc.

## Déploiement sur un serveur (Docker)

### Prérequis

* Docker + Docker Compose installés.
* Un nom de domaine (ex : `webtoon.mondomaine.fr`).

### Étapes

1. **Configurer l’environnement**

   * Copier `backend/.env.example` → `backend/.env` et ajuster :

     ```
     DEBUG=0
     SECRET_KEY=<générer une clé>
     ALLOWED_HOSTS=webtoon.mondomaine.fr
     DB_ENGINE=django.db.backends.postgresql
     DB_NAME=webtoon
     DB_USER=webtoon
     DB_PASSWORD=<motdepassefort>
     DB_HOST=db
     DB_PORT=5432
     CORS_ALLOW_ALL=false
     ```
   * Dans `docker-compose.yml` : exposer seulement via un reverse-proxy (pas de 0.0.0.0 public si possible).

2. **Build & run**

   ```bash
   docker compose up -d --build
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py createsuperuser
   ```

3. **Reverse proxy + HTTPS**

   * **Nginx** (extrait) :

     ```
     server {
       server_name webtoon.mondomaine.fr;
       location / {
         proxy_pass http://127.0.0.1:5173;  # frontend
         proxy_set_header Host $host;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
       location /api/ {
         proxy_pass http://127.0.0.1:8000/api/;  # backend
       }
     }
     ```
   * SSL : Let’s Encrypt (Certbot) ou **Caddy** (auto-HTTPS).

4. **Configurer le frontend**

   * `frontend` lit `VITE_API_BASE`. Dans `docker-compose.yml` :

     ```
     environment:
       - VITE_API_BASE=https://webtoon.mondomaine.fr/api
     ```
   * `docker compose up -d --build` pour appliquer.

5. **Volumes & sauvegardes**

   * Postgres : volume `pgdata`. Sauvegarde :

     ```bash
     docker compose exec db pg_dump -U webtoon webtoon > backup_$(date +%F).sql
     ```

## Runbook / Résolution d’incidents

* **401 Unauthorized**

  * Se connecter depuis la barre *Se connecter* (le front stocke le token).
  * Dans Swagger : `POST /api/auth/jwt/create/` → `Authorize` avec `Bearer <token>`.
  * Token expiré → se reconnecter.
* **500 sur l’API**

  * Vérifier migrations : `makemigrations core && migrate`.
  * Lire les logs : `docker compose logs -f backend`.
  * CORS (si front ≠ même domaine) : ajuster `ALLOWED_HOSTS` et CORS.
* **DB Connection refused au démarrage**

  * Normal au premier boot (Postgres init). Le backend redémarre.
* **CSV import : 0 items**

  * Forcer `--delimiter` (`;` ou `,`), vérifier l’encodage (UTF-8/CP1252).
  * Vérifier les entêtes ; le mapping accepte `Name`, `Dernier chapitre lu`, `Tier`, `Lien vers`.
* **Ports déjà utilisés**

  * Modifier les ports mappés dans `docker-compose.yml`.
* **Admin inaccessible**

  * Regénérer `SECRET_KEY`, vérifier `ALLOWED_HOSTS`, recréer le superuser.

---
