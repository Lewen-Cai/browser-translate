<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — traduction dans le navigateur, respectueuse de la vie privée" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Lisez les pages et les sous-titres avec le modèle de votre choix.</strong><br>Open source · Votre propre clé API · Aucun relais · Aucune télémétrie</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd><b>Français</b></kbd></a><br>
  <a href="./de.md"><kbd>Deutsch</kbd></a>
  <a href="./pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./it.md"><kbd>Italiano</kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">Installer</a> · <a href="#configuration">Configurer</a> · <a href="../CHANGELOG.md">Changements</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Signaler un problème</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Dernière version"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Pourquoi BrowserTranslate ?

Utilisez votre fournisseur préféré sans abonnement obligatoire à cette extension ni serveur intermédiaire exploité par notre projet.

- **Votre modèle et votre clé** : connectez un endpoint compatible OpenAI ou un environnement local. La compatibilité dépend du serveur et du modèle.
- **Connexion directe** : le texte part du navigateur vers le fournisseur choisi. Nous n’exploitons aucun relais.
- **Aucune télémétrie** : pas de statistiques d’utilisation, de rapports d’erreur distants ni de journalisation distante par l’extension.
- **Prompt de base modifiable** : consultez le modèle par défaut et créez vos variantes. Une même base sert à tous les modes LLM ; l’extension conserve les règles internes du dictionnaire et du format.

<a id="features"></a>
## Fonctionnalités

