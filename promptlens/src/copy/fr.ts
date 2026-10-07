import type { AssetErrorCode, AssetStatus } from '../domain/asset';
import type { AssetEquipmentType, EquipmentType } from '../domain/equipment';

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count > 1 ? many : one}`;

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  laptop: 'Ordinateur portable',
  desktop: 'Ordinateur de bureau',
  printer: 'Imprimante',
  'receipt-printer': 'Imprimante de tickets',
  smartphone: 'Smartphone',
  'network-device': 'Équipement réseau',
};

const ASSET_EQUIPMENT_TYPE_LABELS: Record<AssetEquipmentType, string> = {
  ...EQUIPMENT_TYPE_LABELS,
  other: 'Autre',
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  'in-service': 'En service',
  'in-stock': 'En stock',
  broken: 'En panne',
  'in-repair': 'En réparation',
  retired: 'Retiré',
};

const ERROR_LABELS: Record<AssetErrorCode, string> = {
  required: 'Ce champ est obligatoire.',
  'invalid-date': 'La date n’est pas valide.',
  'future-date': 'La date ne peut pas être dans le futur.',
};

/** "36 mois" becomes "3 ans" when the duration is a whole number of years. */
function formatWarranty(months: number): string {
  return months % 12 === 0 ? plural(months / 12, 'an', 'ans') : `${months} mois`;
}

/** `2026-03-09` becomes `09/03/2026`. */
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

export const FR = {
  appName: 'IT Parc',
  appTagline: 'Catalogue et inventaire du matériel informatique',
  /** "mercredi 7 octobre 2026" */
  formatLongDate: (date: Date) =>
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(date),
  equipmentTypes: EQUIPMENT_TYPE_LABELS,
  assetEquipmentTypes: ASSET_EQUIPMENT_TYPE_LABELS,
  statuses: STATUS_LABELS,
  errors: ERROR_LABELS,
  formatWarranty,
  formatDate,

  tabs: {
    ariaLabel: 'Sections',
    catalogue: 'Catalogue',
    inventory: 'Inventaire',
  },

  catalogue: {
    banner:
      'Ces modèles sont des exemples génériques, fournis à titre indicatif. Ils ne correspondent à aucun équipement réel.',
    searchLabel: 'Rechercher un modèle',
    searchPlaceholder: 'Marque, modèle, usage…',
    typeFilterLabel: 'Type d’équipement',
    allTypes: 'Tous',
    resultCount: (count: number) => plural(count, 'modèle', 'modèles'),
    empty: 'Aucun modèle ne correspond à votre recherche.',
    exampleBadge: 'Exemple',
    typicalUse: 'Usage typique',
    recommendedWarranty: 'Garantie recommandée',
    addToInventory: 'Ajouter à l’inventaire',
    addToInventoryFor: (model: string) => `Ajouter à l’inventaire : ${model}`,
  },

  inventory: {
    title: 'Inventaire',
    add: 'Ajouter un équipement',
    summaryTitle: 'Synthèse',
    total: 'Total',
    bySite: 'Par site',
    byStatus: 'Par statut',
    searchLabel: 'Rechercher dans l’inventaire',
    searchPlaceholder: 'N° d’inventaire, n° de série, affectation…',
    resetFilters: 'Réinitialiser les filtres',
    resultCount: (count: number) => plural(count, 'équipement', 'équipements'),
    emptyTitle: 'Aucun équipement pour le moment',
    emptyAll:
      'Ajoutez votre premier équipement : décrivez-le, photographiez son étiquette, ou partez d’un modèle du catalogue.',
    browseCatalogue: 'Parcourir le catalogue',
    emptyFiltered: 'Aucun équipement ne correspond aux filtres.',
    unknownModel: 'Modèle inconnu',
    toComplete: 'À compléter',
    missing: {
      serialNumber: 'n° de série',
      model: 'marque ou modèle',
    },
    missingTitle: (fields: string) => `Informations manquantes : ${fields}`,
    statusColumn: 'Statut',
    filtersLabel: 'Filtres',
    siteFilter: 'Site',
    allSites: 'Tous les sites',
    statusFilter: 'Statut',
    allStatuses: 'Tous les statuts',
    typeFilter: 'Type',
    allTypes: 'Tous les types',
    tableCaption: 'Liste des équipements',
    equipment: 'Équipement',
    actions: 'Actions',
    loading: 'Chargement de l’inventaire…',
    assetTag: 'N° d’inventaire',
    serialNumber: 'N° de série',
    site: 'Site',
    assignedTo: 'Affecté à',
    unassigned: 'Non affecté',
    purchaseDate: 'Date d’achat',
    warrantyEnd: 'Fin de garantie',
    warrantyExpired: 'Garantie expirée',
    notes: 'Notes',
    notProvided: '—',
    edit: 'Modifier',
    duplicate: 'Dupliquer',
    remove: 'Supprimer',
    editFor: (tag: string) => `Modifier ${tag}`,
    duplicateFor: (tag: string) => `Dupliquer ${tag}`,
    removeFor: (tag: string) => `Supprimer ${tag}`,
  },

  add: {
    title: 'Ajouter un équipement',
    methodLabel: 'Méthode de saisie',
    catalogue: 'Catalogue',
    text: 'Décrire',
    image: 'Photo d’étiquette',
    cancel: 'Annuler',
  },

  describe: {
    label: 'Décrivez l’équipement',
    placeholder: 'ex. Portable Exemple Tech DEMO-14, étiquette TEST-0001, l’écran reste noir au démarrage',
    privacyHint:
      'Ne saisissez pas de données personnelles (noms, e-mails, téléphones). Le texte est analysé par un service d’IA.',
    counter: (count: number, max: number) => `${count} / ${max} caractères`,
    analyse: 'Analyser',
    analysing: 'Analyse en cours…',
  },

  photo: {
    intro: 'Photographiez l’étiquette ou la plaque signalétique de l’équipement.',
    hint: 'JPEG ou PNG. La photo est réduite à 1 600 px et ses métadonnées (dont la position GPS) sont supprimées avant l’envoi.',
    choose: 'Choisir une photo',
    take: 'Prendre une photo',
    previewAlt: 'Aperçu de la photo de l’étiquette',
    analyse: 'Analyser l’étiquette',
    analysing: 'Analyse en cours… cela peut prendre jusqu’à une minute.',
    unreadableTitle: 'Étiquette illisible',
    unreadableMessage:
      'Aucune information n’a pu être lue sur cette photo. Reprenez-la plus près, bien éclairée et nette, ou saisissez l’équipement à la main.',
    enterManually: 'Saisir à la main',
  },

  ai: {
    confidence: (percent: number) => `Confiance de l’IA : ${percent} %`,
    reminder:
      'Les suggestions de l’intelligence artificielle (IA) doivent être vérifiées avant l’enregistrement.',
    toCompleteNote: 'Les champs marqués « À compléter » n’ont pas pu être lus : renseignez-les vous-même.',
    errors: {
      networkDev:
        'Le serveur local ne répond pas. Lancez-le avec « npm --prefix functions run serve », puis réessayez.',
      network: 'Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.',
      invalidInput: 'La demande a été refusée.',
      unavailable: 'Le service d’IA est momentanément indisponible ou trop lent. Réessayez dans un instant.',
      quota: 'Le quota du service d’IA est atteint. Réessayez dans quelques minutes.',
      access: 'Accès au service d’IA refusé. Connectez-vous ou vérifiez vos droits.',
      notConfigured: 'Le service d’IA n’est pas configuré sur ce serveur.',
      badResponse: 'La réponse de l’IA n’a pas pu être exploitée. Réessayez.',
      unknown: 'Une erreur inattendue est survenue. Réessayez.',
      imageType: 'Format non pris en charge : choisissez une photo JPEG ou PNG.',
      imageTooLarge: 'Cette photo est trop volumineuse (15 Mo maximum). Choisissez-en une plus légère.',
      imageUnreadable: 'Cette image n’a pas pu être lue. Essayez une autre photo.',
    },
  },

  form: {
    titleCreate: 'Détails de l’équipement',
    titleReview: 'Vérifier et compléter',
    titleEdit: 'Modifier l’équipement',
    titleDuplicate: 'Dupliquer l’équipement',
    duplicateHint: 'N° d’inventaire, n° de série et affectation ont été vidés : ils identifient un seul appareil.',
    catalogueModel: 'Modèle du catalogue',
    catalogueModelNone: 'Aucun (saisie libre)',
    equipmentType: 'Type d’équipement',
    equipmentTypePlaceholder: 'Choisir un type',
    brand: 'Marque',
    modelLabel: 'Modèle',
    statusPlaceholder: 'Choisir un statut',
    toComplete: 'À compléter',
    duplicateTitle: 'Possible doublon',
    duplicateTag: (tag: string, site: string) =>
      `Le n° d’inventaire ${tag} existe déjà dans l’inventaire (site : ${site}).`,
    duplicateSerial: (serial: string, tag: string, site: string) =>
      `Le n° de série ${serial} existe déjà (équipement ${tag}, site : ${site}).`,
    saveAnyway: 'Enregistrer quand même',
    site: 'Site',
    sitePlaceholder: 'ex. Site principal',
    assetTag: 'N° d’inventaire',
    assetTagPlaceholder: 'ex. EXEMPLE-0001',
    serialNumber: 'N° de série',
    status: 'Statut',
    assignedTo: 'Affecté à',
    assignedToPlaceholder: 'Personne ou local (texte libre)',
    purchaseDate: 'Date d’achat',
    notes: 'Notes',
    optional: '(facultatif)',
    save: 'Enregistrer',
    cancel: 'Annuler',
    errorSummary: 'Corrigez les champs signalés avant d’enregistrer.',
  },

  confirmDelete: {
    title: 'Supprimer cet équipement ?',
    message: (tag: string) => `L’équipement ${tag} sera définitivement supprimé de l’inventaire.`,
    confirm: 'Supprimer',
    cancel: 'Annuler',
  },

  storageErrors: {
    load: 'Impossible de lire l’inventaire enregistré dans ce navigateur.',
    save: 'L’enregistrement a échoué. Vos modifications n’ont pas été conservées.',
  },

  footer:
    'Données enregistrées uniquement dans ce navigateur. Les modèles du catalogue sont des exemples génériques.',
} as const;
