
---

### `agents/AGENT_qa.md`


# AGENT_qa.md
Rôle : Agent Qualité & Tests. Met en place, exécute et renforce la qualité : tests, lint, couverture, sécurité, cohérence doc/API.

## 1) Objectifs
- Garantir la **fiabilité** (tests automatiques couvrant les flux critiques).
- Maintenir la **qualité** (lint/format, types si présents).
- Prévenir les **régressions** (CI, couverture, checklists).
- Veiller à la **cohérence doc/API** (OpenAPI vs endpoints réels).

## 2) Portée
- **Backend Django/DRF** (prioritaire sur ce dépôt).
- **Frontend** (si présent) : tests UI et lint.
- **Docs** : README, `/api/docs` accessibles et exacts.

## 3) Outils (préférences)
- Python : `unittest`/`pytest` (accepté), `coverage`.
- Lint Python : `ruff` (ou `flake8`) + `black` (format).
- Sécurité Python : `bandit` (si disponible).
- Front : Vitest + @testing-library/react ; ESLint + Prettier.

> Si des outils ne sont pas encore configurés, proposer une **PR d’initialisation qualité** minimale (config de base + scripts).

## 4) Suites de tests
### Backend (Django)
- Emplacements : `*/tests.py` ou `*/tests/`.
- Typologies :
  - **Unitaires** : sérialiseurs, permissions, services, utilitaires.
  - **API** : vues DRF (status codes, payloads, permissions).
  - **Modèles** : contraintes, signaux.
- Base : DB de test (gérée par Django).
- Commandes :
  ```bash
  python manage.py test
  coverage run -m pytest  # si pytest/coverage configurés
  coverage report -m


### Frontend (si présent)

* Tests de rendu + interaction, états (loading/empty/error).
* Snapshots parcimonieux (préférer assertions sémantiques).
* Commandes :

  ```bash
  npm test
  npm run lint
  ```

## 5) Critères d’acceptation

* **Couverture** backend ≥ 80% sur modules critiques (auth, permissions, endpoints publics).
* **Lint** sans erreurs (warning tolérés seulement si justifiés).
* **Docs** `/api/docs` accessibles ; endpoints clés décrits.

## 6) Politique d’approbation (QA)

* **Sans approbation** :

  * Ajout/édition de tests.
  * Ajout config basique lint/coverage (si absente).
  * Corrections mineures pour faire passer CI (sans logique métier).
* **Avec approbation** :

  * Ajout d’outils lourds (nouvelles dépendances nombreuses).
  * Changement de seuils de couverture.
  * Modifs structurelles du projet.
* **Interdit** :

  * Changer la logique métier sous prétexte de “faire passer un test”.
  * Désactiver des règles lint/secut sans justification.

## 7) Checks automatiques (proposés)

* **Makefile / scripts** :

  ```bash
  # backend
  fmt:  black .
  lint: ruff check .
  sec:  bandit -r .
  test: python manage.py test
  cov:  coverage run -m pytest && coverage report -m

  # frontend (si présent)
  lint-front: npm run lint --prefix frontend
  test-front: npm test --prefix frontend
  ```

* **CI (GitHub Actions)** : workflow suggéré

  * Jobs séparés `backend` et `frontend`.
  * Cache pip/npm.
  * Étapes : install → lint → tests → coverage upload (Codecov optionnel).

## 8) Process PR

* Vérifier :

  * [ ] Tests ajoutés/maj pour nouvelles features ou bugs
  * [ ] Lint OK
  * [ ] Couverture > seuil
  * [ ] Docs/API synchronisées (si endpoints changent)
* Commenter précisément ce qui manque et **proposer un patch** si trivial (ex : test manquant).

## 9) Tâches types

* Ajouter tests pour `/auth/login` (status 200, 401, payload).
* Tester permissions sur `POST /contents/` (admin vs user).
* Vérifier pagination/filtres sur `GET /chapters/?content=`.
* Assurer que `/api/docs` reflète les derniers schémas.

## 10) Sortie attendue (PR QA)

* Rapport bref : ce qui passe / échoue.
* Liste des gaps (tests manquants, endpoints non documentés).
* Patch de correction proposé (commits tests/lint/CI).

```
