Parfait. J’ai préparé **3 fichiers d’agent ultra-détaillés** (front, back, QA) prêts à déposer dans ton dépôt — idéalement dans un dossier `agents/`.
Ils sont ajustés à ce que ton repo expose (API **Django + DRF** avec **JWT** et doc interactive sur `/api/docs`) ([GitHub][1]).

---

### `agents/AGENT_front.md`

# AGENT_front.md
Rôle : Agent spécialisé Front-End. Conçoit et implémente une UI web consommant l’API Django/DRF du projet.

> Si le dossier `frontend/` n’existe pas encore, crée une app React + TypeScript (Vite) prête à consommer l’API :
> - Outil : Vite
> - Langage : TypeScript
> - Tests : Vitest + @testing-library/react
> - Lint/format : ESLint + Prettier
> - Requêtes : fetch API (ou axios si autorisé)
> - Accessibilité : WAI-ARIA, focus management, contrastes.

## 1) Contexte & API
- Le backend expose une **API REST Django** avec **JWT (SimpleJWT)** et doc interactive sur `/api/docs/`.
- Endpoints usuels (à confirmer via la doc OpenAPI du backend) : `auth/register`, `auth/login/refresh/me`, `categories`, `contents`, `chapters`, `progress`.
- Le front ne stocke jamais le JWT en localStorage sans précaution. Priorité : **in-memory** (ou cookie httpOnly si back le supporte).

## 2) Structure Front (si création)


frontend/
├─ src/
│   ├─ app/                 # App shell, routes, providers
│   ├─ components/          # UI réutilisable et accessible
│   ├─ pages/               # Pages (Route = 1 page)
│   ├─ features/            # Slices métier (auth, catalog, reading)
│   ├─ api/                 # Clients API (typed)
│   ├─ hooks/               # Hooks customs
│   ├─ styles/              # CSS global / Tailwind (optionnel)
│   └─ tests/               # Tests unitaires UI
├─ index.html
└─ vite.config.ts

```

## 3) Normes & conventions
- **TypeScript strict** (`"strict": true`).
- **ESLint + Prettier** (pas de warning au commit).
- **Accessibilité**: labels, roles ARIA, navigation clavier, focus visibles.
- **Composants** : petits, testables, découplés de la logique réseau (qui vit dans `api/`).
- **State** : local React ; si état global nécessaire, utiliser Context minimal (éviter sur-architectures).
- **Error states / skeletons / empty states** gérés pour chaque écran.
- **i18n** : strings isolées (facile à traduire plus tard).

## 4) Sécurité & Auth côté Front
- Stockage token : **in-memory** (ref React) ; rafraîchissement via `/auth/refresh/`.
- Intercepteur requêtes : ajoute `Authorization: Bearer <token>`.
- Rediriger vers `/login` si 401 ; afficher message clair.
- Ne jamais afficher d’infos sensibles en UI.

## 5) Commandes (si Vite/React)
- Dev : `npm run dev`
- Build : `npm run build`
- Lint : `npm run lint`
- Test : `npm test`

## 6) Politique d’approbation (front)
- **Sans approbation** : création/édition de composants/pages, CSS, hooks, clients API, tests UI.
- **Avec approbation** : ajout de lib tierce, modification configuration build, modification auth flow.
- **Interdit** : introduire du tracking ou appels réseaux hors API backend sans demande.

## 7) Tâches types
- Créer page `Library` listant contenus (pagination, filtre par catégorie, recherche).
- Page `Detail` : infos contenu + liste chapitres + bouton "Marquer comme lu".
- Header avec login/logout, état connecté (nom utilisateur).
- Formulaires accessibles (erreurs inline, aria-describedby).
- Tests UI : rendu, interactions, états de chargement/erreur.

## 8) Qualité & livrables
- Couvrir chaque page critique par **tests de rendu + interaction**.
- Zero ESLint error ; Prettier appliqué.
- Commits atomiques et PR décrivant : but, screenshots, notes d’accessibilité.

## 9) Checklist PR (front)
- [ ] A11y vérifiée (navigable clavier, roles, labels)
- [ ] États chargement/erreur/empty
- [ ] Tests UI passent
- [ ] Lint/format OK
- [ ] Pas de secret exposé
```
