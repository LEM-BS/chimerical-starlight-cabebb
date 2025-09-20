export const SITE_URL = 'https://www.lembuildingsurveying.co.uk';
export const LOGO_WEBP_URL = `${SITE_URL}/logo-sticker.webp`;
export const LOGO_PNG_URL = `${SITE_URL}/logo-sticker.png`;
export const BUSINESS_ID = `${SITE_URL}#localBusiness`;

export const SOCIAL_PROFILES = [
  'https://www.facebook.com/LEMBuildingSurveying',
  'https://twitter.com/LEMSurveying',
  'https://www.linkedin.com/company/lem-building-surveying',
  'https://www.instagram.com/lem_buildingsurveying',
  'https://www.youtube.com/@LEMBuildingSurveying',
];

export const buildLocalBusinessSchema = (overrides: Record<string, unknown> = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': BUSINESS_ID,
  name: 'LEM Building Surveying Ltd',
  url: SITE_URL,
  image: LOGO_WEBP_URL,
  logo: LOGO_PNG_URL,
  telephone: '+44 7378 732 037',
  address: {
    '@type': 'PostalAddress',
    streetAddress: "Connah's Quay",
    addressLocality: 'Deeside',
    addressRegion: 'Flintshire',
    postalCode: 'CH5',
    addressCountry: 'GB',
  },
  sameAs: SOCIAL_PROFILES,
  ...overrides,
});

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ReviewDetails {
  author: string;
  body: string;
  ratingValue: number;
  datePublished: string;
  publisher?: string;
}

export interface ServiceSchemaOptions {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
  areaServed?: string[];
  faqs?: FaqItem[];
  review?: ReviewDetails;
}

export const buildServiceStructuredData = ({
  name,
  description,
  url,
  serviceType,
  areaServed = [
    'Chester, Cheshire',
    'Deeside, Flintshire',
    'North Wales',
  ],
  faqs = [],
  review,
}: ServiceSchemaOptions) => {
  const serviceId = `${url}#service`;
  const faqId = `${url}#faq`;
  const reviewId = `${url}#review`;

  const schemas: Record<string, unknown>[] = [
    buildLocalBusinessSchema({
      description,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${name} packages`,
        itemListElement: [
          {
            '@type': 'Offer',
            name,
            itemOffered: {
              '@type': 'Service',
              name,
              serviceType: serviceType ?? name,
            },
          },
        ],
      },
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': serviceId,
      name,
      description,
      serviceType: serviceType ?? name,
      provider: {
        '@id': BUSINESS_ID,
      },
      areaServed,
      url,
      image: LOGO_WEBP_URL,
    },
  ];

  if (review) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Review',
      '@id': reviewId,
      itemReviewed: {
        '@id': serviceId,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.ratingValue,
        bestRating: '5',
        worstRating: '1',
      },
      author: {
        '@type': 'Person',
        name: review.author,
      },
      publisher: {
        '@type': 'Organization',
        name: review.publisher ?? 'Google Reviews',
      },
      datePublished: review.datePublished,
      reviewBody: review.body,
    });
  }

  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': faqId,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return schemas;
};

export interface ServiceSeoOptions {
  title: string;
  description: string;
  canonicalPath: string;
  serviceName: string;
  serviceType?: string;
  areaServed?: string[];
  faqs?: FaqItem[];
  review?: ReviewDetails;
  openGraphImage?: string;
}

export const createServiceSeo = ({
  title,
  description,
  canonicalPath,
  serviceName,
  serviceType,
  areaServed,
  faqs,
  review,
  openGraphImage,
}: ServiceSeoOptions) => {
  const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const url = `${SITE_URL}${normalizedPath}`;
  const structuredData = buildServiceStructuredData({
    name: serviceName,
    description,
    url,
    serviceType,
    areaServed,
    faqs,
    review,
  });

  const image = openGraphImage ?? LOGO_WEBP_URL;

  return {
    seo: {
      title,
      description,
      canonicalPath: normalizedPath,
      fullTitle: true,
      image,
      openGraph: {
        title,
        description,
        url,
        type: 'article',
        image,
      },
      twitter: {
        title,
        description,
        image,
      },
      structuredData,
    },
    pageUrl: url,
  };
};
