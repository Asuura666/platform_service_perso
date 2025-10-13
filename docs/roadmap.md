# Roadmap proposée

## Phase 1 – Prototype local
- Mise en place du socle Django + DRF (auth, catalogues, progression) ✅
- Couverture de tests minimale pour les flux critiques ✅
- Documentation vivante (`/docs`, OpenAPI) ✅

## Phase 2 – MVP en ligne
- Déploiement conteneurisé (Docker + PostgreSQL) ✅
- Ajout d'une solution de hosting (Railway, Render, DO, etc.) et configuration HTTPS (Let’s Encrypt).
- Intégration d'un front-end séparé (React/Vue) consommant l'API.

## Phase 3 – Extensions
- Nouveaux modules (section « Sport », analytics sur les lectures, favoris).
- Notifications / rappels (emails, push) et intégration mobile.
- Durcissement sécurité (monitoring, alerting, rotation des secrets) et backups programmés de la base.

Chaque fonctionnalité majeure devrait être accompagnée de tests supplémentaires et d'une mise à jour des documents (cahier des charges et README).*** End Patch
