# BlueNav

Navigateur en développement à partir des sources natives de Brave/Chromium, avec une interface épurée inspirée de Zen.

**État actuel : la compilation native n'a pas encore été réalisée.** Les anciens exécutables 1.0.0 et `bluenav-desktop/` sont un prototype Electron ; ils ne contiennent pas l'ensemble des fonctions de Brave.

Le workflow GitHub Actions cible maintenant Brave/Chromium. Il valide la configuration sur les runners GitHub standards, puis compile sur un runner Windows dédié lorsqu'il est configuré. Voir le [guide de compilation native](docs/BLUENAV-NATIVE.md).

La configuration [bluenav.native.json](bluenav.native.json) prépare :

- Les onglets verticaux, une barre de titre réduite et une palette sombre prune.
- La désactivation de P3A, du ping quotidien, de Web Discovery et de la destination d'envoi des rapports de plantage.
- La conservation des fonctions natives de Brave, dont Shields et les extensions.

Le rendu, la compatibilité des services, l'isolation de l'installateur et les communications réseau doivent encore être vérifiés sur un binaire compilé. Aucune garantie « zéro connexion » n'est annoncée.

Les sources Chromium sont téléchargées par le workflow à la révision définie dans `package.json`. Le dossier de ce dépôt est placé dans `native/src/brave` pour respecter l'organisation attendue par les outils Brave.

## Vérifications locales

```powershell
python tools/bluenav/apply_native.py --check
python -m unittest discover -s tools/bluenav -p 'test_*.py' -v
```

Ces commandes contrôlent les changements de sources sans compiler le navigateur ni modifier les fichiers C++ locaux.

## Prototype historique

`Lancer_BlueNav.bat` lance encore le prototype Electron. Il est conservé pour référence et n'est plus distribué automatiquement par le workflow natif.

## Licence

Les sources Brave restent couvertes par la licence MPL-2.0 et les licences tierces associées. Les notices de leurs auteurs sont conservées. La version native est en préparation : voir [CHANGELOG.md](CHANGELOG.md).
