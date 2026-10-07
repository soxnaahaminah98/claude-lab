# Analyse concurrentielle — IT Parc vs GLPI, Snipe-IT, Freshservice

Date des observations : 2 octobre 2026. Pages publiques uniquement (pas de connexion, d'inscription, d'essai ni de formulaire). Captures en pleine page dans `screenshots/`.

**Convention.** Chaque fait est suivi de sa source : une capture (`[nom.png]`) et/ou une URL. « **non observé** » = absent des pages visitées ; cela ne prouve pas que la fonction n'existe pas. Les mentions « *calcul* » sont mes propres calculs, pas des chiffres publiés.

**Méthode et limites.**
- Le serveur MCP Playwright n'a pas pu se connecter (`CONNECT_TIMEOUT`). J'ai utilisé la bibliothèque Playwright (Chromium headless) installée en local, avec le même type de navigation.
- Cookies : GLPI → bouton « Refuser » ; Snipe-IT → aucun bandeau détecté ; Freshservice → « Preferences » puis « Confirm My Choices » sans « Accept all ». Je n'ai pas vérifié l'état exact des interrupteurs de ce panneau.
- Freshservice n'a pas de page « fonctionnalités » dans le menu ; j'ai utilisé `/features/` (trouvée par sondage d'URL) et ajouté la page ITAM.
- GLPI : la page fonctionnalités est composée d'accordéons ; j'en ai déplié une partie (Helpdesk et Administration ne se sont pas ouverts). L'onglet « Auto-hébergé » de la page tarifs n'a pas pu être lu : **non observé**.
- Les pages ont été vues en français pour GLPI et Freshservice, en anglais pour Snipe-IT (aucune version française repérée).

## 1. Sources et captures

| Outil | Accueil | Fonctionnalités | Tarifs |
|---|---|---|---|
| GLPI | [glpi-home.png](screenshots/glpi-home.png) — <https://www.glpi-project.org/fr/> | [glpi-features.png](screenshots/glpi-features.png) — <https://www.glpi-project.org/fr/features/> | [glpi-pricing.png](screenshots/glpi-pricing.png) — <https://www.glpi-project.org/fr/pricing/> |
| Snipe-IT | [snipeit-home.png](screenshots/snipeit-home.png) — <https://snipeitapp.com/> | [snipeit-features.png](screenshots/snipeit-features.png) — <https://snipeitapp.com/product> | [snipeit-pricing.png](screenshots/snipeit-pricing.png) — <https://snipeitapp.com/pricing> |
| Freshservice | [freshservice-home.png](screenshots/freshservice-home.png) — <https://www.freshworks.com/fr/freshservice/> | [freshservice-features.png](screenshots/freshservice-features.png) — <https://www.freshworks.com/fr/freshservice/features/> ; ITAM : [freshservice-itam.png](screenshots/freshservice-itam.png) — <https://www.freshworks.com/fr/freshservice/it-asset-management/> | [freshservice-pricing.png](screenshots/freshservice-pricing.png) — <https://www.freshworks.com/fr/freshservice/pricing/> |

## 2. Fiches par outil

### 2.1 GLPI (Teclib')

- **Promesse** : « Réinventez la gestion de vos services informatiques » ; titre de page « Gestion des services, Helpdesk et Suivi des actifs en Open Source » [glpi-home.png].
- **Gestion d'actifs** : inventaire dynamique sans agent, scan réseau, remontées SNMP, déploiement d'applications, CMDB, gestion de centre de données, gestion financière (budgets, fournisseurs, licences) [glpi-home.png]. Actifs personnalisés, composants, unicité des champs [glpi-features.png].
- **Helpdesk** : incidents/demandes, formulaires pour catalogue de services, SLA [glpi-home.png] ; collecteurs d'e-mails qui créent des tickets, notifications [glpi-features.png].
- **QR / code-barres** : **non observé**.
- **Mobile** : la page d'accueil liste « Gestion des applications mobiles » et « Gestion des appareils mobiles (MDM) » [glpi-home.png]. Application ou interface mobile pour les utilisateurs : **non observé**.
- **Microsoft 365 / Entra / Intune** : SSO OAuth2 avec Microsoft et Azure AD, LDAP, CAS, SCIM [glpi-pricing.png]. Intune / Microsoft 365 : **non observé**.
- **Français** : site en français, support « en français et anglais » [glpi-pricing.png]. Langues de l'interface du logiciel : **non observé**.
- **Hébergement** : open source (titre de page) ; Cloud géré par Teclib' (OVHCloud) ou auto-hébergé [glpi-pricing.png]. Détail de l'offre auto-hébergée : **non observé**.
- **Tarifs** (HT) : Public Cloud 19 €/utilisateur/mois (dès 1 utilisateur) ; Private Cloud 21 €/utilisateur/mois (facturation minimale 25) ; Private sur mesure sur devis. Essai gratuit 45 jours. Actifs et utilisateurs finaux illimités ; plugins du marketplace GLPI Network inclus [glpi-pricing.png]. *Calcul* : 150 utilisateurs × 21 € ≈ 3 150 €/mois HT. Une page plus loin indique « agents minimum facturés » : la notion d'« utilisateur » facturé vs « agent » n'est pas clarifiée sur la page → **à vérifier avec Teclib'**.
- **Multi-site / faible bande passante** : offre « Private sur mesure » avec réplication MySQL multi-sites, redondance géographique, RTO < 1 h [glpi-pricing.png]. Hébergement en France ; pièces jointes limitées à 20 Mo [glpi-pricing.png]. Mode hors ligne ou faible débit : **non observé**.

### 2.2 Snipe-IT (Grokability)

- **Promesse** : « Free open source IT asset management » ; « Say goodbye to spreadsheets » [snipeit-home.png, snipeit-features.png]. Centré sur les actifs, pas sur le helpdesk.
- **Gestion d'actifs** : suivi des affectations et de l'emplacement, check-in/out en un clic, historique complet, champs personnalisés, audits, import/export CSV, kits, acceptation par l'utilisateur avec signature numérique, alertes de garantie et de licence, consommables, composants, plusieurs sociétés dans une installation [snipeit-features.png].
- **Helpdesk / tickets** : **non observé** comme fonction native. Les pages parlent d'une intégration Jira et d'un projet communautaire « Snipe-IT Integration for Freshservice » [snipeit-features.png].
- **QR / code-barres** : « Generate QR code labels », compatibilité avec la plupart des lecteurs de codes-barres portables et applications de lecture de QR [snipeit-features.png].
- **Mobile** : « Mobile-friendly for asset updates on the go », « works on any device » [snipeit-features.png]. Application native : **non observé**.
- **Microsoft / Entra / Intune** : adaptateur de synchronisation natif **Microsoft Intune** (parmi ~20 : Jamf, Kandji, JumpCloud, Google Workspace, UniFi, Meraki…) ; SAML SSO, LDAP/Active Directory, SCIM [snipeit-features.png]. Mention explicite « Entra » ou Microsoft 365 : **non observé** (mais SAML/SCIM sont des mécanismes habituellement utilisables avec Entra — à confirmer dans la documentation).
- **Français** : « Translated into over 55 languages », langue par utilisateur [snipeit-features.png]. Le français n'est pas nommé : **non observé** (site vitrine en anglais).
- **Hébergement** : open source, auto-hébergeable sur « any Linux, Windows or Mac web server » ; hébergement cloud par l'éditeur sur AWS [snipeit-features.png, snipeit-home.png]. Régions listées : Oregon, N. Virginia, São Paulo, Irlande, Londres, Francfort, Singapour, Séoul, Hyderabad, Le Cap, Sydney, Montréal [snipeit-home.png]. Pas de région à Dakar ni en Afrique de l'Ouest.
- **Tarifs** (USD) : auto-hébergé gratuit ; Basic Hosting 399,99 $/an (39,99 $/mois) ; Small Business 999,99 $/an ; Dedicated 2 499,99 $/an. Utilisateurs et actifs illimités sur tous les plans ; support e-mail à partir du plan hébergé [snipeit-pricing.png]. Le plan « Basic » ne mentionne ni sauvegardes automatiques ni mises à niveau automatiques au même niveau que les suivants (les cases sont partiellement illisibles sur le texte extrait) → **à relire sur la capture** avant décision.
- **Multi-site / faible bande passante** : multi-sociétés dans une installation [snipeit-features.png] ; faible bande passante : **non observé**.

### 2.3 Freshservice (Freshworks)

- **Promesse** : « Service, opérations et actifs unifiés » ; plateforme ITSM basée sur l'IA, alignée ITIL [freshservice-home.png].
- **Gestion d'actifs** : cycle de vie, découverte automatisée, CMDB, cartographie des dépendances, IPAM, bons de commande, contrats, parc matériel et logiciel, SaaS [freshservice-features.png, freshservice-itam.png].
- **Helpdesk** : incidents, problèmes, changements, catalogue de services, SLA, base de connaissances, portail libre-service, omnicanal (e-mail, portail, Slack, MS Teams) [freshservice-features.png].
- **QR / code-barres** : **non observé**.
- **Mobile** : application mobile pour utilisateurs et agents [freshservice-features.png].
- **Microsoft 365 / Entra / Intune** : Microsoft Teams cité comme canal [freshservice-features.png] ; marketplace d'applications [freshservice-home.png]. Intune, Entra, Microsoft 365 : **non observé**.
- **Français** : pages marketing en français ; langue de l'interface produit : **non observé**.
- **Hébergement** : SaaS ; datacenters « de premier plan » sans région précisée [freshservice-pricing.png]. Auto-hébergé ou open source : **non observé** (pas d'indication).
- **Tarifs** (par agent, facturation annuelle) : Starter 15 €, Growth 40 €, Pro 84 €, Enterprise sur devis ; essai gratuit 14 jours ; module Freddy AI Copilot 29 €/agent/mois en option. Les unités d'actifs (« Asset Units ») se vendent par lots de 500 ; **leur prix n'est pas affiché** [freshservice-pricing.png]. Il n'est pas précisé quel plan contient quel module d'actifs : **non observé**.
- **Multi-site / faible bande passante** : « prise en charge de plusieurs sites » citée dans la FAQ [freshservice-features.png] ; faible bande passante : **non observé**.

## 3. Tableau comparatif

| Critère | GLPI | Snipe-IT | Freshservice |
|---|---|---|---|
| Cœur de métier | ITSM + ITAM + CMDB | ITAM pur | ITSM + ITAM + ITOM + ESM |
| Gestion d'actifs | Oui, étendue (inventaire, CMDB, finance) | Oui, très orientée affectation/audit | Oui, orientée CMDB/découverte |
| Helpdesk / tickets | Oui | **Non observé** | Oui (ITIL complet) |
| Étiquettes QR / codes-barres | **Non observé** | **Oui** (QR, lecteurs) | **Non observé** |
| Accès mobile | Non observé (MDM listé) | Web adaptatif | Application mobile |
| Microsoft / Entra / Intune | OAuth2 Microsoft/Azure AD ; Intune non observé | Adaptateur **Intune** natif ; SAML/SCIM | Teams ; reste non observé |
| Français | Site et support FR | 55 langues, FR non nommé | Site FR ; produit non observé |
| Open source | Oui | Oui | Non observé |
| Auto-hébergé | Oui (détail non observé) | Oui, gratuit | Non observé |
| Cloud éditeur | Oui (OVHCloud, France) | Oui (AWS, 12 régions) | Oui |
| Tarif affiché | 19–21 €/utilisateur/mois HT | 0 $ auto-hébergé ; 399,99–2 499,99 $/an hébergé | 15–84 €/agent/mois ; devis Enterprise |
| Essai affiché | 45 jours | non observé | 14 jours |
| Multi-site | Architecture sur mesure | Multi-sociétés | « Plusieurs sites » (FAQ) |
| Faible bande passante | Non observé | Non observé | Non observé |

## 4. Forces, lacunes et constats communs

**Forces**
- GLPI : couverture la plus large (helpdesk + inventaire + finance), open source, support en français, hébergement en France.
- Snipe-IT : simplicité centrée sur l'actif, QR et lecteurs, acceptation avec signature, adaptateur Intune natif, tarif d'entrée très bas.
- Freshservice : ITSM mature, application mobile, IA, catalogue de services, canaux Teams/Slack.

**Lacunes (par rapport à notre contexte)**
- GLPI : le périmètre est vaste ; aucune mention de QR ou d'accès mobile sur les pages vues ; prix par utilisateur élevé pour 150+ comptes.
- Snipe-IT : pas de ticketing natif observé ; site non traduit en français.
- Freshservice : prix par agent peu coûteux mais fonctions d'actifs et unités d'actifs non chiffrées ; SaaS uniquement (rien d'observé sur l'auto-hébergement) ; complexité ITIL probablement supérieure à nos besoins.
- Aucun des trois ne parle de faible bande passante, de mode hors ligne ni d'imprimantes (HP, Bixolon) sur les pages vues : **non observé**.

**Constats communs**
- Tous proposent des SSO/annuaires, une API ou une marketplace, des notifications, de l'automatisation.
- Tous séparent offre hébergée payante et (sauf Freshservice, non observé) version gratuite auto-hébergée.
- Les prix croissent avec le nombre d'utilisateurs ou d'agents, sauf Snipe-IT (utilisateurs et actifs illimités).

## 5. Cinq recommandations pour IT Parc

1. **Copier** : le cycle affectation / check-in-out / historique, l'acceptation avec signature, les étiquettes QR et la compatibilité avec des lecteurs de codes-barres (Snipe-IT) [snipeit-features.png]. C'est le cœur utile pour des ordinateurs, imprimantes et téléphones répartis sur plusieurs bureaux.
2. **Copier** : un ticket lié à l'actif (le ticket affiche l'équipement concerné) et des collecteurs d'e-mails, comme GLPI [glpi-features.png] ; un SLA simple (délai de prise en charge) suffit. **Ne pas copier** ITIL complet (problèmes, changements, incidents majeurs, IA), qui alourdit Freshservice [freshservice-pricing.png].
3. **Simplifier / se différencier** : rester léger et en français d'office ; fiches pour imprimantes HP/Bixolon et réseau avec champs et consommables propres ; vue par bureau régional (Dakar + régions) et pages légères adaptées aux liaisons lentes. Aucun concurrent ne revendique cela (**non observé**), à valider par un test réel sur nos liaisons.
4. **Intégration Microsoft 365** : SSO Entra et import des appareils depuis Intune ; Snipe-IT a déjà un adaptateur Intune [snipeit-features.png] et GLPI gère le SSO Microsoft [glpi-pricing.png]. À vérifier dans leur documentation (Entra, Graph) avant de développer.
5. **Un outil existant peut être meilleur pour certains besoins** : si l'inventaire/étiquetage prime, **Snipe-IT auto-hébergé** (gratuit, QR, Intune) couvre déjà l'essentiel ; si l'on veut un helpdesk complet rapidement, **GLPI** (open source, support en français) est le choix le plus proche. IT Parc se justifie surtout s'il reste plus simple, adapté au contexte (réseau, langues, offices régionaux) et sans coût par utilisateur pour 150+ comptes. Décision à prendre après un essai pratique de Snipe-IT et GLPI sur nos données, et en comparant avec l'effort de maintenance d'IT Parc.

## 6. Points à vérifier (non observés)

- GLPI : offre auto-hébergée, QR, mobile, Intune, langues de l'interface, définition de l'« utilisateur » facturé.
- Snipe-IT : français, Entra, tickets, contenu exact du plan Basic Hosting.
- Freshservice : prix des Asset Units, modules d'actifs par plan, Intune/Entra, QR, langue du produit, auto-hébergement.
- Les trois : performance en faible bande passante, imprimantes, présence en Afrique de l'Ouest.
