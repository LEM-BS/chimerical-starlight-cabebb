import { defineCollection } from 'astro:content';

const services = defineCollection({
  type: 'content',
});

export const collections = {
  services,
};
