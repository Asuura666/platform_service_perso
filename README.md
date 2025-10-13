# Plateforme de suivi des lectures

Ce dépôt contient le back-end de la plateforme décrite dans le cahier des charges : une API REST Django permettant de suivre ses lectures (mangas, webtoons, sport, etc.), gérer des chapitres et la progression des utilisateurs, avec authentification JWT, documentation interactive et exécution conteneurisée.

## Fonctionnalités clés
- Authentification et inscription via JSON Web Tokens (SimpleJWT).
- Gestion des rôles (utilisateur, administrateur) et interface Django admin enrichie.
- Modélisation modulaire : catégories, contenus, chapitres, progression utilisateur.
- API REST documentée (OpenAPI/Swagger) disponible sur `/api/docs/`.
- Jeux de tests unitaires pour les principaux flux d’authentification et de gestion de catalogue.
- Prêt pour PostgreSQL en production (Docker Compose) et SQLite en développement local.

## Démarrage rapide (environnement local)
1. Créer un environnement virtuel et installer les dépendances :
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Appliquer les migrations et lancer le serveur de développement :
   ```powershell
   python manage.py migrate
   python manage.py runserver
   ```
3. Créer un super-utilisateur si nécessaire :
   ```powershell
   python manage.py createsuperuser
   ```
4. Accéder à l'API sur `http://127.0.0.1:8000/`, à l’admin sur `/admin/` et à la documentation interactive sur `/api/docs/`.

## Exécution avec Docker
1. Dupliquer le fichier `.env.example` vers `.env` et adapter les valeurs à votre contexte (mot de passe PostgreSQL, secret Django, etc.).
2. Sur les systèmes Unix, donner les droits d’exécution au script d’entrée : `chmod +x entrypoint.sh`.
3. Construire et lancer les services :
   ```bash
   docker compose up --build
   ```
4. L’API est disponible sur `http://localhost:8000/`. PostgreSQL écoute sur le port `5432`.

## Tests
Lancer la suite de tests automatisés (utilise une base temporaire) :
```powershell
python manage.py test
```

## Structure des endpoints principaux
- `POST /api/auth/register/` : inscription d’un utilisateur.
- `POST /api/auth/login/` et `POST /api/auth/refresh/` : obtention et renouvellement des jetons JWT.
- `GET /api/auth/me/` : profil de l’utilisateur connecté.
- `GET/POST /api/categories/` : gestion des catégories (lecture pour tous, écriture réservée aux admins).
- `GET/POST /api/contents/` : gestion du catalogue.
- `GET/POST /api/chapters/` : gestion des chapitres (paramètre `?content=` pour filtrer).
- `GET/POST /api/progress/` : progression de lecture de l’utilisateur connecté.

Tous les détails (schéma de données, scénarios d’usage, roadmap) sont disponibles dans la documentation complémentaire (`docs/`).*** End Patch
