# Kizuna — Definitive Rebirth

Cette passe part de `main` (`4ac0d13`, PR précédente intégrée), sur la branche `feature/kizuna-definitive-rebirth`. Elle reconstruit les composants de présentation et conserve le moteur de jeu existant.

## Audit et changements

| Lot | Constat avant intervention | Résultat |
| --- | --- | --- |
| A — interface et cartes | Styles de cartes superposés, portraits recadrés, boutons incohérents | Géométrie unique dans `kizuna-cards.css`, image en `contain`, légende hors illustration, cadre indépendant, lecteur de l’image source en plein écran. Quatre familles de commandes dans `kizuna-design-system.css`, états clavier/survol/pression/désactivation/chargement. |
| B — Nexus et Constellations | Même décor pour deux activités différentes, sélection de branche peu lisible, six onglets d’activités permanents | Arbre du Nexus conservé, recentrage de branche, autres voies atténuées, panneau de détail réel. Observatoire céleste distinct, carte des liens, zoom, récompenses réelles et état vide explicite. Sélecteur illustré d’activités refermable au clavier. |
| C — collection et boosters | Les commandes repoussaient les cartes sous le premier écran mobile ; quatre actions sous chaque carte | Nouvel en-tête de collection, progression regroupée dans les filtres, première rangée à environ 476 px en 390×844. Classeur paginé, grille et menu secondaire par carte. Boutons d’invocation harmonisés, images entières dans la révélation. |
| D — espaces | Bannières et panneaux disproportionnés, profil mobile dominé par un décor vide | Profil centré sur l’identité et les cartes réelles, Sanctuaire vide compact, trois entrées principales du marché (Acheter, Vendre, Échanges), enchères rattachées à l’achat, historique secondaire. Wiki, univers, communauté, classement, missions et voyages reprennent la même palette et les mêmes commandes. |
| E — contrôle | L’apparence ne pouvait pas être jugée par le seul build | Captures avant/après des 16 pages sur quatre résolutions, contrôle visuel des planches, puis corrections et nouvelles captures. Scénarios isolés pour les ratios d’images, Éveils, états du Nexus et collections remplies. |

Les anciennes règles de géométrie des cartes et les styles des composants remplacés ont été retirés. Les déclarations CSS répétées pour un même sélecteur et contexte ont été dédupliquées. `kizuna-finish.css/js` sont remplacés par les fichiers de scènes, de composants et d’interactions ; aucune troisième couche « finish » n’est chargée.

## Captures comparatives

Les captures sont des images WebP consultables à leur résolution originale. Les petites planches servent au repérage ; ouvrir une capture individuelle pour examiner les textes et détails.

| Format | Avant | Après |
| --- | --- | --- |
| 1920×1080 | [Planche desktop](definitive-rebirth/before-desktop-overview.webp) | [Planche desktop](definitive-rebirth/after-desktop-overview.webp) |
| 1366×768 | [Planche laptop](definitive-rebirth/before-laptop-overview.webp) | [Planche laptop](definitive-rebirth/after-laptop-overview.webp) |
| 768×1024 | [Planche tablette](definitive-rebirth/before-tablet-overview.webp) | [Planche tablette](definitive-rebirth/after-tablet-overview.webp) |
| 390×844 | [Planche mobile](definitive-rebirth/before-mobile-overview.webp) | [Planche mobile](definitive-rebirth/after-mobile-overview.webp) |

Les dossiers [avant](definitive-rebirth/before/) et [après](definitive-rebirth/after/) contiennent les captures de chaque page : `home`, `boosts`, `col`, `nexus`, `market`, `wiki`, `universes`, `profile`, `community`, `rank`, `constellations`, `missions`, `journey`, `awakening`, `sanctuary`, `events`. Chaque nom est préfixé par `desktop`, `laptop`, `tablet` ou `mobile`.

Comparaisons utiles :

