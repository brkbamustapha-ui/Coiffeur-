# Maison Gambetta — Coiffeur de luxe à Oran

Site vitrine premium (glassmorphism, 3D, néon) — HTML/CSS/JS statique, aucune compilation.

- `index.html` — structure et contenus
- `style.css` — design glassmorphism, animations 3D CSS, responsive
- `script.js` — scène 3D Three.js, tilt 3D, carrousel 3D, réservation WhatsApp

## Lancer en local
Ouvrir `index.html` dans un navigateur, ou lancer `python3 -m http.server` dans le dossier.

## À personnaliser
- Numéro WhatsApp / téléphone de TEST : `213550123456` dans `index.html` et `script.js`
- Adresse exacte, Instagram, horaires, tarifs, noms de l'équipe et avis clients (textes d'exemple)

## Espace coiffeur (tableau de bord)
- Adresse : `/admin.html` (lien « Espace coiffeur » en bas du site)
- Identifiant par défaut : `coiffeur` — mot de passe par défaut : `coiffeuroran` (à changer via le bouton « Mot de passe »)
- Les réservations sont stockées dans Supabase (schéma privé `salon`, projet `supabase-chestnut-desert`).
  Les tables ne sont pas accessibles directement ; le site passe par les fonctions `salon_*`.
  Les mots de passe sont chiffrés (bcrypt), les sessions expirent après 12 h,
  et 5 échecs de connexion bloquent l'identifiant pendant 15 minutes.
- `config.js` contient l'adresse Supabase et la clé publique (non secrète).
