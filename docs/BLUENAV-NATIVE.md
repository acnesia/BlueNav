# BlueNav natif

La cible est Brave/Chromium avec ses fonctions natives. `bluenav-desktop/` et les anciens installateurs 1.0.0 sont un prototype Electron distinct. Le workflow ne publie plus ce prototype comme un navigateur Brave complet.

## Compilation GitHub Actions

Le workflow `.github/workflows/bluenav-build.yml` valide chaque changement sur GitHub. La compilation Windows nécessite un runner dédié. Aucun runner dédié n'était enregistré lors de la préparation du workflow.

1. Dans Settings → Actions → Runners, connecter un runner Windows x64, ou configurer un grand runner GitHub compatible avec le compte. Lui attribuer un label unique, par exemple `bluenav-windows`.
2. Préparer Visual Studio avec les outils C++, le SDK et les prérequis de la [révision Chromium](https://chromium.googlesource.com/chromium/src/+/153.0.8010.28/docs/windows_build_instructions.md). Prévoir un SSD de plusieurs centaines de Go, au moins 150 Gio libres, 16 Gio de RAM minimum et de préférence 32 à 64 Gio. Utiliser un chemin de travail court sans espaces et activer la prise en charge des liens symboliques requise par Chromium.
3. Dans Settings → Secrets and variables → Actions → Variables, créer `BLUENAV_WINDOWS_RUNNER` contenant ce label. Cette variable est une configuration, pas un secret.
4. Dans Actions → BlueNav native Windows, lancer Run workflow sur `main`.
5. Récupérer l'artefact `BlueNav-native-Windows-x64-<commit>` uniquement après réussite de la compilation. Il contient l'installateur non signé, son SHA-256, la révision des sources et les arguments GN.

Les pull requests exécutent seulement les validations sur un runner GitHub hébergé. Le runner Windows n'exécute que les changements de `main` ou un lancement manuel autorisé. Sans variable de runner, le job natif est explicitement ignoré, sans produire d'EXE. Le succès des validations ne signifie pas que Brave a été compilé.

Le checkout est placé dans `native/src/brave`, comme l'exigent les scripts Brave. Le workflow synchronise la version Chromium épinglée dans `package.json`, puis applique `tools/bluenav/apply_native.py`. Les ajustements sont centralisés dans `bluenav.native.json`. Une modification inattendue des sources interrompt l'application avant toute écriture. Une seconde application sans checkout propre est volontairement refusée.

Les dépendances et sorties Chromium restent sur le runner dédié entre les exécutions. Aucun nettoyage automatique de ces caches n'est prévu. La première compilation peut durer de nombreuses heures. Les runners GitHub Windows standards annoncent seulement [14 Go de stockage](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) ; ils ne constituent pas la cible de compilation native. L'utilisation d'un runner cloud payant doit être décidée par le propriétaire.

## Apparence et confidentialité

Les nouveaux profils activent les onglets verticaux et masquent le titre Windows ainsi que les widgets du nouvel onglet. La palette sombre reprend les tons prune de la référence, en respectant les thèmes personnalisés et le contraste élevé. Ce premier ajustement natif ne reproduit pas encore tous les comportements de Zen ; le rendu doit être vérifié sur le navigateur compilé. Les profils existants conservent leurs choix d'apparence.

La configuration exclut le module de ping quotidien et Web Discovery via GN. P3A renvoie toujours désactivé, y compris avec une ancienne préférence activée ; son initialisation et ses observateurs habituels sont interrompus. La destination de téléversement des plantages est vide.

Les services de protection, les listes Shields, les extensions et les fonctions facultatives de Brave restent présents. Cela ne garantit pas l'absence de toutes les connexions en arrière-plan : mises à jour de composants, services activés volontairement et sites visités peuvent encore communiquer. Un audit réseau du binaire reste nécessaire, notamment au premier lancement, après import de profil et après une période d'inactivité.

## Limites avant distribution

- Aucun binaire natif n'a encore été validé par cette chaîne ; les contrôles Python vérifient la transformation des sources, pas la compilation C++.
- Les identifiants d'installation, certaines chaînes et icônes restent ceux de Brave. Tester l'installateur dans une VM, sans profil Brave personnel, avant toute diffusion. Le renommage complet et l'isolation du produit restent à réaliser.
- La signature du binaire, le canal de mises à jour propre à BlueNav, Widevine et les intégrations nécessitant des clés ou des accords externes ne sont pas validés. Ne pas publier une release stable avant ces vérifications.
- Le lanceur local `Lancer_BlueNav.bat` reste celui du prototype Electron ; il ne sert pas à tester ces modifications natives.

Les traductions natives restent dans les ressources de localisation GRD/GRDP existantes de Brave, sans introduire de textes d'interface dans le code C++.
