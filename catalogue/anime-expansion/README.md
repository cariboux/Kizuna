# Extension anime — dossier de validation

**PROPOSITION — aucun déploiement, aucun import distant.**

272 nouvelles cartes, 11 nouveaux univers, 9 nouveaux Mythiques et 18 illustrations d’Éveil. Après import approuvé : 1 396 cartes et 50 univers. Chainsaw Man avait déjà 30 cartes : elles sont toutes conservées. Douze définitions d’album sont préparées, dont celle de Chainsaw Man, sans créer un second album pour ses saisons.

Les 1 124 cartes et leurs raretés, les 197 définitions d’Éveil existantes, les identifiants et les illustrations précédentes sont préservés. Les six Éveils de Mereoleona/Yuno et ceux de Naruto/Luffy restent inchangés. Les collections, doublons, soldes, stocks, pity, garanties, reçus, résonances et Nexus ne sont pas réécrits.

## Albums

| Franchise | AniList anime | Ajouts | Album total | Nouveaux Mythiques | Éveils | Statut |
|---|---|---|---|---|---|---|
| JoJo's Bizarre Adventure | 14719 | 30 | 30 | 1 | 2 | Nouveau |
| The Seven Deadly Sins | 20789 | 29 | 29 | 1 | 2 | Nouveau |
| Kuroko's Basketball | 11771 | 28 | 28 | 0 | 0 | Nouveau |
| Darling in the Franxx | 99423 | 16 | 16 | 1 | 2 | Nouveau |
| Kakegurui | 98314 | 30 | 30 | 1 | 2 | Nouveau |
| Blue Exorcist | 9919 | 25 | 25 | 1 | 2 | Nouveau |
| Parasyte -the maxim- | 20623 | 15 | 15 | 0 | 0 | Nouveau |
| Chainsaw Man | 127230 | 0 | 30 | 0 | 0 | Conservé |
| Made in Abyss | 97986 | 25 | 25 | 1 | 2 | Nouveau |
| Monster | 19 | 20 | 20 | 1 | 2 | Nouveau |
| The Promised Neverland | 101759 | 24 | 24 | 1 | 2 | Nouveau |
| Tokyo Revengers | 120120 | 30 | 30 | 1 | 2 | Nouveau |

## Raretés proposées

Les personnages sont regroupés par franchise, toutes saisons retenues confondues, puis classés par favoris AniList. Un seul Mythique est proposé par nouvelle franchise : le premier de la sélection, à condition d’atteindre 5 000 favoris globaux. Les autres niveaux suivent des bandes de rang proportionnelles : jusqu’à environ 10 % Légendaire, 23 % Épique, 43 % Rare, 67 % Peu commune, puis Commun. Les seuils de rang sont arrondis ; le rang Légendaire couvre au minimum deux positions et le rang Épique trois. Ce choix éditorial reste à valider, puis devient une décision fixe : une actualisation des favoris ne change plus la rareté.

Voir [les 272 décisions](raretes-proposees.csv) : ID, nom, source, favoris, rang, rareté, justification et droits. Les valeurs proviennent de la collecte du 9 novembre 2026 (Toronto), horodatée le 10 novembre en UTC. Aucun protagoniste ne reçoit automatiquement Mythique. Kuroko et Parasyte n’ont pas de nouveau Mythique : leur tête de sélection reste sous 5 000 favoris.

| Mythique proposé | Franchise | AniList personnage | Favoris | Rang franchise | Deux Éveils |
|---|---|---|---|---|---|
| Joseph Joestar | JoJo's Bizarre Adventure | 6356 | 17058 | 1 | Hamon — Clackers · Hermit Purple |
| Ban | The Seven Deadly Sins | 77605 | 7632 | 1 | Le Renard de l’Avarice · Snatch — chasse du renard |
| Ichigo | Darling in the Franxx | 124382 | 15732 | 1 | Squad 13 — Code 015 · Delphinium — synchronisation |
| Yumeko Jabami | Kakegurui | 121889 | 8776 | 1 | L’invitation au jeu · Le pari décisif |
| Rin Okumura | Blue Exorcist | 24482 | 5715 | 1 | Kurikara dégainé · Flammes bleues |
| Nanachi | Made in Abyss | 122445 | 6214 | 1 | Le refuge de Nanachi · Guide de l’Abysse |
| Johan Liebert | Monster | 719 | 11365 | 1 | Le sourire de Johan · L’ombre de Ruhenheim |
| Ray | The Promised Neverland | 121724 | 9868 | 1 | Le stratège de Grace Field · Au-delà du mur |
| Manjirou Sano | Tokyo Revengers | 145341 | 10074 | 1 | Le chef de Toman · Le coup de pied invincible |

