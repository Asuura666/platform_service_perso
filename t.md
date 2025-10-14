
@back

Je veux que tu améliores le backend Django du projet **Webtoon Book** avec une nouvelle feature :  
🧩 **Un Scrapper automatique de webtoons**, inspiré du repo https://github.com/unclecode/crawl4ai.

Cette feature sera accessible depuis le menu latéral du front (bouton “Scrapper” ou “Extraction Webtoon”).  
Elle permettra à l’utilisateur d’entrer le lien d’un webtoon (ex : https://manga-scantrad.io/manga/le-retour-du-ranker/),  
et le backend devra :
- Scrapper tous les chapitres du webtoon (titres, liens, images),
- Télécharger toutes les images localement,
- Créer automatiquement les entrées `Webtoon` et `Chapter` dans la base Django,
- Retourner un rapport de succès (nombre de chapitres et d’images récupérés),
- Gérer les erreurs de scraping de manière robuste (retry, timeout, logs).

---

## 🧱 1. Architecture à mettre à jour

Ajoute un **nouvel app Django** :
```

backend/
├─ scraper/
│    ├─ **init**.py
│    ├─ crawler.py
│    ├─ tasks.py
│    ├─ serializers.py
│    ├─ views.py
│    ├─ urls.py
│    ├─ models.py (optionnel si tu veux journaliser les scrapes)
│    └─ tests/test_scraper.py

````

---

## ⚙️ 2. Fonctionnement du Scrapper

Utilise la librairie `crawl4ai` pour explorer et extraire les contenus :

### Exemple d’utilisation :
```python
from crawl4ai import WebCrawler

async def scrape_manga(url: str):
    async with WebCrawler() as crawler:
        result = await crawler.run(url)
        # Récupérer titres, images, liens
        for item in result['chapters']:
            print(item['title'], item['images'])
````

⚙️ Si `crawl4ai` n’est pas dispo, utilise `requests + BeautifulSoup4` comme fallback.

---

## 📡 3. Endpoint REST à créer

| Méthode | Endpoint                    | Description                                                |
| ------- | --------------------------- | ---------------------------------------------------------- |
| POST    | `/api/scraper/`             | Lance le scraping d’un webtoon                             |
| GET     | `/api/scraper/status/{id}/` | Récupère le statut du scraping (en cours, terminé, échoué) |
| GET     | `/api/scraper/history/`     | Liste les derniers scrapes réalisés                        |

### Exemple de payload :

```json
{
  "url": "https://manga-scantrad.io/manga/le-retour-du-ranker/"
}
```

### Réponse attendue :

```json
{
  "status": "success",
  "webtoon": "Le Retour du Ranker",
  "chapters_scraped": 128,
  "images_downloaded": 2400,
  "local_path": "/media/webtoons/le-retour-du-ranker/",
  "duration": "00:03:41"
}
```

---

## 🧩 4. Intégration avec les modèles existants

Lors du scraping :

1. Crée ou récupère un `Webtoon` avec le même titre.
2. Crée chaque `Chapter` avec :

   * `title`
   * `chapter_number`
   * `release_date` (si dispo)
   * `local_folder` (chemin local vers les images)
3. Stocke les images sous :

```
/media/webtoons/<slug-du-webtoon>/<chapter-number>/
```

➡️ Les chemins seront accessibles via un champ `local_image_paths` dans les modèles.

---

## 🚀 5. Tâches asynchrones (optionnel mais recommandé)

Ajoute la possibilité de lancer le scraping en tâche de fond avec **Celery** :

* Le POST `/api/scraper/` crée une tâche Celery.
* Le front peut consulter `/api/scraper/status/{id}/` pour suivre la progression.

Celery + Redis :

```bash
pip install celery redis
celery -A webtoonbook worker --loglevel=INFO
```

---

## 🧪 6. Tests à implémenter

Crée des tests automatiques dans `tests/test_scraper.py` :

* `test_scraper_endpoint_exists`
* `test_scraper_invalid_url_returns_400`
* `test_scraper_creates_webtoon_and_chapters`
* `test_scraper_stores_images_locally`
* `test_scraper_status_returns_progress`

Tous les tests doivent passer avant validation finale :

```bash
pytest -v
# ou
python manage.py test scraper
```

---

## 📘 7. Documentation API

Étend la doc Swagger / ReDoc :

* `/api/docs/swagger/` → inclure la section **Scraper**
* `/api/docs/redoc/` → même chose

Ajoute une description claire :

> “Permet de scrapper automatiquement les chapitres et images d’un webtoon à partir d’une URL (MangaScantrad, AsuraScans, etc.).”

---

## 🧭 8. Lien avec le Frontend

Expose dans la doc un exemple d’appel depuis le front :

```javascript
// frontend/src/api/scraper.ts
import axios from 'axios';

export const launchScraper = async (url: string) => {
  const response = await axios.post('/api/scraper/', { url });
  return response.data;
};
```

Dans la sidebar du front (menu “Scrapper” ou “Feature suivante”):

* Crée un bouton **“Lancer un scrap”**
* Champ `input` pour coller une URL
* Appel `launchScraper(url)`
* Affiche un **loader + résultat** (“128 chapitres ajoutés avec succès !”)

---

## 🧾 9. Exemple de workflow complet

1. L’utilisateur va dans “Scrapper”.
2. Il colle : `https://manga-scantrad.io/manga/le-retour-du-ranker/`.
3. Le front appelle `/api/scraper/` (POST).
4. Le backend télécharge tous les chapitres et images.
5. Les nouveaux webtoons et chapitres apparaissent dans la base.
6. Le front recharge `/api/webtoons/` → ils s’affichent dans la bibliothèque.

---

## ⚙️ 10. Configuration Docker & stockage local

Dans `docker-compose.yml`, ajoute un volume :

```yaml
volumes:
  webtoon_media:
    driver: local

services:
  web:
    volumes:
      - webtoon_media:/app/media
```

Et dans `settings.py` :

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

---

## ✅ 11. Vérification finale avant livraison

1. Tous les tests passent (`pytest` OK)
2. Les endpoints `/api/webtoons/` et `/api/scraper/` fonctionnent ensemble
3. Swagger documente la nouvelle route
4. Le front peut lancer un scraping depuis un bouton et voir le résultat
5. Les images apparaissent bien dans `/media/webtoons/...`
6. Aucune erreur critique dans les logs

---

## 📄 12. À livrer

* Code complet `scraper/`
* Tests unitaires ✅
* Migrations appliquées ✅
* Doc Swagger/Redoc mise à jour ✅
* `README_BACKEND.md` mis à jour avec instructions d’utilisation du scrapper :

  * Comment lancer un scrap
  * Où les fichiers sont stockés
  * Commandes Docker/Celery
  * Endpoints disponibles

---

Résultat attendu :
✅ Tous les tests passent
✅ API documentée
✅ Scrapper opérationnel relié au front
✅ Commande “Ajouter un webtoon” fonctionnelle
✅ Images et chapitres visibles dans la bibliothèque

```

