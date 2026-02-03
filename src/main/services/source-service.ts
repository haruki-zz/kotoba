import { SourceCreateInput, SourceRecord } from '@shared/types';

import { SourceRepository } from '../db/repositories/source-repository';

export class SourceService {
  constructor(private sourceRepo: SourceRepository) {}

  list(): SourceRecord[] {
    return this.sourceRepo.listAll();
  }

  get(id: number): SourceRecord | undefined {
    return this.sourceRepo.findById(id);
  }

  upsert(input: SourceCreateInput): SourceRecord {
    return this.sourceRepo.upsert(input);
  }
}