- Collection mobile : [avant](definitive-rebirth/before/mobile-col.webp), [après, vide](definitive-rebirth/after/mobile-col.webp), [après, remplie](definitive-rebirth/after/mobile-filled.webp).
- Carte : [ancien lecteur](definitive-rebirth/before/laptop-viewer.webp), [nouveau lecteur](definitive-rebirth/after/laptop-viewer.webp), [illustration entière](definitive-rebirth/after/laptop-artwork.webp).
- [Classeur mobile](definitive-rebirth/after/mobile-album.webp), [révélation mobile](definitive-rebirth/after/mobile-reveal.webp).
- [Portrait/paysage/carré et quatre stades d’Éveil](definitive-rebirth/after/laptop-ratios-awakenings.webp). Les trois images géométriques sont des fixtures de test uniquement.
- Nexus : [vierge](definitive-rebirth/after/laptop-nexus-virgin.webp), [partiel](definitive-rebirth/after/laptop-nexus-partial.webp), [complet](definitive-rebirth/after/laptop-nexus-complete.webp), [déblocage simulé](definitive-rebirth/after/mobile-nexus-unlock.webp), [récompenses](definitive-rebirth/after/mobile-nexus-rewards-open.webp).
- Constellations : [atlas](definitive-rebirth/after/laptop-constellations.webp), [constellation sélectionnée](definitive-rebirth/after/laptop-constellation-focus.webp), [état vide](definitive-rebirth/after/mobile-constellations-empty.webp), [menu des activités](definitive-rebirth/after/laptop-activities.webp).

## Validation

Build de production exécuté avec `KIZUNA_SITE_URL=https://kizunamanga.netlify.app` : 1 529 fichiers, dont 1 449 médias archivés. Syntaxe JavaScript et CSS vérifiée ; `git diff --check` passe.

Suites Chromium/Playwright :

- `scripts/test-rebirth.cjs` : annulation, tirage normal, garantie, carte, favori, persistance, navigation, probabilités, recharge quotidienne, ouverture rapide de cinq packs (25 cartes), préférences et quatre tailles.
- `scripts/test-finish.cjs` : filtres et albums, cinq vues du marché, Wiki, cinq branches du Nexus invité, liste/zoom, carte céleste, éditeur du Sanctuaire, erreur communautaire et nouvelle tentative, économie inchangée ; 14 routes sur quatre tailles, puis 25 nœuds et leurs états en fixture.
- `scripts/test-definitive.cjs` : 16 routes × quatre tailles demandées, absence de débordement et de média local manquant, lecteur et image entière, fermeture clavier, activités, zoom, collection remplie, recto/verso, pagination, trois ratios, Éveils 0–3, Constellations vides et lien vers la collection. Aucun changement de solde, stock ou inventaire pendant la navigation.
- `scripts/test-definitive-nexus.cjs` : états vierge/partiel/complet, quatre tailles, recentrage tactile, atténuation des autres voies, récompenses activées/désactivées, annulation sans écriture et célébration après réponse d’achat acceptée par le serveur simulé.

Résultats structurés : [acceptance.json](definitive-rebirth/acceptance.json), [nexus-acceptance.json](definitive-rebirth/nexus-acceptance.json). Les fixtures ne sont pas incluses dans `public/` et leurs valeurs restent dans des contextes de navigateur jetables.

Pour reproduire :

```sh
python3 scripts/build-netlify.py
python3 -m http.server 8000 --directory public
# Dans un second terminal, avec Playwright et Chromium disponibles :
KIZUNA_PLAYWRIGHT_MODULE=/chemin/vers/playwright-core node scripts/test-rebirth.cjs
KIZUNA_PLAYWRIGHT_MODULE=/chemin/vers/playwright-core node scripts/test-finish.cjs
KIZUNA_PLAYWRIGHT_MODULE=/chemin/vers/playwright-core node scripts/test-definitive.cjs
KIZUNA_PLAYWRIGHT_MODULE=/chemin/vers/playwright-core node scripts/test-definitive-nexus.cjs
```

## Portée et limites

Aucune migration, fonction Supabase, table, règle de rareté, probabilité, coût, garantie, frais de marché ou mécanisme d’authentification n’a été modifié. Les tests d’achat du Nexus utilisent un serveur simulé ; ils ne constituent pas une validation d’un achat authentifié en production.

Certains portraits externes AniList renvoient une erreur dans cet environnement. Le site présente alors son illustration d’indisponibilité explicite ; aucun portrait arbitraire n’a été substitué. Les médias locaux ont été vérifiés. Les services communautaires et les sessions Discord/Supabase authentifiées ne sont pas accessibles dans cet environnement : leurs états d’erreur et leurs composants locaux ont été contrôlés, sans inventer de profils ni de transactions.

Publication demandée par l’utilisateur : nouvelle PR, puis intégration sur `main` et déploiement par la liaison GitHub → Netlify existante. Aucun envoi forcé ni publication de configuration cloud n’est nécessaire.
