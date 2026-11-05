# KIZUNA — GitHub → Netlify

## D'abord : envoyer sur GitHub

1. **Extraire le ZIP principal une seule fois.** Ouvrir le dossier qui contient ce README et `netlify.toml`.
2. Sur le dépôt GitHub, choisir **Add file → Upload files** (ou **uploading an existing file** si le dépôt est vide).
3. Glisser **tout le contenu de ce dossier** dans la zone d'envoi : fichiers ET sous-dossiers. Ne pas glisser le dossier parent. Attendre la fin des transferts puis **Commit changes**.

**Ne pas envoyer uniquement le ZIP principal. Ne pas décompresser les 7 ZIP dans `medias/` ni `maintenance-originale.zip`.** Ils doivent rester tels quels : Netlify reconstruit les médias automatiquement. Le dossier `medias/` contient aussi `manifest.json` : ne pas l'oublier.

À la fin, `netlify.toml`, `package.json`, `README.md`, `dist/`, `src/`, `scripts/`, `medias/` et `supabase/` doivent être visibles directement à la racine du dépôt. Ne pas publier sur la branche principale d'un projet commun déjà rempli sans l'accord de ses responsables : utiliser une branche et une pull request. Ce paquet est adapté au dépôt vide précédemment identifié, mais ne contient aucune automatisation qui remplace du code à distance.

## Ensuite : importer dans Netlify

**Add new project → Import an existing project → GitHub → choisir le dépôt.**

Les réglages sont déjà dans `netlify.toml`. Si Netlify les demande :

| Réglage | Valeur |
| --- | --- |
| Framework | Aucun / Other |
| Base directory | Laisser vide |
| Build command | `python3 scripts/build-netlify.py` |
| Publish directory | `public` |
| Production branch | La branche validée par les responsables, souvent `main` |

Le paquet n'utilise pas Codex pour construire le site. Python et Node sont fournis par l'environnement de construction Netlify. Aucun module supplémentaire n'est téléchargé par ce build : les bibliothèques du navigateur déjà compilées dans le projet ont été conservées.

**Le site n'a pas été publié à distance lors de la préparation de ce paquet.** Une compilation locale ne vérifie pas à elle seule la connexion Discord, les permissions des joueurs ou les opérations de la base distante.

## Important : finir la migration Discord / Supabase

L'interface est préparée pour Netlify, mais **les autorisations de l'ancien domaine ne se migrent pas en copiant des fichiers dans GitHub**. Sans les actions ci-dessous, la connexion Discord et certaines fonctions de compte / administration peuvent échouer.

Conserver le projet Supabase existant `hxbujmdzidtwmalmqrwt` (Yugen Manga RP). Ce backend est partagé avec une autre application. **Ne pas remplacer son Site URL global, ne pas supprimer ses autres URL autorisées, ne pas réinitialiser les tables et ne pas rejouer tous les fichiers SQL.** Ce paquet ne contient pas de sauvegarde des données des joueurs.

Une fois l'adresse de production Netlify connue, un administrateur du projet Supabase doit :

1. Dans **Authentication → URL Configuration → Redirect URLs**, ajouter ces adresses en remplaçant `NOM-DU-SITE` par le vrai nom :

   ```text
   https://NOM-DU-SITE.netlify.app/?auth=discord
   https://NOM-DU-SITE.netlify.app/?auth=confirmed
   https://NOM-DU-SITE.netlify.app/?auth=recovery
   ```

2. Dans les **Secrets des Edge Functions**, ajouter :

   ```text
   KIZUNA_ALLOWED_ORIGINS=https://NOM-DU-SITE.netlify.app
   KIZUNA_SITE_URL=https://NOM-DU-SITE.netlify.app
   ```

   La première valeur est une liste d'origines HTTPS exactes séparées par des virgules, sans chemin ni barre oblique finale. N'autoriser que les domaines contrôlés du projet. **Ne pas mettre `*` ou tous les domaines `netlify.app`.** La seconde valeur permet aux éventuels courriels du point d'entrée historique Kizuna d'utiliser la nouvelle adresse.

3. **Publier les sources adaptées des quatre fonctions existantes** fournies dans `supabase/functions/` : `kizuna-discord-profile`, `kizuna-staff`, `kizuna-catalogue-admin` et `kizuna-auth`. Conserver leur configuration d'authentification actuelle et les fichiers partagés. Les contrôles de session, de rôles et les règles de données n'ont pas été désactivés. Le secret d'origine supplémentaire n'a d'effet qu'après publication de ces sources adaptées ; les anciennes sources n'en tenaient pas compte.

   Cela peut être fait par le responsable du backend depuis son flux de déploiement habituel ou l'éditeur des fonctions du tableau de bord. **Netlify ne publie pas ces fonctions Supabase.** Le paquet conserve les anciennes origines pour éviter de casser immédiatement le site précédent.