## Effet sur les tirages

Les poids et garanties de chaque emplacement ne changent pas. À rareté fixée, un personnage précis partage sa probabilité avec davantage de cartes. Pour un pool uniforme, sa probabilité conditionnelle passe de 1/N à 1/(N+A). Le tableau décrit le catalogue global ; un booster thématique doit utiliser ses seuls candidats éligibles. Un booster à liste fixe garde sa liste. Le pourcentage de collection baisse mécaniquement quand le dénominateur augmente, sans perte de cartes.

| Rareté | Avant | Ajouts | Après | Baisse relative par carte précise |
|---|---|---|---|---|
| Commun | 483 | 90 | 573 | 15.71 % |
| Peu commune | 51 | 64 | 115 | 55.65 % |
| Rare | 6 | 52 | 58 | 89.66 % |
| Épique | 192 | 39 | 231 | 16.88 % |
| Légendaire | 195 | 18 | 213 | 8.45 % |
| Mythique | 197 | 9 | 206 | 4.37 % |

## Vérification

1715 vérifications du catalogue réussies : import sans accord refusé, ajout de 272 cartes, anciens enregistrements identiques, relance idempotente, décisions de rareté stables après changement des favoris, aucun changement des états joueurs fictifs. Import local mesuré : 9388 ms.

Le vrai moteur de tirage observé est testé sur le catalogue élargi : 30 boosters, 60 nouvelles cartes distinctes tirées, probabilités par emplacement identiques avant/après extension, garanties et stocks conservés. La vraie fonction de Résonance confirme les seuils 1/3/6, le plafond de deux formes pour les neuf ajouts, trois pour les anciens, aucune Résonance hors Mythique et aucun double crédit sur rejeu. La suite existante passe aussi : quatre tests de navigation/démarrage, 33 contrôles économiques et 300 000 tirages simulés.

Navigateur intégré : 1 396 personnages, 50 univers et 50 albums sans doublon ; recherche « Mikey » → Manjirou Sano ; album JoJo 30 cartes, pagination 1/4 ; les 18 aperçus chargent leurs WebP 1024 × 1536 entiers. Contrôle mobile demandé à 390 × 844 : largeur utile 375 px, contenu 375 px, sans débordement horizontal. Naruto, Luffy, Mereoleona et Yuno gardent leur troisième palier. L’aperçu désactive les connexions réseau de données et ne se connecte à aucun compte.

## Images

Les 272 portraits et les couvertures AniList sont des références externes dont les droits ne sont pas vérifiés. Leur disponibilité technique ne constitue pas une autorisation de publication. Les 18 nouveaux Éveils ont été générés pour Kizuna, sans reprendre de fanart ; cela ne vaut pas licence sur les personnages représentés.

Les sources de direction sont des fiches officielles de personnages quand disponibles. Les personnages sans transformation utilisent des scènes et postures, sans pouvoirs inventés. L’interface identifie les illustrations comme générées avec l’IA. Les 18 WebP pèsent 6 215 348 octets, plus 18 cadres SVG. Les PNG maîtres et les prompts sont fournis dans le dossier local de livraison.

### Joseph Joestar

Source visuelle : https://jojo-animation.com/

![Joseph Joestar — Hamon — Clackers](../../dist/assets/awakening-illustrations/c6356-1-expansion.webp)

![Joseph Joestar — Hermit Purple](../../dist/assets/awakening-illustrations/c6356-2-expansion.webp)

### Ban

Source visuelle : https://tvsp.7-taizai.net/sp/character/ban.html

![Ban — Le Renard de l’Avarice](../../dist/assets/awakening-illustrations/c77605-1-expansion.webp)

![Ban — Snatch — chasse du renard](../../dist/assets/awakening-illustrations/c77605-2-expansion.webp)

### Ichigo

Source visuelle : https://darli-fra.jp/character/

![Ichigo — Squad 13 — Code 015](../../dist/assets/awakening-illustrations/c124382-1-expansion.webp)

![Ichigo — Delphinium — synchronisation](../../dist/assets/awakening-illustrations/c124382-2-expansion.webp)

### Yumeko Jabami

Source visuelle : https://www.kakegurui-anime.com/character/group01.php

![Yumeko Jabami — L’invitation au jeu](../../dist/assets/awakening-illustrations/c121889-1-expansion.webp)

