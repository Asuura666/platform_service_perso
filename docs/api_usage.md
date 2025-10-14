# Utilisation de l'API

## Authentification (JWT)

```http
POST /api/auth/login/
{
  "username": "akira",
  "password": "motdepassefort"
}
```

La r\u00e9ponse renvoie un couple `access` / `refresh`. Chaque requ\u00eate prot\u00e9g\u00e9e doit inclure :

```
Authorization: Bearer <access_token>
```

Le refresh token se renouv\u00e8le via :

```http
POST /api/auth/refresh/
{
  "refresh": "<token_refresh>"
}
```

## Webtoons : pagination & cache

### Lister ses webtoons

```http
GET /api/webtoons/?page=1
Authorization: Bearer <access_token>
```

```json
{
  "count": 32,
  "next": "http://localhost:8000/api/webtoons/?page=2",
  "previous": null,
  "results": [
    {
      "id": 17,
      "title": "Solo Leveling",
      "status": "En cours",
      "chapter": 192,
      "chapters_count": 24,
      "comments_count": 3,
      "updated_at": "2025-10-10T11:32:51Z",
      "...": "..."
    }
  ]
}
```

La r\u00e9ponse est pagin\u00e9e (PageNumberPagination). Les requ\u00eates sont mises en cache pour chaque utilisateur ; toute cr\u00e9ation/edition/suppression invalide automatiquement les entr\u00e9es.

### R\u00e9cup\u00e9rer un webtoon

```http
GET /api/webtoons/17/
Authorization: Bearer <access_token>
```

### Cr\u00e9er un webtoon

```http
POST /api/webtoons/
Authorization: Bearer <access_token>
Content-Type: application/json
{
  "title": "The Breaker",
  "type": "Manhwa",
  "language": "Francais",
  "status": "En cours",
  "chapter": 1,
  "link": "https://example.com/the-breaker"
}
```

### R\u00e9cup\u00e9rer les chapitres d'un webtoon

```http
GET /api/webtoons/17/chapters/?page=1
Authorization: Bearer <access_token>
```

Renvoie \u00e9galement un r\u00e9sultat pagin\u00e9 (les pages sont mises en cache par webtoon).

### Ajouter un commentaire

```http
POST /api/webtoons/17/comments/
Authorization: Bearer <access_token>
{
  "text": "Arc incroyable !"
}
```

## Endpoints de scraping

```http
POST /api/scraper/jobs/
Authorization: Bearer <access_token>
{
  "url": "https://monwebtoon.example/chapter-1"
}
```

La cr\u00e9ation d'un job planifie une t\u00e2che Celery. Pour suivre l'\u00e9tat :

```http
GET /api/scraper/jobs/<id>/
Authorization: Bearer <access_token>
```

## Documentation interactive

- OpenAPI JSON : `GET /api/schema/`
- Swagger UI : `GET /api/docs/swagger/`
- Redoc : `GET /api/docs/redoc/`

Authentifiez-vous via le bouton **Authorize** en fournissant un jeton `Bearer` afin de tester les routes directement dans l'interface.
