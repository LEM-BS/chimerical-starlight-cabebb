export const GOOGLE_REVIEWS = [
  {
    '@type': 'Review',
    name: 'Google review by Lindsey M.',
    url: 'https://share.google/Ab6iUZ0rNTNvHr2xa',
    datePublished: '2024-02-10',
    reviewBody:
      'We used Liam to carry out a Level 2 Survey on a property we are purchasing. We found him very responsive, professional and knowledgeable. Liam highlighted issues without frightening us, offering advice on how to move forward. Would highly recommend him.',
    author: {
      '@type': 'Person',
      name: 'Lindsey M.',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Google',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
    },
  },
  {
    '@type': 'Review',
    name: 'Google review by Chris S.',
    url: 'https://share.google/Ab6iUZ0rNTNvHr2xa',
    datePublished: '2024-03-18',
    reviewBody:
      'LEM provided an excellent service from start to finish. His report was clear and explained everything simply and with enough detail for me to make informed choices. I would recommend LEM to anyone needing Building Surveying services.',
    author: {
      '@type': 'Person',
      name: 'Chris S.',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Google',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
    },
  },
  {
    '@type': 'Review',
    name: 'Google review by Helen H.',
    url: 'https://share.google/Ab6iUZ0rNTNvHr2xa',
    datePublished: '2024-04-22',
    reviewBody:
      'Liam was fantastic—professional, efficient, and really knowledgeable. He explained everything clearly, which made the whole process much easier. I’d definitely recommend LEM Building Surveying to anyone needing EPCs, floorplans, or a property survey. A smooth and stress-free experience from start to finish!',
    author: {
      '@type': 'Person',
      name: 'Helen H.',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Google',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
    },
  },
] as const;

export type GoogleReview = (typeof GOOGLE_REVIEWS)[number];
