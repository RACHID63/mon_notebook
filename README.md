# Mon Notebook Papyrus

Carnet personnel manuscrit, multimédia et personnalisable — **une seule page HTML**
(`index.html`), sans serveur ni base de données. Tout tient dans le navigateur.

## Fonctionnalités

- **Trois types d'entrées** : note écrite, photo, audio (URL ou fichier local importé).
- **Persistance** : les entrées, les couleurs et le mot de passe sont conservés
  dans le `localStorage` du navigateur (`nb_entries`, `nb_bgColor`, `nb_textColor`, `nb_password`).
- **Verrou** par mot de passe qui masque réellement le contenu (flou + écran « Manuscrit Scellé »).
- **Thème papyrus** : couleurs de fond et d'encre personnalisables, police Lora pour le texte.
- **Gestion** : suppression entrée par entrée, « Tout effacer », notifications toast.

## Utilisation

1. Ouvrir l'adresse publiée (ou `index.html` en local).
2. Mot de passe par défaut : **`1234`** — à changer dans *Teintes & Sceau*.

## Stack

| Élément | Détail |
|---|---|
| Style | Tailwind CSS (CDN) + CSS personnalisé pour le papier |
| Icônes | Lucide (CDN) |
| Polices | Inter + Lora (Google Fonts) |
| Logique | JavaScript natif, un seul `<script>` en fin de page |
| Stockage | `localStorage` (≈ 5 Mo par navigateur) |

> Les trois CDN imposent une connexion Internet côté visiteur ; sans réseau, la page
> s'affiche mais sans style ni icônes.

## Limites connues

- Les données restent **dans le navigateur** : vider le cache ou changer d'appareil les perd.
- Le verrou est une protection d'**affichage** : les entrées sont lisibles dans les outils
  de développement. Ce n'est pas du chiffrement.
- Les fichiers importés sont convertis en base64 et stockés dans `localStorage` : la limite
  est de **2,5 Mo par fichier**, mais le quota global (~5 Mo) sature vite. Préférez une URL
  pour les photos et les audios volumineux.
- Le mot de passe n'est pas haché : il est stocké en clair dans le navigateur.

## Déploiement

- **HTTPS** : <https://69.62.108.1.nip.io/> (certificat Let's Encrypt, renouvellement automatique)
- **HTTP** : <http://69.62.108.1/> (vhost par défaut du serveur)
- Racine serveur : `/var/www/mon_notebook` (clone du dépôt, servi par nginx)
- Mise à jour : `ssh root@69.62.108.1 /root/update-mon-notebook.sh`

Fichiers nginx : `/etc/nginx/sites-available/mon-notebook` (port 80, site par IP)
et `/etc/nginx/sites-available/mon-notebook-nipio` (HTTPS + redirection).

## Historique des versions

- **Version actuelle** : interface Papyrus, fichier unique.
- Branche `v2-localstorage` : version précédente éclatée en `index.html` / `style.css` /
  `script.js` / `store.js`, avec stockage structuré et export/import JSON.
