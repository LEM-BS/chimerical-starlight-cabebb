import { LOGO_PNG_URL, SITE_URL } from './structuredData';

interface LocationSeoOptions {
  title: string;
  description: string;
  canonical: string;
  breadcrumbLabel: string;
  openGraphDescription?: string;
  image?: string;
  localBusiness: {
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    areaServed: string | string[];
    description: string;
  };
}

export const createLocationSeo = ({
  title,
  description,
  canonical,
  breadcrumbLabel,
  openGraphDescription,
  image = LOGO_PNG_URL,
  localBusiness,
}: LocationSeoOptions) => {
  const socialDescription = openGraphDescription ?? description;

  return {
    title,
    description,
    canonical,
    openGraph: {
      description: socialDescription,
      url: canonical,
      image,
    },
    twitter: {
      description: socialDescription,
      image,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'LEM Building Surveying Ltd',
        url: canonical,
        telephone: '+447378732037',
        address: {
          '@type': 'PostalAddress',
          addressLocality: localBusiness.addressLocality,
          addressRegion: localBusiness.addressRegion,
          ...(localBusiness.postalCode ? { postalCode: localBusiness.postalCode } : {}),
          addressCountry: 'GB',
        },
        areaServed: localBusiness.areaServed,
        description: localBusiness.description,
        image,
      },
    ],
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Areas We Cover', item: `${SITE_URL}/local-surveys` },
      { name: breadcrumbLabel, item: canonical },
    ],
    additionalMeta: [{ name: 'twitter:url', content: canonical }],
  };
};

