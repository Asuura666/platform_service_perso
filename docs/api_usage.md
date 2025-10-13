# Utilisation de l'API

## Authentification
1. **Inscription**
   ```http
   POST /api/auth/register/
   {
     "username": "akira",
     "email": "akira@example.com",
     "password": "motdepassefort"
   }
   ```
2. **Connexion (JWT)**
   ```http
   POST /api/auth/login/
   {
     "username": "akira",
     "password": "motdepassefort"
   }
   ```
   Réponse :
   ```json
   {
     "refresh": "...",
     "access": "..."
   }
   ```
3. **Renouvellement**
   ```http
   POST /api/auth/refresh/
   {
     "refresh": "<token_refresh>"
   }
   ```

## Exemples de requêtes
- **Lister les contenus d'une catégorie**
  ```
  GET /api/contents/?feature_category=1
  Authorization: Bearer <access_token>
  ```
- **Créer un contenu (admin)**
  ```http
  POST /api/contents/
  Authorization: Bearer <access_token_admin>
  {
    "title": "One Piece",
    "author": "Eiichiro Oda",
    "status": "ongoing",
    "feature_category": 1
  }
  ```
- **Enregistrer une progression**
  ```http
  POST /api/progress/
  Authorization: Bearer <access_token>
  {
    "content": 1,
    "last_chapter": "1075",
    "notes": "Arc Egghead"
  }
  ```

## Documentation interactive
L'ensemble des endpoints, schémas de requête/réponse et codes de retour sont consultables sur :
- OpenAPI JSON : `GET /api/schema/`
- Interface Swagger : `GET /api/docs/`

Ces routes sont protégées par authentification, rapprochez-vous de `/api/auth/login/` pour générer un token utilisable directement dans l'interface Swagger (bouton « Authorize »).*** End Patch
