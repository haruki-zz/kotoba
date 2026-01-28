import { z } from 'zod';

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof difficultySchema>;

const isoDateTime = () => z.string().datetime({ offset: true });

export const wordRowSchema = z.object({
  id: z.number().int().nonnegative(),
  word: z.string().trim().min(1),
  reading: z.string().trim().min(1),
  contextExpl: z.string().trim().min(1),
  sceneDesc: z.string().trim().min(1),
  example: z.string().trim().min(1),
  difficulty: difficultySchema,
  ef: z.number().positive(),
  intervalDays: z.number().int().nonnegative(),
  repetition: z.number().int().nonnegative(),
  lastReviewAt: isoDateTime(),
  nextDueAt: isoDateTime(),
  createdAt: isoDateTime(),
  updatedAt: isoDateTime(),
});

export type WordRecord = z.infer<typeof wordRowSchema>;

export const newWordInputSchema = wordRowSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    ef: z.number().positive().default(2.5),
    intervalDays: z.number().int().nonnegative().default(0),
    repetition: z.number().int().nonnegative().default(0),
    lastReviewAt: isoDateTime().optional(),
    nextDueAt: isoDateTime().optional(),
  });

export type NewWordInput = z.infer<typeof newWordInputSchema>;

const updatableWordFields = wordRowSchema
  .omit({
    id: true,
    createdAt: true,
  })
  .partial();

export const wordUpdateSchema = z
  .object({
    id: z.number().int().nonnegative(),
    changes: updatableWordFields,
  })
  .refine(
    ({ changes }) => Object.keys(changes).length > 0,
    'At least one field must be provided for update.',
  );

export type WordUpdate = z.infer<typeof wordUpdateSchema>;