![Yumeko Jabami — Le pari décisif](../../dist/assets/awakening-illustrations/c121889-2-expansion.webp)

### Rin Okumura

Source visuelle : https://ao-ex.com/tv2017/sp/character/chara1.html

![Rin Okumura — Kurikara dégainé](../../dist/assets/awakening-illustrations/c24482-1-expansion.webp)

![Rin Okumura — Flammes bleues](../../dist/assets/awakening-illustrations/c24482-2-expansion.webp)

### Nanachi

Source visuelle : https://miabyss.com/

![Nanachi — Le refuge de Nanachi](../../dist/assets/awakening-illustrations/c122445-1-expansion.webp)

![Nanachi — Guide de l’Abysse](../../dist/assets/awakening-illustrations/c122445-2-expansion.webp)

### Johan Liebert

Source visuelle : https://anilist.co/character/719

![Johan Liebert — Le sourire de Johan](../../dist/assets/awakening-illustrations/c719-1-expansion.webp)

![Johan Liebert — L’ombre de Ruhenheim](../../dist/assets/awakening-illustrations/c719-2-expansion.webp)

### Ray

Source visuelle : https://neverland-anime.com/character/02/

![Ray — Le stratège de Grace Field](../../dist/assets/awakening-illustrations/c121724-1-expansion.webp)

![Ray — Au-delà du mur](../../dist/assets/awakening-illustrations/c121724-2-expansion.webp)

### Manjirou Sano

Source visuelle : https://tokyo-revengers-anime.com/staff/

![Manjirou Sano — Le chef de Toman](../../dist/assets/awakening-illustrations/c145341-1-expansion.webp)

![Manjirou Sano — Le coup de pied invincible](../../dist/assets/awakening-illustrations/c145341-2-expansion.webp)

## Onze pistes futures, sans import

Ces priorités sont une recommandation éditoriale issue du relevé actuel, pas une décision d’import. Les favoris des personnages ne sont pas confondus avec la popularité du titre. Frieren, Dandadan et Fire Force étaient déjà présents. Solo Leveling est également déjà présent et n’est pas proposé comme nouveau.

