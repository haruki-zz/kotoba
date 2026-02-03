import { z } from 'zod';

const isoDateTime = z.string().datetime({ offset: true });

export const tagRecordSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().default(''),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const tagCreateSchema = tagRecordSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    description: z.string().default(''),
  });

export const tagUpdateSchema = tagCreateSchema.partial().extend({
  name: z.string().min(1).optional(),
  updatedAt: isoDateTime.optional(),
});

export type TagRecord = z.infer<typeof tagRecordSchema>;
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