- **Démarrage sans clé API** : Microsoft et Google sont activés dès l’installation ; les trois modes utilisent initialement Microsoft. Il s’agit d’endpoints publics non officiels : consultez l’[avertissement](#free-engines).
- **Un moteur par usage** : sélection, page entière et sous-titres peuvent utiliser des fournisseurs différents. Plusieurs configurations sont conservées pour éviter de ressaisir les identifiants à chaque changement.
- **Traduction de sélection** : sélectionnez du texte puis cliquez sur l’icône flottante, ou utilisez le mode raccourcis. Le texte ordinaire arrive en streaming, avec l’original au-dessus. La carte propose copie, nouvelle traduction et choix ponctuel du fournisseur ou de la langue. Ces choix ne modifient pas les réglages globaux ; retraduire contourne le cache.
- **Carte stable et déplaçable** : dimensions réglables dans Général → Apparence. Original et traduction défilent séparément, l’original occupant au plus 30 % du corps partagé. L’attente utilise une vue compacte. Épinglez la carte pour la garder ouverte pendant le défilement ou les clics extérieurs, puis déplacez-la par sa poignée.
- **Page bilingue** : la traduction s’insère sous le texte original du contenu principal, en excluant généralement navigation, en-têtes et pieds de page. Le traitement progresse autour de la zone visible. Utilisez Page actuelle → Traduction bilingue dans le popup, ou **Alt+A** en mode raccourcis.
- **Dictionnaire pour les sélections courtes** : un modèle peut fournir traduction, prononciation, catégorie grammaticale, sens et exemple. Les paragraphes manifestes, sélections multilignes ou ressemblant à du code sont uniquement traduits. Les services classiques ne génèrent pas de fiches de dictionnaire.
- **Texte multilingue autorisé** : une langue source identique à la cible ne bloque jamais une demande. La réécriture régionale dépend du modèle ou du service.
- **Configuration et cache locaux** : durée de conservation réglable dans Paramètres → Données. Import/export JSON des réglages et prompts ; le cache est exclu, ainsi que les clés API sauf choix explicite.
- **Interface compacte** : thème clair/sombre manuel ou système, cinq pages — Général, Traduction, Fournisseurs, Sous-titres, Données. Polices système pour l’interface et chasse fixe pour code et endpoints.

<a id="subtitles"></a>
### Sous-titres vidéo

Traduction des pistes existantes sur **YouTube**, les **enregistrements cloud Zoom**, les **enregistrements de cours Canvas** et les lecteurs compatibles exposant des sous-titres via `<track>`/TextTrack. Le fonctionnement dépend du lecteur et de l’accès à la piste ; tous les lecteurs intégrés n’ont pas été testés. **Aucune transcription audio n’est effectuée.**

Cliquez sur l’icône de traduction du lecteur, puis activez les sous-titres traduits. Sans barre de commandes adaptée, le bouton apparaît dans un coin de la vidéo. Sur YouTube, activez d’abord les sous-titres natifs (CC) pour charger la piste ; d’autres lecteurs peuvent aussi exiger son activation. Les pistes du créateur et les sous-titres automatiques compatibles sont acceptés ; les fragments ASR déroulants sont regroupés en phrases.

Les deux lignes sont superposées au lecteur et se déplacent par leur poignée. La position est mémorisée, y compris en plein écran, et évite les commandes visibles. La traduction privilégie les répliques proches de la lecture en cours et se réorganise après un déplacement dans la vidéo. Les noms de locuteurs reconnus sont conservés tels quels. La latence dépend du fournisseur et de la vidéo, sans délai fixe garanti.

Le menu du lecteur et **Paramètres → Sous-titres** règlent affichage bilingue/original seul/traduction seule, ordre, opacité, taille, couleur, police et graisse de chaque ligne. La page de réglages comprend aperçu en direct, valeurs précises, petite palette, saisie HEX et bouton de réinitialisation.

<a id="languages"></a>
### Langues

**56 cibles de traduction** sont indépendantes des **14 langues d’interface** proposées ci-dessus. L’interface peut suivre la langue du navigateur. Les sélecteurs du popup, des paramètres et de la carte recherchent noms natifs, anglais ou localisés, codes et alias régionaux de l’anglais. Les noms RTL conservent leur sens de lecture sans désaligner les lignes.

L’anglais distingue **États-Unis, Royaume-Uni et Australie** ; l’ancien `en` générique devient l’anglais américain. Le chinois distingue **simplifié et traditionnel**. Les LLM reçoivent des consignes d’orthographe et de vocabulaire régionales. Un service gratuit non compatible avec la variante utilise silencieusement l’anglais générique, sans changer de fournisseur.

<a id="architecture"></a>
## Architecture

<p align="center"><img src="../assets/framework.png" alt="Architecture de BrowserTranslate et connexions directes aux fournisseurs" width="760"></p>

Les requêtes LLM et de traduction automatique passent par le **service worker d’arrière-plan**. Le JavaScript du site ne reçoit pas votre clé API. Les scripts de contenu affichent les résultats et s’intègrent aux pages/lecteurs ; certaines récupérations de sous-titres s’exécutent aussi dans le contexte de contenu ou de page. Aucun relais n’est exploité par le projet.

<a id="installation"></a>
## Installation

Pour les **navigateurs de bureau basés sur Chromium**, dont Chrome, Edge, Brave et Arc. Firefox n’est pas actuellement pris en charge.

1. Téléchargez le dernier `.zip` depuis [Releases](https://github.com/Lewen-Cai/browser-translate/releases).
2. Décompressez-le dans un dossier à conserver.
3. Ouvrez `chrome://extensions` ou la page des extensions, activez le **mode développeur**, choisissez **Charger l’extension non empaquetée**, puis ce dossier.

### Mise à jour manuelle

Une extension non empaquetée ne se met pas à jour automatiquement. Décompressez la nouvelle archive par-dessus le dossier existant, cliquez sur **Recharger**, puis actualisez les pages ouvertes. Sous Windows/macOS, l’installation gérée d’extensions auto-hébergées nécessite généralement une politique d’entreprise ; charger un dossier non empaqueté est une autre procédure.

L’en-tête des paramètres affiche la version et une vérification manuelle. GitHub n’est interrogé qu’au clic ; si une version plus récente existe, l’archive est proposée, sans installation automatique. Le popup n’affiche pas à nouveau la version.

<a id="configuration"></a>
## Configuration

Microsoft est utilisé initialement pour tous les modes. Pour votre propre modèle :

1. Ouvrez le popup puis son icône de paramètres.
2. Dans **Fournisseurs**, activez un service et renseignez endpoint, modèle et clé API. Les environnements locaux n’exigent pas de clé. Les lignes actives affichent état/latence au moyen d’une vérification qui contacte le fournisseur.
3. Dans **Traduction → Moteurs de traduction**, affectez séparément sélection, page entière et sous-titres.
4. Choisissez une cible et sélectionnez du texte sur une page compatible. Pour le clavier, activez le mode raccourcis dans **Général** : **Alt+T** pour la sélection, **Alt+A** pour la page entière. Les deux ne fonctionnent que dans ce mode.

Le popup garde cible, interrupteur de la page actuelle et moteurs. Mode d’activation et raccourcis restent dans les paramètres. Les pages non compatibles désactivent la traduction ; un script absent entraîne une invitation à actualiser. Prompts et affectations sont dans Traduction, identifiants dans Fournisseurs, apparence des sous-titres dans Sous-titres, cache et import/export dans Données.

### Fournisseurs et raisonnement

Préréglages : **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral, opencode**. En local : **LM Studio, Ollama, llama.cpp, vLLM**. Les autres services compatibles utilisent un endpoint personnalisé.

Les régions et offres sont distinctes : opencode Zen/Go, Qwen à Pékin, Singapour, Hong Kong et en Virginie, ainsi que Token Plan. Comptes, clés et catalogues ne sont pas forcément interchangeables. Certains fournisseurs acceptent une URL propre à un espace de travail.

Lorsque le contrôle est pris en charge, l’extension demande par défaut de désactiver le raisonnement et propose **Low / Medium / High / XHigh / Max**, adaptés aux paramètres du fournisseur. Pour un serveur personnalisé/local, choisissez son format de paramètre ou **Ne rien envoyer**. Sans contrôle compatible, le réglage du serveur s’applique. Support, latence et facturation des tokens de raisonnement dépendent du modèle/endpoint, pas seulement de l’interface.

<a id="prompts"></a>
### Prompt de base

Dans **Traduction → Prompt de base**, bibliothèque et éditeur sont côte à côte, ou empilés dans une fenêtre étroite. Le modèle par défaut est visible et en lecture seule. **Nouveau** permet de partir du défaut ou d’un document vide ; l’aide se trouve sous l’éditeur, dans la carte. Sélectionner un modèle l’ouvre seulement ; le prompt actif est indiqué séparément.

- **Enregistrer et appliquer** sauvegarde le brouillon et l’utilise immédiatement.
- **Enregistrer les modifications** met à jour le prompt déjà actif.
- **Appliquer le prompt** utilise un modèle enregistré ; désactivé s’il est déjà actif.
- **Annuler** abandonne les modifications locales.
- **Actions du modèle** regroupe enregistrement sans application, duplication, remplacement du brouillon par le texte par défaut et suppression. Les opérations destructives demandent confirmation ; supprimer le modèle actif rétablit le défaut.

Vos instructions **remplacent** la base au lieu de s’y ajouter. L’extension fournit encore langue cible, conventions régionales, routage et format ; les protocoles internes ne sont pas modifiables. Des consignes contradictoires ou un modèle moins capable peuvent produire un résultat imparfait. `{{...}}` reste littéral : aucun remplacement de variables.

Jusqu’à **20 modèles personnalisés**, chacun limité à **12 000 caractères**, stockés localement. Ils n’affectent que les LLM, pas Microsoft/Google classiques. Une modification utilise un cache distinct ; l’export inclut modèles et choix actif.

<a id="validation"></a>
### Validation des réponses

Les passages manifestes ne reçoivent pas de consignes de dictionnaire. Pour une sélection courte, l’entrée doit correspondre à toute la sélection et non à un mot extrait. Les sorties structurées suspectes sont retenues puis vérifiées ; la carte reçoit un type explicite au lieu de le deviner à partir de `{`.

Une réponse de sélection invalide autorise au plus **une requête corrective en texte brut**. Un lot page/sous-titres invalide revient à **une requête texte par segment non mis en cache**. Cela peut consommer davantage de tokens ; les reprises réseau sont distinctes. Un échec persistant affiche une erreur, jamais le JSON du protocole comme traduction, et n’est pas mis en cache.

Les identifiants de lot doivent être uniques et complets ; les réponses sont remises dans l’ordre d’entrée, sans convertir artificiellement nombres ou objets en texte. Les clés de cache liées au protocole et la validation à la lecture isolent les anciens résultats non vérifiés. Les structures présentes dans le texte source restent traduisibles comme texte.

**La validation du format ne garantit pas le sens ni la détection de toutes les omissions.** Les étiquettes de langue sont des indications locales, avec un marquage prudent des écritures mixtes ; elles ne bloquent ni ne routent les requêtes.

<a id="free-engines"></a>
### Services de traduction gratuits

Microsoft et Google utilisent `edge.microsoft.com` et `translate-pa.googleapis.com`.

- **Pas des API officielles** : ces endpoints servent leurs propres fonctions web/navigateur, sans contrat public pour cette extension.
- **Aucune affiliation ni approbation** : le projet n’est ni affilié, ni sponsorisé, ni approuvé par Microsoft ou Google. Les marques appartiennent à leurs titulaires et identifient seulement le service.
- **Disponibilité non garantie** : changement ou arrêt possible sans préavis. Vous pouvez passer à votre modèle, dont la disponibilité dépend de son fournisseur.
- **Texte envoyé au service** : ses conditions et sa politique de confidentialité s’appliquent. Pour du contenu sensible, choisissez un endpoint approprié sous votre contrôle.
- **Aucune garantie** : fourni en l’état, à vos risques. Pour un usage commercial ou intensif, utilisez des API officielles dûment autorisées.

Microsoft est le défaut pour une première utilisation immédiate. Affecter un mode à votre modèle arrête l’usage de ces endpoints publics pour ce mode.

<a id="privacy"></a>
## Confidentialité et données locales

L’absence de relais et de télémétrie **ne signifie pas que tout est traité localement**. Les fournisseurs cloud reçoivent le texte soumis ; un environnement local peut conserver le traitement du modèle sur votre ordinateur. La récupération de sous-titres contacte le site vidéo ; les vérifications manuelles contactent GitHub. Ces services reçoivent les métadonnées réseau habituelles, comme votre adresse IP.

Réglages, clés et cache sont stockés dans `chrome.storage.local`. **L’extension ne chiffre pas les clés API.** Les exports les excluent par défaut ; les inclure crée un fichier en clair à protéger. Le cache n’est pas exporté et aucun historique de traduction consultable n’est maintenu.

<a id="development"></a>
## Développement

```bash
pnpm install
pnpm dev          # Compilation continue : .output/chrome-mv3-dev/
pnpm test         # Tests en mode surveillance
pnpm test:run     # Une exécution des tests
pnpm typecheck    # Types WXT + TypeScript
pnpm lint
pnpm build        # Production : .output/chrome-mv3/
```

Chargez le dossier de sortie comme extension non empaquetée. Rechargez l’extension et les pages après un changement de build. Consultez [CHANGELOG.md](../CHANGELOG.md) et signalez problèmes ou demandes dans [Issues](https://github.com/Lewen-Cai/browser-translate/issues), sans clé API ni contenu privé.

<a id="acknowledgements"></a>
## Remerciements

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0 ; un excellent projet dont nous nous sommes inspirés pour apprendre.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT ; logos des fournisseurs. Les marques restent la propriété de leurs titulaires et servent uniquement à identifier les services.

<a id="license"></a>
## Licence

[GPL-3.0](../LICENSE). Les œuvres dérivées distribuées doivent respecter les obligations de code source et de licence. Les ressources tierces conservent leurs licences respectives.
