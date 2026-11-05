# KIZUNA Rebirth — livraison 1 et 2

## Périmètre et audit

Base : `db6e977`, branche dédiée `feature/kizuna-rebirth-ui`. L’état initial était propre ; `origin/main` a été récupéré avant intervention et ne contenait aucun commit supplémentaire.

Application JavaScript native, sans framework ni dépendance npm de production. `dist/index.html` contient le moteur historique et les vues ; `src/*.inc.js` fournit les fragments réinjectés au build. Python vérifie les SHA-256/CRC des sept archives et les références HTML/CSS. Node synchronise les fragments. Les modules `KizunaGame`, `KizunaAccount`, `KizunaAdventure`, `KizunaMythic`, `KizunaNexus` et `KizunaAnomalies` exposent les parcours existants.

L’audit Chromium a enregistré les vues desktop 1600×1000, laptop 1366×768 et téléphone 390×844 dans `outputs/rebirth/before-*.png`. Les données utilisées sont celles d’un nouveau profil invité isolé. Le site public n’a pas été déployé ou modifié.

| Destination / fonctionnalité | Accès conservé | Constat et suite |
| --- | --- | --- |
| Accueil | Navigation principale | Ancien lobby haut de 740 px plus carnet, 5 raccourcis et catalogue ; remplacé par une scène et 3 accès secondaires. |
| Boosters gratuits, cadeaux, boutique | Navigation principale | Ancien carrousel de grands paquets précédant le bouton sur mobile ; nouveau paquet central et panneau d’action, sélection compacte. |
| Tirage normal, ×5, ×10, rapide, sons | Boutons originaux / fenêtre d’ouverture | Séquence charge → résultats enregistrés → retournement → récapitulatif conservée, décor du sanctuaire commun, actions secondaires repliées. |
| Collection, albums, filtres, vente/recyclage | Navigation principale | Beaucoup de métriques et filtres dès l’entrée ; refonte Album prévue à l’étape 3. |
| Univers, Wiki, fiches | Explorer | Illustrations et albums existants, catalogue paginé ; nouveau langage à étendre à l’étape 3. |
| Nexus, arbre, liste accessible, coffre | Navigation principale | 5 voies et contrôles zoom/liste présents ; achats liés au compte, non vérifiés avec authentification. Étape 4. |
| Missions, constellations, voyage | Explorer → Activités/Explorer | Navigation `KizunaAdventure.navigate` conservée. Étape 4. |
| Éveils mythiques | Explorer → Activités | Progression et sélection des transformations conservées. Aucun seuil modifié. Étape 4. |
| Anomalies, archives, récompenses | Activités / Explorer | Événements servis par le backend, état invité conservé ; aucune fausse activité. Étape 4. |
| Marché, ventes, enchères, échanges, historique | Navigation principale | Plusieurs filtres et sections persistants ; réorganisation Acheter/Vendre/Échanger réservée à l’étape 5. |
| Profil, Sanctuaire, statistiques | Explorer → Mon joueur | Fonctions existantes conservées ; refonte galerie/carte joueur à l’étape 5. |
| Communauté, classements | Explorer → Social / Mon joueur | Aucune statistique inventée. Étape 5. |
| Staff, catalogue et studios administratifs | Menu selon permissions existantes | Pas d’accès supplémentaire accordé. |
| Notifications, connexion, réglages | En-tête / Explorer pour le carnet mobile | Sons désactivés par défaut, réduction d’animations respectée. |

Les anciennes règles de composition du lobby ont été retirées de `kizuna-art-lobby.css` ; il ne contient plus que le composant de choix du favori. Les anciens éléments de progression et de catalogue du lobby sont accessibles dans des panneaux natifs `details`. Les raccourcis de missions, sanctuaire et univers passent par le menu organisé. Les composants des étapes 3–6 ne sont pas déclarés refondus.

## Langage artistique commun

Anime Arcade Fantasy : architecture japonaise, portail cyan, lumière de lanterne ambrée, nuit bleue et matière de papier/cartes. Deux décors originaux générés pour cette livraison, optimisés en WebP (environ 805 Kio au total), sans moteur 3D ni vidéo : cité-portail et sanctuaire d’invocation. Aucun média archivé remplacé. `card-unavailable.svg` indique explicitement un portrait inaccessible, sans substituer un autre personnage.