Le callback de l'application Discord reste celui de Supabase :

```text
https://hxbujmdzidtwmalmqrwt.supabase.co/auth/v1/callback
```

Le build utilise automatiquement la variable Netlify `URL` comme adresse de production. Pour un domaine personnalisé ou un changement de nom, définir aussi **`KIZUNA_SITE_URL` dans Netlify**, avec l'origine HTTPS de production, puis redéployer et ajouter cette même origine aux autorisations Supabase. Les previews renvoient volontairement vers l'origine de production pour que le vérificateur PKCE et le retour Discord restent sur la même origine.

Les sauvegardes **locales** du navigateur restent attachées à l'ancien domaine. Exporter ou synchroniser les données invitées avant le changement de domaine. Les données de comptes déjà sauvegardées dans le même backend ne sont pas déplacées par ce paquet ; les joueurs devront se reconnecter sur la nouvelle adresse.

## Pour les personnes qui modifient le projet

- **`dist/`** : HTML, CSS et JavaScript réellement servis ; le nom est conservé pour éviter une refonte du projet.
- **`src/`** : fragments JavaScript réinjectés dans `dist/index.html` à chaque build. Modifier ces fragments, et non leur copie entre les marqueurs `KIZUNA_*_BEGIN/END` dans le HTML.
- **`medias/`** : 7 archives d'images, polices et données d'illustrations. Le contenu est reconstruit en `public/assets/` sans perte de qualité. Pour ajouter ou remplacer une image, déposer le fichier dans `dist/assets/` au même chemin : il prend priorité sur l'archive.
- **`supabase/functions/`** : sources serveur adaptées au nouveau domaine ; elles sont publiées séparément sur Supabase, pas sur Netlify.
- **`maintenance-originale.zip`** : conservation intacte des scripts avancés, tests d'origine, schémas SQL, graines de données, documentation et anciens fichiers npm. Ce ZIP reste une référence de développement, jamais un contenu public du site. Pour changer le moteur de rareté, les graines ou régénérer les illustrations, reprendre l'outillage original dans une copie de travail distincte, puis reporter les fichiers générés dans ce dépôt. Ne pas décompresser la maintenance par-dessus le projet prêt à déployer : elle contient l'ancien `package.json`.
- **`scripts/build-netlify.py`** : extraction vérifiée des médias, synchronisation des fragments, préparation de l'origine de connexion, validation des références HTML/CSS et production de `public/`.

Le build ne relance volontairement **pas** les générateurs de catalogue ou d'illustrations et ne modifie **aucune donnée Supabase**. Il préserve les fichiers précompilés fournis. Le résultat `public/` n'est pas à envoyer dans GitHub : Netlify le recrée.

Pour compiler localement (Python 3.10+ et Node 22+) :

```sh
python3 scripts/build-netlify.py
```

Sur Windows, `py scripts/build-netlify.py` convient également si Python et Node sont installés. Un simple double-clic sur `index.html` n'est pas un test valide du site : utiliser un serveur HTTP, et HTTPS en production pour la connexion.

## Sécurité et état des vérifications

Seuls l'URL du backend et sa clé **publique publishable** sont présents côté navigateur, comme dans l'archive fournie. Ne jamais ajouter de clé `service_role`, `sb_secret`, jeton GitHub, mot de passe ou fichier `.env` dans le dépôt ou les archives. Aucun secret privé n'a été détecté par le contrôle de motifs effectué à la préparation ; ce contrôle n'est pas un audit complet.

Les contrôles locaux et leurs limites sont détaillés dans `VERIFICATION.txt`. L'envoi GitHub, le déploiement Netlify réel et la connexion Discord réelle ne sont pas effectués par ce paquet.

## Documentation officielle consultée

- GitHub, ajout de fichiers : https://docs.github.com/fr/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- Netlify, configuration : https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify, environnement : https://docs.netlify.com/build/configure-builds/available-software-at-build-time/
- Supabase, redirections Auth : https://supabase.com/docs/guides/auth/redirect-urls
- Supabase, CORS des fonctions : https://supabase.com/docs/guides/functions/cors
