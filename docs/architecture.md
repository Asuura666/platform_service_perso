# Architecture technique

## Vue d'ensemble
- **Back-end** : Django 5 + Django REST Framework expose une API conforme au cahier des charges.
- **Authentification** : JWT via `djangorestframework-simplejwt` (flux access / refresh tokens).
- **Documentation API** : OpenAPI générée automatiquement par `drf-spectacular` (`/api/schema/` et `/api/docs/`).
- **Base de données** : SQLite par défaut pour le développement, PostgreSQL pris en charge via variables d'environnement (Docker Compose).
- **Conteneurisation** : image unique (Python 3.12 slim) avec script d'entrée gérant migrations & statiques, orchestrée avec `docker-compose`.

## Schéma de données
| Modèle | Description | Champs significatifs |
| ------ | ----------- | -------------------- |
| `accounts.User` | Utilisateur personnalisé basé sur `AbstractUser`. | `email` unique, `role` (user/admin). |
| `library.FeatureCategory` | Catégories de contenus (Manga, Webtoon, Sport, ...). | `name`, `description`. |
| `library.Content` | Contenus liés à une catégorie. | `title`, `author`, `language`, `status`, `feature_category`. |
| `library.Chapter` | Chapitres associés à un contenu. | `chapter_number`, `title`, `release_date`. |
| `library.UserProgress` | Progression de lecture pour un utilisateur et un contenu. | `last_chapter`, `notes`, timestamps. |

## Permissions
- Accès en lecture aux catalogues (catégories, contenus, chapitres) pour tous les utilisateurs authentifiés.
- Création/mise à jour/suppression sur ces mêmes ressources réservées aux administrateurs (`is_staff`).
- Progression : opérations limitées à l'utilisateur connecté (filtrage automatique dans le viewset).

## Flux principaux
1. **Inscription / Connexion** : création via `/api/auth/register/`, connexion via `/api/auth/login/`. Les JWT obtenus sont utilisés pour toutes les requêtes futures (`Authorization: Bearer ...`).
2. **Gestion du catalogue** : administrateurs gèrent catégories, contenus et chapitres. Les clients filtrent par `feature_category` ou `status`.
3. **Suivi de lecture** : l'utilisateur authentifié enregistre sa progression via `/api/progress/` (clé unique par couple `user`/`content`).*** End Patch
