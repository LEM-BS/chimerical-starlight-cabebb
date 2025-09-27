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

  const areaServedRaw = localBusiness.areaServed;
  const areaServedArray = Array.isArray(areaServedRaw)
    ? areaServedRaw
    : areaServedRaw
    ? [areaServedRaw]
    : [];
  const primaryAreaRaw = areaServedArray[0] ?? localBusiness.addressLocality;
  const primaryAreaName = (primaryAreaRaw ?? '').split(',')[0]?.trim() || localBusiness.addressLocality;
  const schemaUrl = canonical.replace('https://www.', 'https://');

  const locationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'LEM Building Surveying Ltd',
    image: SCHEMA_LOGO_URL,
    logo: SCHEMA_LOGO_URL,
    url: schemaUrl,
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
    areaServed: {
      '@type': 'Place',
      name: primaryAreaName,
    },
    description: localBusiness.description,
    faq: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Do you cover ${primaryAreaName} properties?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Yes, we provide RICS Home Surveys (Levels 1, 2, 3) and Damp Reports for properties in ${primaryAreaName}.`,
          },
        },
        {
          '@type': 'Question',
          name: `Can I get an instant quote for a survey in ${primaryAreaName}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Yes, our online calculator provides instant, fixed-fee quotes for surveys in ${primaryAreaName}.`,
          },
        },
      ],
    },
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

