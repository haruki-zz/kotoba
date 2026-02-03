import { z } from 'zod';

const isoDateTime = z.string().datetime({ offset: true });

export const sourceRecordSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  url: z.string().url().optional().nullable(),
  note: z.string().default(''),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const sourceCreateSchema = sourceRecordSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    url: z.string().url().optional().nullable(),
    note: z.string().default(''),
  });

export const sourceUpdateSchema = sourceCreateSchema.partial().extend({
  name: z.string().min(1).optional(),
  updatedAt: isoDateTime.optional(),
});

export type SourceRecord = z.infer<typeof sourceRecordSchema>;
export type SourceCreateInput = z.infer<typeof sourceCreateSchema>;
export type SourceUpdateInput = z.infer<typeof sourceUpdateSchema>;
