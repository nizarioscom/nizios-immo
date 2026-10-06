/**
 * Chaînes d'interface partagées (chrome), pas le contenu des agences.
 * Les textes FR/AR d'un client vivent dans clients/<slug>/content.
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
  preparing: string;
  notFoundTitle: string;
  notFoundBody: string;
  loginTitle: string;
  email: string;
  password: string;
  submit: string;
  logout: string;
};

const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    otherLanguage: 'العربية',
    otherLocale: 'ar',
    preparing: 'Site en préparation',
    notFoundTitle: 'Agence introuvable',
    notFoundBody: 'Aucun client ne correspond à cette adresse.',
    loginTitle: 'Espace agence',
    email: 'E-mail',
    password: 'Mot de passe',
    submit: 'Se connecter',
    logout: 'Se déconnecter',
  },
  ar: {
    otherLanguage: 'Français',
    otherLocale: 'fr',
    preparing: 'الموقع قيد الإعداد',
    notFoundTitle: 'الوكالة غير موجودة',
    notFoundBody: 'لا توجد وكالة مرتبطة بهذا العنوان.',
    loginTitle: 'فضاء الوكالة',
    email: 'البريد الإلكتروني',
    password: 'كلمة السر',
    submit: 'دخول',
    logout: 'خروج',
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
