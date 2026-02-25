import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const textos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/textos' }),
  schema: z.object({
    titulo: z.string(),
    descricao: z.string(),
    data: z.string(),
    tags: z.array(z.string()),
    publicadoEm: z.string().optional(),
    linkOriginal: z.string().url().optional(),
    lang: z.enum(['pt', 'en']).default('pt'),
    translationOf: z.string().optional(),
  }),
});

export const collections = { textos };
