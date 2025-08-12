# Journal des Modifications

## Alignement du type `last_chapter`
- Remplacement de la relation vers `Chapter` par un entier dans le modèle `UserProgress`.
- Mise à jour de l'API pour accepter et retourner un numéro de chapitre.
- Adaptation de l'import CSV et du frontend pour transmettre des valeurs numériques.
- Ajout de tests unitaires pour vérifier l'incrémentation, la décrémentation et l'envoi explicite de chapitre/horodatage.

## Résultat
- Le suivi de progression est cohérent quel que soit le point d'entrée (API, import, interface).
- Les dates de lecture sont correctement mises à jour et le dernier chapitre lu s'affiche en haut à gauche des cartes.

