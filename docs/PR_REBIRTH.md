# Kizuna Rebirth : cité-portail, navigation et sanctuaire d’invocation

Cette livraison réalise l’audit et la première tranche jouable de Rebirth (étapes 1–2). L’accueil devient une scène illustrée centrée sur un booster et trois accès : Nexus, Cadeaux, Activités. La navigation principale comporte cinq destinations ; le reste du jeu est regroupé dans Explorer. Sur téléphone, le paquet choisi et son bouton d’ouverture précèdent le carrousel.

Deux décors originaux WebP, des icônes de destinations, un panneau de probabilités repliable, le favori réel et un carnet de collection accessible à la demande constituent le langage visuel de cette tranche. La révélation partage le décor du sanctuaire ; le récapitulatif regroupe les actions secondaires. Les écrans des étapes 3–6 restent à refondre.

Les gestionnaires de tirage, de stock, de Chakra et de sauvegarde sont conservés. Aucune table de probabilité, aucun prix ou seuil de Résonance n’est modifié. Les contrôles sont déplacés ou réutilisés avec leurs identifiants et gestionnaires existants.

## Validation

- Compilation : 1 521 fichiers, dont 1 449 médias vérifiés.
- Chromium : annulation sans débit, tirage réel de 5 cartes et garantie Rare ou mieux, récapitulatif, fiche et favori, persistance, routes principales et secondaires, cadeau quotidien, ouverture rapide de 25 cartes, contrôle du stock et du Chakra.
- Navigation clavier des menus et des actions repliées, réduction du mouvement et absence de son par défaut.
- Desktop 1600×1000, laptop 1366×768, téléphone 390×844 et tablette 768×1024 : absence de débordement horizontal sur les cinq destinations principales, aucune erreur JS.
- Test reproductible : `scripts/test-rebirth.cjs`, instructions dans `docs/REBIRTH.md`.

## Captures

| Vue | Avant | Après |
| --- | --- | --- |
| Accueil desktop | [Avant](rebirth/before-desktop-home.webp) | [Après](rebirth/after-desktop-home.webp) |
| Accueil laptop | [Avant](rebirth/before-laptop-home.webp) | [Après](rebirth/after-laptop-home.webp) |
| Accueil mobile | [Avant](rebirth/before-mobile-home.webp) | [Après](rebirth/after-mobile-home.webp) |
| Boosters desktop | [Avant](rebirth/before-desktop-boosts.webp) | [Après](rebirth/after-desktop-boosts.webp) |
| Boosters laptop | [Avant](rebirth/before-laptop-boosts.webp) | [Après](rebirth/after-laptop-boosts.webp) |
| Boosters mobile | [Avant](rebirth/before-mobile-boosts.webp) | [Après](rebirth/after-mobile-boosts.webp) |

[Révélation](rebirth/after-laptop-reveal.webp) · [Récapitulatif](rebirth/after-laptop-summary.webp)

Les captures après tests montrent un profil invité ayant réellement ouvert des boosters ; les captures initiales montrent un nouveau profil vide.

## À valider avant fusion

Le réseau cloud bloque certains portraits AniList et l’API Supabase. Une illustration indisponible est signalée clairement ; les portraits disponibles sont conservés. Les transactions authentifiées, achats Nexus, récompenses distantes, Éveils et synchronisation Discord n’ont pas été validés. Prévoir une recette avec un compte d’intégration autorisé. Pas de mesure de performance sur appareil physique ni de validation statistique des tirages.

PR à ouvrir en brouillon, sans fusion ni déploiement automatique.
