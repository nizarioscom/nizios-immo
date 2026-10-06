import fs from 'fs';
import path from 'path';

/**
 * Charge la config des clients depuis le dossier `clients/` à la racine du repo.
 * `_template` et tout dossier préfixé par `_` sont ignorés.
 * Un dossier client ne peut contenir que de la config et des médias.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Locale = 'fr' | 'ar';

const ALLOWED_EXT = new Set([
  '.json',
  '.md',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.txt',
  '.gitkeep',
]);

export class ClientConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientConfigError';
  }
}

export type ClientConfig = {
  slug: string;
  name: string;
  status: string;
  domains: string[];
  defaultLocale: Locale;
  locales: Locale[];
  whatsappNumbers: string[];
  branding: {
    primaryColor: string;
    logoPath: string | null;
    tagline: { fr: string; ar: string };
  };
  contacts: {
    city: string;
    districts: string[];
    email: string;
    phone: string;
  };
  admin: { email: string; name: string } | null;
  config: Record<string, unknown>;
  content: { fr: Record<string, unknown>; ar: Record<string, unknown> };
};

export function findClientsDir(start = process.cwd()): string {
  if (process.env.CLIENTS_DIR) return path.resolve(process.env.CLIENTS_DIR);
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, 'clients');
    if (fs.existsSync(path.join(candidate, '_template', 'tenant.config.json'))) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new ClientConfigError(
    'Dossier clients/ introuvable. Définissez CLIENTS_DIR ou lancez la commande depuis le repo.',
  );
}

export function loadClientConfigs(clientsDir = findClientsDir()): ClientConfig[] {
  const entries = fs.readdirSync(clientsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort()
    .map((slug) => loadClientConfig(slug, clientsDir));
}

export function loadClientConfig(slug: string, clientsDir = findClientsDir()): ClientConfig {
  if (!SLUG.test(slug)) {
    throw new ClientConfigError(`Slug invalide : ${slug}`);
  }
  const clientDir = path.join(clientsDir, slug);
  if (!fs.existsSync(clientDir) || !fs.statSync(clientDir).isDirectory()) {
    throw new ClientConfigError(`Dossier client introuvable : clients/${slug}`);
  }
  assertNoCustomCode(clientDir);
  const raw = readJson(path.join(clientDir, 'tenant.config.json'));
  const content = {
    fr: readJson(path.join(clientDir, 'content', 'fr.json')),
    ar: readJson(path.join(clientDir, 'content', 'ar.json')),
  };
  return parseClient(slug, clientDir, raw, content);
}

function readJson(file: string): Record<string, unknown> {
  if (!fs.existsSync(file)) {
    throw new ClientConfigError(`Fichier manquant : ${file}`);
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('objet attendu');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON invalide';
    throw new ClientConfigError(`JSON illisible (${file}) : ${message}`);
  }
}

function assertNoCustomCode(dir: string): void {
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (entry.name === '.gitkeep') continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        throw new ClientConfigError(
          `Fichier interdit dans un dossier client (config et médias seulement) : ${full}`,
        );
      }
    }
  }
}

function parseClient(
  folderSlug: string,
  clientDir: string,
  raw: Record<string, unknown>,
  content: ClientConfig['content'],
): ClientConfig {
  const slug = requiredString(raw.slug, 'slug');
  if (slug !== folderSlug) {
    throw new ClientConfigError(
      `Le slug « ${slug} » ne correspond pas au dossier clients/${folderSlug}.`,
    );
  }
  const locales = requiredStringArray(raw.locales, 'locales').map((locale) => {
    if (locale !== 'fr' && locale !== 'ar') {
      throw new ClientConfigError(`Locale non supportée : ${locale}`);
    }
    return locale;
  });
  if (locales.length === 0) {
    throw new ClientConfigError('Au moins une locale (fr ou ar) est requise.');
  }
  const defaultLocale = requiredString(raw.defaultLocale, 'defaultLocale');
  if (defaultLocale !== 'fr' && defaultLocale !== 'ar') {
    throw new ClientConfigError('defaultLocale doit être fr ou ar.');
  }
  if (!locales.includes(defaultLocale)) {
    throw new ClientConfigError('defaultLocale doit faire partie de locales.');
  }
  const domains = requiredStringArray(raw.domains, 'domains');
  if (domains.length === 0) {
    throw new ClientConfigError('Au moins un domaine est requis.');
  }

  const brandingRaw = requiredObject(raw.branding, 'branding');
  const taglineRaw = requiredObject(brandingRaw.tagline, 'branding.tagline');
  const logoPath =
    brandingRaw.logoPath === null || brandingRaw.logoPath === undefined
      ? null
      : requiredString(brandingRaw.logoPath, 'branding.logoPath');
  if (logoPath) {
    const logoFile = path.join(clientDir, logoPath);
    if (!fs.existsSync(logoFile)) {
      throw new ClientConfigError(`Logo introuvable : ${logoFile}`);
    }
  }

  const contactsRaw = requiredObject(raw.contacts, 'contacts');
  const admin = parseAdmin(raw.admin);

  const extraConfig = raw.config === undefined ? {} : requiredObject(raw.config, 'config');

  return {
    slug,
    name: requiredString(raw.name, 'name'),
    status: requiredString(raw.status, 'status'),
    domains,
    defaultLocale,
    locales,
    whatsappNumbers: requiredStringArray(raw.whatsappNumbers, 'whatsappNumbers'),
    branding: {
      primaryColor: requiredString(brandingRaw.primaryColor, 'branding.primaryColor'),
      logoPath,
      tagline: {
        fr: requiredString(taglineRaw.fr, 'branding.tagline.fr'),
        ar: requiredString(taglineRaw.ar, 'branding.tagline.ar'),
      },
    },
    contacts: {
      city: requiredString(contactsRaw.city, 'contacts.city'),
      districts: requiredStringArray(contactsRaw.districts, 'contacts.districts'),
      email: optionalString(contactsRaw.email),
      phone: optionalString(contactsRaw.phone),
    },
    admin,
    config: {
      ...extraConfig,
      status: requiredString(raw.status, 'status'),
      contacts: {
        city: requiredString(contactsRaw.city, 'contacts.city'),
        districts: requiredStringArray(contactsRaw.districts, 'contacts.districts'),
        email: optionalString(contactsRaw.email),
        phone: optionalString(contactsRaw.phone),
      },
    },
    content,
  };
}

function parseAdmin(value: unknown): ClientConfig['admin'] {
  if (value === undefined || value === null) return null;
  const admin = requiredObject(value, 'admin');
  const email = optionalString(admin.email);
  const name = optionalString(admin.name);
  if (!email && !name) return null;
  if (!email || !email.includes('@')) {
    throw new ClientConfigError('admin.email est requis pour créer le compte agence.');
  }
  if (!name) throw new ClientConfigError('admin.name est requis.');
  return { email: email.toLowerCase(), name };
}

function requiredObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ClientConfigError(`${label} doit être un objet.`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ClientConfigError(`${label} est requis.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new ClientConfigError('Chaîne attendue.');
  return value.trim();
}

function requiredStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ClientConfigError(`${label} doit être une liste de chaînes.`);
  }
  return value.map((item) => item.trim()).filter((item) => item.length > 0);
}
