# 📋 Phase 2 — Changelog complet

> Branche : `Shiro/feature/phase_2`
> Période : 5 février 2026
> Auteur : Shiro 🦊 (IA assistante)

---

## 🚀 Déploiement Production

**URL live** : https://webtoon.apps.ilanewep.cloud

### Architecture Docker (5 containers)
| Service | Techno | Port |
|---------|--------|------|
| `frontend` | React (Vite) → nginx | 127.0.0.1:3000 |
| `web` | Django + Gunicorn (3 workers) | 127.0.0.1:8100 |
| `worker` | Celery (2 concurrency) | — |
| `db` | PostgreSQL 16 Alpine | 127.0.0.1:5432 |
| `redis` | Redis 7 Alpine (64MB) | 127.0.0.1:6379 |

### Sécurité
- HTTPS obligatoire + HSTS (1 an)
- 6 headers de sécurité (XSS, nosniff, frame, referrer, permissions-policy)
- Ports Docker bindés sur localhost uniquement
- DEBUG=False, SECRET_KEY aléatoire 64 chars
- CORS + CSRF restreints au domaine
- Rate limiting (100/h anonyme, 2000/jour authentifié)

### Fichiers créés
- `docker-compose.prod.yml` — Orchestration production
- `.env.prod` — Variables d'environnement
- `frontend/Dockerfile` — Build multi-stage (Node → nginx)
- `frontend/nginx.conf` — SPA routing + gzip + cache
- `DEPLOYMENT.md` — Documentation déploiement

---

## 🔧 Bugs corrigés

### 1. Spread operator typo
- **Fichier** : `WebtoonPage.tsx:152`
- **Bug** : `....` (4 points) au lieu de `...` (3 points)

### 2. Vite env compatibilité
- **Fichier** : `GlobalErrorBoundary.tsx:40`
- **Bug** : `process.env.NODE_ENV` → `import.meta.env.DEV`

### 3. JWT 401 sur login/refresh
- **Problème** : L'intercepteur axios envoyait un token expiré sur les endpoints de login
- **Fix** : `authentication_classes=()` sur les vues login et refresh

### 4. Login case-sensitive
- **Problème** : L'utilisateur tapait "Ilane" mais le compte était "ilane"
- **Fix** : `CaseInsensitiveModelBackend` avec `username__iexact`
- **Fichier** : `accounts/backends.py`

### 5. Spam API sur la recherche
- **Problème** : Chaque caractère tapé lançait un appel API
- **Fix** : Hook `useDebounce` avec délai de 400ms
- **Fichier** : `src/hooks/useDebounce.ts`

---

## ✨ Nouvelles fonctionnalités

### API — Recherche et tri côté serveur
- `GET /api/webtoons/?search=solo` → recherche dans titre, type, langue, statut, commentaire
- `GET /api/webtoons/?ordering=-rating` → tri par note, titre, chapitre, date
- Remplace le filtrage client (scale à des milliers d'entrées)

### Page détail `/webtoons/:id`
- URL deep-linkable (partage, SEO, navigation)
- Hero avec image + badges type/statut
- Grille stats : note, chapitre, langue, dernière lecture
- Lien vers le site de lecture
- Boutons modifier / supprimer
- Retour vers la bibliothèque

### Page profil `/profile`
- Formulaire éditable : pseudo, email, prénom, nom
- Affichage rôle, badge superuser, features actives
- PATCH sur `/api/auth/me/`

### Boutons +/- chapitre
- Sur chaque carte de la bibliothèque
- Incrémente/décrémente le chapitre en un tap
- Mise à jour instantanée via PATCH API

### Focus Trap (accessibilité)
- Composant `FocusTrap` pour piéger le focus dans les modals
- Tab / Shift+Tab restent dans la modal
- Restaure le focus précédent à la fermeture

---

## 📱 Responsive Mobile

- `viewport-fit=cover` + safe-area-insets (notch iPhone)
- Modals en bottom sheet (slide-up) sur mobile
- Boutons touch-friendly (44px minimum)
- Texte et padding adaptés aux petits écrans
- `100dvh` pour hauteur correcte sur iOS Safari
- `-webkit-tap-highlight-color: transparent`

---

## 🎨 Redesign complet — "Manga Reader Dark"

### Palette de couleurs
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#111113` | Fond principal |
| `panel` | `#1a1a1e` | Panneaux, cartes |
| `surface` | `#222226` | Champs, boutons secondaires |
| `accent` | `#f97316` | Actions principales (orange) |
| `accentAmber` | `#fbbf24` | Notes, ratings (doré) |
| `textLight` | `#e4e4e7` | Texte principal |
| `textMuted` | `#71717a` | Texte secondaire |

### Typographie
- Police principale : **DM Sans** (ronde, friendly, moderne)
- Fallbacks : Poppins, system-ui

### Homepage (style Crunchyroll/Netflix)
- **Hero banner** plein écran avec webtoon aléatoire parmi les mieux notés
- Overlay gradient pour lisibilité du texte
- CTA "Continuer Ch.X" + "Lire en ligne"
- **3 carrousels horizontaux** scrollables :
  - 📖 En cours de lecture
  - ⭐ Les mieux notés
  - ✅ Terminés
- Covers portrait (ratio 2:3) avec note en overlay
- Page d'accueil non connecté avec CTA de connexion

### Composants
- **Navbar** : compact, barre de recherche intégrée, bouton "Ajouter"
- **Sidebar** : navigation propre, état actif en orange
- **WebtoonCard** : cover portrait, badge type, note dorée, statut coloré
- **Grille bibliothèque** : 2 colonnes mobile → 3 tablet → 4-5 desktop

### Codes couleur statuts
- 🟢 Vert : En cours
- ⚪ Gris : Terminé
- 🟠 Orange : Hiatus / Autre

---

## 📊 Import de données

- **122 webtoons importés** depuis `data/Webtoon Manga.csv`
- Répartition : 100 Manhwa, 17 Manhua, 4 Manga
- Statuts : 106 en cours, 17 terminés
- Langues : 93 FR, 29 EN
- Notes : 83 notés (moyenne 4.4/5), 40 non notés

---

## 📝 Commits (chronologique)

| # | Hash | Description |
|---|------|-------------|
| 1 | `d7dfeef` | Fix pagination test accounts |
| 2 | `c5def0a` | Production deployment (Docker + nginx + SSL) |
| 3 | `72cba4b` | Disable crawl4ai/playwright (scraper en pause) |
| 4 | `1653e2b` | Fix JWT auth on login/refresh endpoints |
| 5 | `9d377e6` | Case-insensitive login backend |
| 6 | `a733f75` | Mobile responsive (bottom sheets, safe areas) |
| 7 | `9dcea46` | Major features (search API, detail page, profile, a11y) |
| 8 | `9227810` | Search debounce (400ms) |
| 9 | `8bb1473` | Chapter +/- buttons on cards |
| 10 | `b24e07e` | Complete redesign — Option B Manga Reader Dark |

---

## 🔮 Prochaines étapes (Phase 3)

- [ ] Refacto vers modèle générique `Content` / `FeatureCategory` (extensibilité Sport, etc.)
- [ ] Table `UserProgress` séparée (suivi avancé de lecture)
- [ ] Tests frontend (Vitest + testing-library)
- [ ] CI/CD — GitHub Actions (lint + tests sur push/PR)
- [ ] Internationalisation (i18n)
- [ ] PWA (offline, install sur home screen)