| Licence | État | Priorité | Personnages observés (favoris) | Recommandation |
|---|---|---|---|---|
| [Frieren](https://anilist.co/anime/154587) | Déjà présent · 30 | Conserver | Frieren 22 692, Fern 8 767, Stark 6 051 | Album déjà au plafond. Toute évolution doit être une révision séparée, sans remplacement silencieux. |
| [DANDADAN](https://anilist.co/anime/171018) | Déjà présent · 25 | Audit complémentaire | Momo Ayase 7 354, Aira Shiratori 6 156, Ken Takakura 4 707 | Jusqu’à cinq places possibles après examen des personnages et des saisons ; aucune nouvelle carte ici. |
| [Oshi no Ko](https://anilist.co/anime/150672) | Absent | Priorité haute | Kana Arima 11 822, Akane Kurokawa 6 467, Ai Hoshino 6 444 | Distribution identifiable et scènes de scène/cinéma ; Éveils narratifs, sans pouvoirs ajoutés. |
| [Bungo Stray Dogs](https://anilist.co/anime/21311) | Absent | Priorité haute | Osamu Dazai 16 198, Ranpo Edogawa 7 326, Chuuya Nakahara 6 781 | Large distribution et capacités distinctes ; regrouper toutes les saisons et exclure les variantes doublons. |
| [Black Butler](https://anilist.co/anime/4898) | Absent | Priorité moyenne | Sebastian Michaelis 5 470, Ciel Phantomhive 3 694, Grell Sutcliff 2 360 | Identités fortes autour de Sebastian et Ciel ; costumes et manifestations canoniques à sourcer. |
| [Fire Force](https://anilist.co/anime/105310) | Déjà présent · 30 | Conserver | Benimaru Shinmon 6 703, Iris 5 930, Shinra Kusakabe 5 798 | Album déjà au plafond et Éveils existants ; aucune nouvelle rareté imposée par les chiffres actuels. |
| [Noragami](https://anilist.co/anime/20447) | Absent | Priorité haute | Yato 12 795, Hiyori Iki 3 297, Yukine 3 055 | Yato très identifié ; un album resserré vaut mieux que trente figurants. |
| [Magi](https://anilist.co/anime/14513) | Absent | Priorité moyenne | Sinbad 4 084, Morgiana 2 684, Alibaba Saluja 1 919 | Potentiel visuel des Djinn Equip ; vérifier chaque forme. Ne pas confondre avec Madoka Magica, renvoyé par la recherche « Magi ». |
| [Assassination Classroom](https://anilist.co/anime/20755) | Absent | Priorité haute | Karma Akabane 10 567, Koro-sensei 9 716, Nagisa Shiota 6 861 | Ensemble scolaire riche, forte popularité. Exclure les caméos comme Saiki ; ne pas transformer tout le casting en combattants surnaturels. |
| [Seraph of the End](https://anilist.co/anime/20829) | Absent | Priorité moyenne | Shinoa Hiiragi 5 164, Mikaela Hyakuya 4 875, Guren Ichinose 3 016 | Designs reconnaissables, armes et formes à vérifier. Aucune attribution mythique automatique au héros. |
| [Classroom of the Elite](https://anilist.co/anime/98659) | Absent | Priorité haute | Kiyotaka Ayanokouji 15 587, Suzune Horikita 4 496, Kei Karuizawa 3 010 | Fort intérêt pour Ayanokouji ; étapes de stratégie et de mise en scène, sans aura magique inventée. |

## Limites et validation restante

- Aucun import Supabase distant, aucune fusion sur main et aucun déploiement Netlify ne sont effectués. La préparation GitHub est une demande de validation en brouillon.
- Les raretés et les 18 Éveils restent proposés. Les droits des portraits/couvertures doivent être validés ou les images remplacées avant publication.
- Hawk Mama a été retirée après contrôle visuel : portrait 230 × 129 trop peu lisible. Lotte Frank et Karl Neumann restent lisibles, mais leurs portraits 225 × 169 gagneraient à être remplacés par une meilleure source autorisée.
- Le catalogue historique compte déjà 31 cartes One Piece. Cette exception est conservée pour ne pas retirer une carte existante ; toutes les franchises de cette extension respectent le plafond de 30.
- L’export public du catalogue est sauvegardé dans baseline.json. Ce n’est pas une sauvegarde des comptes joueurs ni une preuve de restauration complète de Supabase. Un point de restauration complet doit être vérifié avant un futur import approuvé.
- Les essais de base utilisent PostgreSQL local isolé (PGlite), les fonctions observées en production et des joueurs fictifs. Ils ne remplacent pas une répétition sur une branche Supabase isolée avant la mise en production. Aucun parcours Discord connecté n’est exécuté dans l’aperçu isolé.
- La collecte AniList retient les 50 premiers personnages de chaque média examiné, par favoris, avec pages de 25 effectivement renvoyées. Elle couvre les candidats du top 30 recherché, sans prétendre répertorier tous les figurants. Les rôles MAIN/SUPPORTING et les identifiants servent à filtrer variantes et caméos.

## Reproduire les tests et préparer une publication future

```sh
npm ci
python scripts/build-netlify.py
npm run test:v3
npm run test:expansion
node scripts/prepare-expansion-preview.mjs
python -m http.server 8766 --bind 127.0.0.1 --directory public
```

Ouvrir `http://127.0.0.1:8766/expansion-preview.html`. Ce fichier de test n’est pas dans dist et disparaît à la reconstruction suivante. Le site normal ne charge pas les 272 propositions avant l’import SQL approuvé.

La migration `supabase/migrations/20261110011732_kizuna_anime_expansion.sql` est additive, transactionnelle et protégée par `kizuna.expansion_approved`. Elle conserve les décisions existantes au moment de son application, refuse les collisions d’identité/rareté/album et n’écrit dans aucune table de compte joueur. Ne pas l’exécuter maintenant. Après validation explicite du propriétaire, vérifier les droits, la sauvegarde complète et l’absence de dérive, répéter sur une branche isolée, puis coordonner la mise à jour du site et l’import dans une session autorisée. L’ancienne logique et le site sont conservés dans le commit de base `6d330603b75938fb9c477a30050409ab0984ddf3`.

Les commits et le titre de PR portent `[skip netlify]` pour éviter les publications automatiques. Ne pas fusionner ni retirer ce marqueur avant l’accord.

## Sources

Données vérifiées via [API officielle AniList](https://docs.anilist.co/reference/object/character) et snapshots horodatés dans anilist-evidence.json. Les profils source sont liés dans le CSV. Aucun appel AniList n’est nécessaire au fonctionnement normal du jeu. Les images et leurs intentions sont décrites dans art-directions.json. [Netlify documente le marquage permettant de sauter les déploiements](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/#skip-a-deploy).
