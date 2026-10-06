/**
 * Chaînes d'interface partagées (chrome), pas le contenu des agences.
 * Les textes FR/AR d'un client vivent dans clients/<slug>/content.
 * Les titres des biens viennent de la base.
 */

export const locales = ['fr', 'ar'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return value === 'fr' || value === 'ar';
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export type Dictionary = {
  otherLanguage: string;
  otherLocale: Locale;
  notFoundTitle: string;
  notFoundBody: string;
  loginTitle: string;
  email: string;
  password: string;
  submit: string;
  logout: string;
  searchTitle: string;
  neighborhood: string;
  anyNeighborhood: string;
  type: string;
  anyType: string;
  buy: string;
  rent: string;
  budget: string;
  budgetHint: string;
  search: string;
  featured: string;
  allListings: string;
  noListings: string;
  see: string;
  priceOnRequest: string;
  perMonth: string;
  bedrooms: string;
  bathrooms: string;
  surface: string;
  whatsapp: string;
  map: string;
  leadTitle: string;
  name: string;
  phone: string;
  timeline: string;
  timelineUrgent: string;
  timelineMonth: string;
  timelineInfo: string;
  send: string;
  sent: string;
  sendError: string;
  chatOpen: string;
  chatClose: string;
  chatSend: string;
  chatPlaceholder: string;
  reference: string;
};

const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    otherLanguage: 'العربية',
    otherLocale: 'ar',
    notFoundTitle: 'Agence introuvable',
    notFoundBody: 'Aucun client ne correspond à cette adresse.',
    loginTitle: 'Espace agence',
    email: 'E-mail',
    password: 'Mot de passe',
    submit: 'Se connecter',
    logout: 'Se déconnecter',
    searchTitle: 'Trouver un bien à Rabat',
    neighborhood: 'Quartier',
    anyNeighborhood: 'Tous les quartiers',
    type: 'Projet',
    anyType: 'Achat ou location',
    buy: 'Achat',
    rent: 'Location',
    budget: 'Budget max. (MAD)',
    budgetHint: 'Optionnel',
    search: 'Rechercher',
    featured: 'Biens vedettes',
    allListings: 'Tous les biens',
    noListings: 'Aucun bien ne correspond.',
    see: 'Voir',
    priceOnRequest: 'Prix sur demande',
    perMonth: 'MAD / mois',
    bedrooms: 'chambres',
    bathrooms: 'salles d\'eau',
    surface: 'm²',
    whatsapp: 'WhatsApp',
    map: 'Voir le quartier sur la carte',
    leadTitle: 'Être rappelé',
    name: 'Nom',
    phone: 'Téléphone (06 ou 07)',
    timeline: 'Délai',
    timelineUrgent: 'Urgent',
    timelineMonth: 'Ce mois-ci',
    timelineInfo: 'Simple info',
    send: 'Envoyer',
    sent: 'Demande envoyée. L\'agence vous rappelle.',
    sendError: 'Vérifiez le téléphone (06 ou 07) et réessayez.',
    chatOpen: 'Une question ?',
    chatClose: 'Fermer',
    chatSend: 'Envoyer',
    chatPlaceholder: 'Votre message',
    reference: 'Réf.',
  },
  ar: {
    otherLanguage: 'Français',
    otherLocale: 'fr',
    notFoundTitle: 'الوكالة غير موجودة',
    notFoundBody: 'لا توجد وكالة مرتبطة بهذا العنوان.',
    loginTitle: 'فضاء الوكالة',
    email: 'البريد الإلكتروني',
    password: 'كلمة السر',
    submit: 'دخول',
    logout: 'خروج',
    searchTitle: 'لقا دار فالرباط',
    neighborhood: 'الحي',
    anyNeighborhood: 'كل الأحياء',
    type: 'المشروع',
    anyType: 'شرا ولا كرا',
    buy: 'الشرا',
    rent: 'الكراء',
    budget: 'الميزانية القصوى (درهم)',
    budgetHint: 'اختياري',
    search: 'قلب',
    featured: 'عقارات مختارة',
    allListings: 'كل العقارات',
    noListings: 'ما كاين حتى عقار بهاد المعايير.',
    see: 'شوف',
    priceOnRequest: 'الثمن عند الطلب',
    perMonth: 'درهم / شهر',
    bedrooms: 'غرف',
    bathrooms: 'حمامات',
    surface: 'م²',
    whatsapp: 'واتساب',
    map: 'شوف الحي فالخريطة',
    leadTitle: 'عيطولي',
    name: 'السمية',
    phone: 'التيليفون (06 ولا 07)',
    timeline: 'الوقت',
    timelineUrgent: 'مستعجل',
    timelineMonth: 'هاد الشهر',
    timelineInfo: 'غير معلومات',
    send: 'صيفط',
    sent: 'تسجلات الطلبية. الوكالة غادي تتاصل بيك.',
    sendError: 'راجع الرقم (06 ولا 07) وعاود.',
    chatOpen: 'عندك سؤال؟',
    chatClose: 'سد',
    chatSend: 'صيفط',
    chatPlaceholder: 'كتب هنا',
    reference: 'المرجع',
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
