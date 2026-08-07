const configuredContactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim();

export const SITE_CONTACT = {
  email: configuredContactEmail || 'alexandre.arribamar@gmail.com',
  githubUrl: 'https://github.com/AlexandreAT/OdisseiaWiki',
  githubLabel: 'github.com/AlexandreAT/OdisseiaWiki',
} as const;