- Nuit `#101326`, surfaces `#202B4B`, texte `#F7F4FF`.
- Cyan `#57D9EF` : exploration/focus ; or `#FFC96B` : action/récompense ; émeraude : progression ; rose : activités. Les raretés utilisent toujours les couleurs du moteur.
- Rajdhani pour les titres, Manrope pour les explications, fontes locales existantes.
- Une action dominante, détails accessibles au clavier, cibles principales d’au moins 44 px.
- Mouvement du paquet lent ; charge et retournements finis ; mode rapide et réduction des animations existants. Son après geste et consentement uniquement.

| Composant | Implémentation |
| --- | --- |
| GameShell / GameNavigation | `kizuna-art.js`, cinq liens, menu dialog natif en quatre groupes |
| SceneBackground / PlayerShowcase | `kizuna-home.js`, décor local, favori réel et carnet replié |
| BoosterStage | `rbRenderBoosterStage` dans `src/booster-views.inc.js`, suit la sélection existante |
| GameButton / tokens | `kizuna-rebirth.css`, actif, focus, désactivé |
| RewardReveal / RarityEffects | Fonctions existantes dans `booster-views.inc.js`, décor commun, rareté issue des résultats sauvés |
| GameModal | Dialog de navigation et favori ; piège de focus de révélation incluant les `summary` visibles |
| SkillNode / QuestCard / album | Conservés pour étapes 3–6, sans prétendre à une nouvelle implémentation |

Pour la suite : bibliothèque ivoire/émeraude pour les albums ; arbre monumental cyan/vert pour le Nexus ; bazar corail/ambre pour le marché ; vitrine or pour les Éveils ; observatoire rose pour les Anomalies. Garder les mêmes fontes, niveaux d’action, états de focus et panneaux de détails. Ces décors supplémentaires restent à produire avec leurs étapes.

## Validation reproductible

```sh
# Depuis la racine du dépôt, Python >=3.10 et Node >=22
python3 scripts/build-netlify.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory public
# Dans un autre terminal, pilote de test hors des dépendances de production
npm install --prefix /tmp/kizuna-browser playwright-core@1.64.1 --no-audit --no-fund
KIZUNA_PLAYWRIGHT_MODULE=/tmp/kizuna-browser/node_modules/playwright-core node scripts/test-rebirth.cjs
```

Pilote validé : Playwright Core 1.64.1. Chromium système est utilisé (`CHROMIUM_PATH` configurable). `KIZUNA_TEST_URL` permet un autre serveur local. Le test ouvre un nouveau contexte isolé et n’injecte pas de soldes ou de résultats. Les comptes authentifiés et le site officiel ne sont pas utilisés.

Vérifié : compilation et médias, annulation sans débit, tirage réel de 5 cartes, Rare ou mieux obtenue, récapitulatif et fiche, favori, persistance après rechargement, cinq routes principales et dix secondaires, sélection sans débit, probabilités/prix/garanties accessibles, cadeau quotidien, ouverture rapide ×5 (25 cartes), ×10 désactivé faute de stock, sons désactivés, préférence et réglage OS de réduction de mouvement, absence de débordement horizontal sur les 4 formats (dont tablette 768×1024), absence d’erreurs JavaScript. Les captures de révélation attendent la fin des animations.

Limites : pas d’audit de performance sur téléphone physique ; pas de test statistique des probabilités (moteur et tables inchangés). La session cloud bloque `s4.anilist.co` pour certains portraits et l’API Supabase pour les fonctions distantes. Les achats Nexus, synchronisation Discord, transactions multi-comptes, récompenses et Éveils authentifiés restent à valider dans un environnement d’intégration autorisé avant fusion. L’API GitHub est bloquée par le proxy ; l’ajout de `api.github.com` et `s4.anilist.co` est enregistré dans le brouillon réseau, sans publication ni application automatique.

Les captures et résultats locaux sont dans `outputs/rebirth/` (ignoré par Git), les captures sélectionnées pour revue dans `docs/rebirth/`. Étapes 3–6 à réaliser dans des livraisons suivantes.
