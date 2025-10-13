

@back

Je veux que tu crées tout le backend pour supporter le frontend "Webtoon Book" 
décrit dans le projet. Le backend doit être construit avec **Django + Django REST Framework + SimpleJWT** 
et doit fournir une API claire, testée et documentée.

---

## 🎯 Objectif global
Créer une API REST complète permettant de :
1. Gérer les **Webtoons** (CRUD)
2. Gérer les **Chapitres** associés à chaque webtoon
3. Gérer les **Commentaires et notes**
4. Assurer une **authentification JWT sécurisée**
5. Fournir une **documentation interactive (Swagger / ReDoc)**.
6. Tester automatiquement toutes les routes critiques avant de valider la livraison.

---

## 🧱 1. Structure attendue du backend
```

backend/
├─ manage.py
├─ requirements.txt
├─ Dockerfile
├─ docker-compose.yml
├─ webtoonbook/
│    ├─ settings.py
│    ├─ urls.py
│    └─ ...
├─ api/
│    ├─ models.py
│    ├─ serializers.py
│    ├─ views.py
│    ├─ urls.py
│    ├─ tests/
│    │    ├─ test_webtoon.py
│    │    ├─ test_chapter.py
│    │    └─ test_comment.py
│    └─ permissions.py
├─ accounts/
│    ├─ models.py
│    ├─ serializers.py
│    ├─ views.py
│    └─ urls.py
└─ docs/
└─ openapi-schema.yaml

````

---

## 📚 2. Modèles à implémenter

### Webtoon
| Champ | Type | Détails |
|-------|------|----------|
| `id` | int | auto |
| `title` | CharField(200) | Titre de l’œuvre |
| `type` | CharField(50) | Exemple : "Manhwa", "Manhua", "Webtoon" |
| `language` | CharField(50) | Langue principale |
| `rating` | FloatField | de 0 à 5 |
| `status` | CharField(20) | "En cours" / "Terminé" |
| `chapter` | IntegerField | Dernier chapitre lu |
| `link` | URLField | Lien vers la source |
| `last_update` | DateTimeField(auto_now=True) |
| `last_read_date` | DateField(null=True, blank=True) |
| `comment` | TextField(blank=True) |
| `image_url` | URLField(blank=True) |
| `user` | ForeignKey(User, on_delete=CASCADE) |

### Chapter
| Champ | Type | Détails |
|-------|------|----------|
| `id` | int | auto |
| `webtoon` | ForeignKey(Webtoon, related_name='chapters') |
| `chapter_number` | int |
| `title` | CharField(200) |
| `release_date` | DateField |

### Comment
| Champ | Type | Détails |
|-------|------|----------|
| `id` | int | auto |
| `webtoon` | ForeignKey(Webtoon, related_name='comments') |
| `text` | TextField |
| `created_at` | DateTimeField(auto_now_add=True) |
| `user` | ForeignKey(User, on_delete=CASCADE) |

---

## ⚙️ 3. Endpoints REST à créer (et documenter)

| Méthode | Endpoint | Description |
|----------|-----------|--------------|
| POST | `/api/auth/register/` | créer un compte utilisateur |
| POST | `/api/auth/login/` | obtenir JWT |
| GET | `/api/webtoons/` | liste tous les webtoons de l’utilisateur connecté |
| POST | `/api/webtoons/` | crée un nouveau webtoon |
| GET | `/api/webtoons/{id}/` | détail d’un webtoon |
| PUT | `/api/webtoons/{id}/` | modifie un webtoon |
| DELETE | `/api/webtoons/{id}/` | supprime un webtoon |
| GET | `/api/webtoons/{id}/chapters/` | liste des chapitres |
| POST | `/api/webtoons/{id}/chapters/` | ajoute un chapitre |
| GET | `/api/webtoons/{id}/comments/` | liste des commentaires |
| POST | `/api/webtoons/{id}/comments/` | ajoute un commentaire |

---

## 🔐 4. Authentification & permissions

- Utiliser **SimpleJWT**
- Routes `/api/webtoons/`, `/api/chapters/`, `/api/comments/` protégées par `IsAuthenticated`
- Les données sont filtrées par `request.user`
- Tout utilisateur ne peut voir que **ses propres webtoons**

---

## 📘 5. Documentation

Mettre en place **drf-spectacular** pour la génération automatique de la doc OpenAPI.

Endpoints :
- `/api/schema/` → schéma brut YAML/JSON
- `/api/docs/swagger/` → Swagger UI
- `/api/docs/redoc/` → ReDoc

Configurer dans `settings.py` :
```python
INSTALLED_APPS = [
  ...
  'drf_spectacular',
  'drf_spectacular_sidecar',
  'rest_framework',
  'rest_framework_simplejwt',
]
REST_FRAMEWORK = {
  'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
  'DEFAULT_AUTHENTICATION_CLASSES': (
      'rest_framework_simplejwt.authentication.JWTAuthentication',
  ),
}
SPECTACULAR_SETTINGS = {
  'TITLE': 'Webtoon Book API',
  'DESCRIPTION': 'API backend pour le projet Webtoon Book (Front AsuraComic Style)',
  'VERSION': '1.0.0',
}
````

---

## 🧪 6. Tests automatiques

Écris des tests unitaires Pytest ou Django natifs couvrant :

* Création utilisateur / login JWT
* CRUD complet des webtoons
* Ajout de chapitre et commentaire
* Vérification des permissions (un user ne peut pas voir ceux des autres)
* Retour des bons codes HTTP (200, 201, 403, 404)

Chaque fichier `test_*.py` doit être exécutable via :

```bash
pytest
# ou
python manage.py test
```

⚡ Avant de terminer, exécute tous les tests et assure-toi qu’ils sont **verts (OK)** avant validation.

---

## 🚀 7. Commandes de lancement (doc utilisateur)

### En local

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Accès :

* API : [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
* Swagger : [http://127.0.0.1:8000/api/docs/swagger/](http://127.0.0.1:8000/api/docs/swagger/)
* Redoc : [http://127.0.0.1:8000/api/docs/redoc/](http://127.0.0.1:8000/api/docs/redoc/)

### Avec Docker

```bash
docker-compose up --build
```

Le fichier `docker-compose.yml` doit inclure :

* Un service `web` (Django)
* Un service `db` (PostgreSQL)
* Un volume `data` persistant

---

## ✅ 8. Validation finale

Avant de marquer la tâche comme terminée :

1. Exécuter tous les tests (`pytest` ou `manage.py test`)
2. Vérifier que Swagger et Redoc s’ouvrent sans erreur
3. Tester avec un utilisateur via Postman ou curl :

   * login
   * ajout d’un webtoon
   * récupération via `/api/webtoons/`
4. Fournir un fichier `README_BACKEND.md` expliquant comment démarrer le projet.

---

Une fois terminé, affiche :

* ✅ “Tous les tests passent”
* ✅ Lien vers la documentation (Swagger / ReDoc)
* ✅ Exemple de requête JSON pour créer un webtoon
* ✅ Exemple de réponse API

```

