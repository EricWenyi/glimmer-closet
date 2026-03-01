import { z } from 'zod';

export const categorySchema = z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag']);
export const colorSchema = z.enum(['black', 'white', 'gray', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'beige', 'multicolor']);
export const seasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter', 'all-season']);
export const occasionSchema = z.enum(['daily', 'work', 'sport', 'formal', 'casual']);
export const statusSchema = z.enum(['draft', 'published', 'archived']);

const csvSchema = z
  .string()
  .trim()
  .transform((value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []));

const stringOrArraySchema = z.union([csvSchema, z.array(z.string().trim()).default([])]).optional();

export const uploadClothSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: categorySchema,
  colors: stringOrArraySchema,
  seasons: stringOrArraySchema,
  occasions: stringOrArraySchema,
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['draft', 'published']).default('published'),
});

export const patchClothSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  category: categorySchema.optional(),
  colors: z.array(colorSchema).optional(),
  seasons: z.array(seasonSchema).optional(),
  occasions: z.array(occasionSchema).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: statusSchema.optional(),
});

export const listClothesQuerySchema = z.object({
  category: categorySchema.optional(),
  colors: z.array(colorSchema).optional(),
  seasons: z.array(seasonSchema).optional(),
  occasions: z.array(occasionSchema).optional(),
  status: z.union([statusSchema, z.literal('all')]).optional(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

function normalizeArray(input?: string[] | string): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => item.trim()).filter(Boolean);
  }

  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseColors(input?: string[] | string): z.infer<typeof colorSchema>[] {
  const values = normalizeArray(input);
  return z.array(colorSchema).parse(values);
}

export function parseSeasons(input?: string[] | string): z.infer<typeof seasonSchema>[] {
  const values = normalizeArray(input);
  return z.array(seasonSchema).parse(values);
}

export function parseOccasions(input?: string[] | string): z.infer<typeof occasionSchema>[] {
  const values = normalizeArray(input);
  return z.array(occasionSchema).parse(values);
}
