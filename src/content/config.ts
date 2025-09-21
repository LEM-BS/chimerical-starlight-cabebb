import { defineCollection, z } from 'astro:content';

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const services = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      canonicalPath: z.string().optional(),
      hero: z
        .object({
          eyebrow: z.string().optional(),
          heading: z.string().optional(),
          subheading: z.string().optional(),
          description: z.string().optional(),
          primaryCta: linkSchema.optional(),
          secondaryCta: linkSchema.optional(),
          highlights: z
            .array(
              z.object({
                title: z.string(),
                description: z.string().optional(),
              }),
            )
            .optional(),
          stats: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
                description: z.string().optional(),
              }),
            )
            .optional(),
          image: z
            .object({
              src: image(),
              alt: z.string(),
            })
            .optional(),
        })
        .optional(),
      sections: z
        .array(
          z.object({
            id: z.string().optional(),
            heading: z.string(),
            kicker: z.string().optional(),
            intro: z.string().optional(),
            body: z.string().optional(),
            aside: z
              .object({
                heading: z.string(),
                body: z.string().optional(),
              })
              .optional(),
          }),
        )
        .optional(),
      faqs: z
        .object({
          heading: z.string().optional(),
          intro: z.string().optional(),
          items: z.array(
            z.object({
              q: z.string(),
              a: z.string(),
            }),
          ),
        })
        .optional(),
      sidebar: z
        .object({
          kicker: z.string().optional(),
          heading: z.string(),
          items: z.array(
            z.object({
              label: z.string(),
              description: z.string().optional(),
            }),
          ),
        })
        .optional(),
      testimonials: z
        .array(
          z.object({
            quote: z.string(),
            author: z.string(),
            role: z.string().optional(),
          }),
        )
        .optional(),
      seo: z
        .object({
          openGraphImage: image().optional(),
          noIndex: z.boolean().optional(),
        })
        .optional(),
    }),
});

const locations = defineCollection({
  type: 'data',
  schema: z.object({
    townName: z.string(),
    county: z.string(),
    postalCode: z.string().optional(),
    pageTitle: z.string(),
    metaDescription: z.string(),
    canonicalPath: z.string(),
    hero: z.object({
      eyebrow: z.string().optional(),
      heading: z.string().optional(),
      description: z.string(),
      cta: linkSchema.optional(),
      secondaryCta: linkSchema.optional(),
    }),
    intro: z.array(z.string()),
    sellingPoints: z
      .object({
        heading: z.string(),
        points: z.array(z.string()),
      })
      .optional(),
    services: z.object({
      heading: z.string(),
      intro: z.string().optional(),
      items: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
        }),
      ),
    }),
    internalLinks: z.object({
      heading: z.string(),
      description: z.string().optional(),
      links: z.array(
        z.object({
          label: z.string(),
          href: z.string(),
          description: z.string(),
        }),
      ),
    }),
    localInsights: z.object({
      heading: z.string(),
      paragraphs: z.array(z.string()),
    }),
    additionalInsights: z
      .array(
        z.object({
          heading: z.string(),
          paragraphs: z.array(z.string()),
        }),
      )
      .optional(),
    faqs: z.object({
      heading: z.string().optional(),
      items: z.array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      ),
    }),
    neighbourhoods: z
      .object({
        heading: z.string(),
        description: z.string().optional(),
        areas: z.array(z.string()),
      })
      .optional(),
    closing: z.object({
      heading: z.string(),
      paragraphs: z.array(z.string()),
      primaryCta: linkSchema,
      secondaryCta: linkSchema.optional(),
    }),
    mapEmbedUrl: z.string().optional(),
    mapEmbedTitle: z.string().optional(),
  }),
});

export const collections = {
  services,
  locations,
};
