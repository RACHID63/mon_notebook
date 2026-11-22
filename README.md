# Mon Notebook

Carnet personnel statique (HTML / CSS / JavaScript), sans serveur ni base de données :
les notes sont stockées dans le navigateur via `localStorage`.

## Fonctionnalités

- Notes de trois types : **message**, **photo** (fichier ou URL), **audio** (URL).
- Suppression note par note, ou effacement complet.
- Couleurs de fond et de texte personnalisables, mémorisées.
- Verrou par mot de passe qui masque réellement les notes.
- Export / import de toutes les notes dans un fichier JSON (sauvegarde).
- Raccourci : `Ctrl + Entrée` dans la zone de texte pour ajouter la note.

## Utilisation

1. Ouvrir `index.html` (ou l'adresse publiée).
2. Mot de passe par défaut du verrou : `motdepasse` — à changer dans **Paramètres**.

## Limites assumées

- Les notes vivent **dans le navigateur** : vider le cache ou changer d'appareil les perd.
  Utilisez **Exporter mes notes** pour une sauvegarde, puis **Importer** sur un autre appareil.
- Le verrou est une protection d'**affichage** : les données restent lisibles dans les outils
  de développement du navigateur. Ce n'est pas du chiffrement.
- Les photos sont limitées à 1,2 Mo (quota `localStorage` ≈ 5 Mo) ; au-delà, préférez une URL.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | structure de la page |
| `style.css` | mise en forme |
| `store.js` | logique pure (stockage, validation, export) — testable hors navigateur |
| `script.js` | interface et événements DOM |

## Tests

Les tests de la logique métier sont dans le dépôt de déploiement, côté machine :
`node test-store.cjs` — 16 cas (persistance, validations, export/import, quota).

## Déploiement

- **HTTPS** : <https://69.62.108.1.nip.io/> (certificat Let's Encrypt, renouvellement automatique)
- **HTTP** : <http://69.62.108.1/> (vhost par défaut du serveur)
- Racine serveur : `/var/www/mon_notebook` (clone du dépôt, servi par nginx)
- Mise à jour : `ssh root@69.62.108.1 /root/update-mon-notebook.sh`

Fichiers nginx : `/etc/nginx/sites-available/mon-notebook` (port 80, site par IP)
et `/etc/nginx/sites-available/mon-notebook-nipio` (HTTPS + redirection).
