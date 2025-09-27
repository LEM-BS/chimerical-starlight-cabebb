import { SCHEMA_LOGO_URL, SITE_URL } from './structuredData';

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
  image = SCHEMA_LOGO_URL,
  localBusiness,
}: LocationSeoOptions) => {
  const socialDescription = openGraphDescription ?? description;

  const openingHoursSpecification = [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  ];

  const areaServedArray = Array.isArray(localBusiness.areaServed)
    ? localBusiness.areaServed
    : [localBusiness.areaServed];

  const locationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'LEM Building Surveying Ltd',
    image: SCHEMA_LOGO_URL,
    logo: SCHEMA_LOGO_URL,
    url: canonical,
    telephone: '+44-7378-732037',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Marlowe Avenue',
      addressLocality: 'Deeside',
      addressRegion: 'Flintshire',
      postalCode: 'CH5 4HS',
      addressCountry: 'UK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '53.1913',
      longitude: '-2.8919',
    },
    openingHoursSpecification,
    sameAs: [
      'https://www.facebook.com/share/1DZpcsZUUB/',
      'https://www.linkedin.com/company/lem-building-surveying-ltd/',
    ],
    areaServed: areaServedArray.map((area) => ({
      '@type': 'Place',
      name: area,
    })),
    description: localBusiness.description,
  };

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
    structuredData: [locationSchema],
    breadcrumbs: [
      { name: 'Home', item: `${SITE_URL}/` },
      { name: 'Areas We Cover', item: `${SITE_URL}/local-surveys` },
      { name: breadcrumbLabel, item: canonical },
    ],
    additionalMeta: [{ name: 'twitter:url', content: canonical }],
  };
};

