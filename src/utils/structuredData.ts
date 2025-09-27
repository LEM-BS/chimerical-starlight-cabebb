export const SITE_URL = 'https://lembuildingsurveying.co.uk';
export const LOGO_WEBP_URL = `${SITE_URL}/logo-sticker.webp`;
export const LOGO_PNG_URL = `${SITE_URL}/logo-sticker.png`;
export const SCHEMA_LOGO_URL = 'https://lembuildingsurveying.co.uk/logo.png';
export const BUSINESS_ID = `${SITE_URL}#localBusiness`;

export const CONTACT_EMAIL = 'enquiries@lembuildingsurveying.co.uk';

export const GOOGLE_BUSINESS_PROFILE_URL = 'https://share.google/Ab6iUZ0rNTNvHr2xa';
export const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/BAQ5QRVn7q3Bimdi9';

export const SOCIAL_PROFILES = [
  'https://www.facebook.com/share/1DZpcsZUUB/',
  'https://www.linkedin.com/company/lem-building-surveying-ltd/',
];

export const BUSINESS_RATING_VALUE = '5';
export const BUSINESS_REVIEW_COUNT = 5;

export const BUSINESS_AGGREGATE_RATING = {
  '@type': 'AggregateRating',
  ratingValue: BUSINESS_RATING_VALUE,
  reviewCount: BUSINESS_REVIEW_COUNT,
  bestRating: '5',
  worstRating: '1',
} as const;

const REVIEWS = [
  {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    author: {
      '@type': 'Person',
      name: 'Lindsey M.',
    },
    reviewBody:
      'We used Liam to carry out a Level 2 Survey on a property we are purchasing. We found him very responsive, professional and knowledgeable. Liam highlighted issues without frightening us, offering advice on how to move forward. Would highly recommend him.',
  },
  {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    author: {
      '@type': 'Person',
      name: 'Chris S.',
    },
    reviewBody:
      'LEM provided an excellent service from start to finish. His report was clear and explained everything simply and with enough detail for me to make informed choices. I would recommend LEM to anyone needing Building Surveying services.',
  },
  {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    author: {
      '@type': 'Person',
      name: 'Helen H.',
    },
    reviewBody:
      'Liam was fantastic—professional, efficient, and really knowledgeable. He explained everything clearly, which made the whole process much easier. I’d definitely recommend LEM Building Surveying to anyone needing EPCs, floorplans, or a property survey. A smooth and stress-free experience from start to finish!',
  },
];

export const buildLocalBusinessSchema = (overrides: Record<string, unknown> = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': BUSINESS_ID,
  name: 'LEM Building Surveying Ltd',
  url: SITE_URL,
  image: SCHEMA_LOGO_URL,
  logo: SCHEMA_LOGO_URL,
  telephone: '+44-7378-732037',
  email: CONTACT_EMAIL,
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
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  ],
  founder: {
    '@type': 'Person',
    name: 'Liam Butler',
    alumniOf: 'John Moores University',
    hasCredential: [
      'BSc (Building Surveying)',
      'AssocRICS (Building Surveying)',
      'MRPSA',
      'RICS',
      'RPSA',
    ],
  },
  memberOf: [
    {
      '@type': 'Organization',
      name: 'Royal Institution of Chartered Surveyors (RICS)',
      url: 'https://www.rics.org/',
    },
    {
      '@type': 'Organization',
      name: 'Residential Property Surveyors Association (RPSA)',
      url: 'https://www.rpsa.org.uk/',
    },
  ],
  sameAs: SOCIAL_PROFILES,
  review: REVIEWS,
  aggregateRating: { ...BUSINESS_AGGREGATE_RATING },
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
  sku?: string;
  price?: number | string;
  priceCurrency?: string;
  priceValidUntil?: string;
  availability?: string;
  brandName?: string;
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
  sku,
  price,
  priceCurrency,
  priceValidUntil,
  availability,
  brandName,
}: ServiceSchemaOptions) => {
  const productId = `${url}#product`;
  const faqId = `${url}#faq`;
  const normalizedSku = sku ?? name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  const rawPrice = price ?? '0';
  const normalizedPrice =
    typeof rawPrice === 'number' ? rawPrice.toFixed(2) : rawPrice;
  const normalizedCurrency = priceCurrency ?? 'GBP';
  const normalizedAvailability = availability ?? 'https://schema.org/InStock';
  const productBrand = brandName ?? 'LEM Building Surveying Ltd';

  const productReviews = [
    ...(review
      ? [
          {
            '@type': 'Review',
            datePublished: review.datePublished,
            reviewBody: review.body,
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
          },
        ]
      : []),
    ...REVIEWS,
  ].slice(0, 5);

  const schemas: Record<string, unknown>[] = [
    buildLocalBusinessSchema({
      description,
      areaServed: areaServed.map((area) => ({
        '@type': 'AdministrativeArea',
        name: area,
      })),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${name} packages`,
        itemListElement: [
          {
            '@type': 'Offer',
            name,
            price: normalizedPrice,
            priceCurrency: normalizedCurrency,
            availability: normalizedAvailability,
            areaServed: areaServed.map((area) => ({
              '@type': 'AdministrativeArea',
              name: area,
            })),
            itemOffered: {
              '@type': 'Product',
              name,
              sku: normalizedSku,
              category: serviceType ?? name,
            },
          },
        ],
      },
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': productId,
      name,
      description,
      sku: normalizedSku,
      brand: {
        '@type': 'Brand',
        name: productBrand,
      },
      image: LOGO_WEBP_URL,
      url,
      category: serviceType ?? name,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: normalizedCurrency,
        price: normalizedPrice,
        availability: normalizedAvailability,
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          '@id': BUSINESS_ID,
        },
        areaServed: areaServed.map((area) => ({
          '@type': 'AdministrativeArea',
          name: area,
        })),
        ...(priceValidUntil ? { priceValidUntil } : {}),
      },
      aggregateRating: { ...BUSINESS_AGGREGATE_RATING },
      ...(productReviews.length > 0 ? { review: productReviews } : {}),
    },
  ];

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
  sku?: string;
  price?: number | string;
  priceCurrency?: string;
  priceValidUntil?: string;
  availability?: string;
  brandName?: string;
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
  sku,
  price,
  priceCurrency,
  priceValidUntil,
  availability,
  brandName,
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
    sku,
    price,
    priceCurrency,
    priceValidUntil,
    availability,
    brandName,
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
