import { randomUUID } from 'node:crypto';

import {
  AiGenerateRequest,
  AiGenerateResponse,
  AiScenario,
  aiExampleResultSchema,
  aiGenerateRequestSchema,
  aiWordEnrichResultSchema,
} from '@shared/types';
import { renderPrompt } from '@shared/ai';

import { ProviderRegistry } from '../ai/provider-registry';
import { withRetry } from '../ai/retry';
import { withTimeout } from '../ai/timeout';
import { AiRequestRepository } from '../db/repositories/ai-request-repository';
import { WordRepository } from '../db/repositories/word-repository';
import { NotFoundError, HttpError } from '../api/errors';

type ParsedResult =
  | ReturnType<typeof aiWordEnrichResultSchema.parse>
  | ReturnType<typeof aiExampleResultSchema.parse>;

export class AiService {
  constructor(
    private providers: ProviderRegistry,
    private aiRequestRepo: AiRequestRepository,
    private wordRepo: WordRepository
  ) {}

  async generate(input: AiGenerateRequest): Promise<AiGenerateResponse> {
    const parsed = aiGenerateRequestSchema.parse(input);
    const prompt = renderPrompt(parsed.scenario, parsed.payload);
    const provider = this.providers.get(parsed.provider);
    const traceId = randomUUID();
    const startedAt = Date.now();

    try {
      const rawResult = await this.providers.run(provider, () =>
        withRetry(
          () =>
            withTimeout(
              provider.generate({
                prompt,
                scenario: parsed.scenario,
                payload: parsed.payload,
              }),
              this.timeoutForScenario(parsed.scenario),
              `${provider.name}:${parsed.scenario}`
            ),
          { retries: 1, delayMs: 600 }
        )
      );

      const parsedResult = this.parseResult(parsed.scenario, rawResult.content);
      const latencyMs = Date.now() - startedAt;
      let persistedWordId: number | undefined;

      if (parsed.persist?.wordId) {
        persistedWordId = this.persistResult(
          parsed.persist.wordId,
          parsed.scenario,
          parsedResult,
          parsed.persist.mode
        );
      }

      this.aiRequestRepo.logSuccess({
        traceId,
        scenario: parsed.scenario,
        provider: provider.name,
        wordId: parsed.persist?.wordId,
        input: { payload: parsed.payload, prompt },
        output: parsedResult,
        latencyMs,
      });

      return {
        traceId,
        scenario: parsed.scenario,
        provider: provider.name,
        prompt: {
          system: prompt.system,
          user: prompt.user,
        },
        latencyMs,
        result: parsedResult as ParsedResult,
        persistedWordId,
      } as AiGenerateResponse;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      this.aiRequestRepo.logError({
        traceId,
        scenario: parsed.scenario,
        provider: provider.name,
        wordId: parsed.persist?.wordId,
        input: { payload: parsed.payload, prompt },
        errorMessage: (error as Error)?.message,
        latencyMs,
      });

      throw new HttpError(502, 'AI_GENERATION_FAILED', 'AI generation failed', {
        traceId,
        provider: provider.name,
      });
    }
  }

  private parseResult(scenario: AiScenario, content: string): ParsedResult {
    const cleaned = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let json: unknown;
    try {
      json = JSON.parse(cleaned);
    } catch (error) {
      throw new Error(`Failed to parse model output: ${(error as Error).message}`);
    }

    if (scenario === 'wordEnrich') {
      return aiWordEnrichResultSchema.parse(json);
    }
    return aiExampleResultSchema.parse(json);
  }

  private persistResult(
    wordId: number,
    scenario: AiScenario,
    result: ParsedResult,
    mode: 'fill-empty' | 'overwrite' = 'fill-empty'
  ) {
    const existing = this.wordRepo.getById(wordId);
    if (!existing) throw new NotFoundError('Word not found for persistence');

    const shouldUpdate = (current: string) =>
      mode === 'overwrite' || current.trim().length === 0;

    const patch: Record<string, unknown> = {};

    if ('reading' in result && shouldUpdate(existing.reading)) {
      patch.reading = result.reading;
    }
    if ('contextExpl' in result && shouldUpdate(existing.contextExpl)) {
      patch.contextExpl = result.contextExpl;
    }
    if ('sceneDesc' in result && shouldUpdate(existing.sceneDesc)) {
      patch.sceneDesc = result.sceneDesc;
    }
    if ('example' in result && shouldUpdate(existing.example)) {
      patch.example = result.example;
    }
    if ('difficulty' in result && result.difficulty) {
      patch.difficulty = result.difficulty;
    }

    if (Object.keys(patch).length > 0) {
      this.wordRepo.update(wordId, patch);
    }

    return wordId;
  }

  private timeoutForScenario(scenario: AiScenario) {
    return scenario === 'exampleOnly' ? 8000 : 12000;
  }
}