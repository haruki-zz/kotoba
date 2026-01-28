import { z } from 'zod';
export declare const difficultyEnum: z.ZodEnum<["easy", "medium", "hard"]>;
export declare const wordSchema: z.ZodObject<{
    word: z.ZodString;
    reading: z.ZodString;
    contextExpl: z.ZodString;
    sceneDesc: z.ZodString;
    example: z.ZodString;
    difficulty: z.ZodDefault<z.ZodEnum<["easy", "medium", "hard"]>>;
    ef: z.ZodDefault<z.ZodNumber>;
    intervalDays: z.ZodDefault<z.ZodNumber>;
    repetition: z.ZodDefault<z.ZodNumber>;
    lastReviewAt: z.ZodOptional<z.ZodString>;
    nextDueAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    word: string;
    reading: string;
    contextExpl: string;
    sceneDesc: string;
    example: string;
    difficulty: "easy" | "medium" | "hard";
    ef: number;
    intervalDays: number;
    repetition: number;
    lastReviewAt?: string | undefined;
    nextDueAt?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    word: string;
    reading: string;
    contextExpl: string;
    sceneDesc: string;
    example: string;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    ef?: number | undefined;
    intervalDays?: number | undefined;
    repetition?: number | undefined;
    lastReviewAt?: string | undefined;
    nextDueAt?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type Word = z.infer<typeof wordSchema>;
//# sourceMappingURL=index.d.ts.map